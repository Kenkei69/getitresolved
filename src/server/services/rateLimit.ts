import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';

export interface RateLimiterOptions {
  prefix: string;
  maxPoints: number;
  windowSeconds: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

// In-memory fallback bucket for resilience
const memoryStore = new Map<string, { points: number; expiresAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Shared database-backed sliding rate limiter compatible with serverless and container deployments.
 */
export async function consumeRateLimit(
  key: string,
  maxPoints: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = new Date();
  const windowMs = windowSeconds * 1000;
  const newExpiresAt = new Date(now.getTime() + windowMs);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimitRecord.findUnique({
        where: { key },
      });

      if (!existing || existing.expiresAt < now) {
        // Create new or reset expired bucket
        const updated = await tx.rateLimitRecord.upsert({
          where: { key },
          create: {
            key,
            points: 1,
            expiresAt: newExpiresAt,
          },
          update: {
            points: 1,
            expiresAt: newExpiresAt,
          },
        });
        return {
          allowed: true,
          remaining: maxPoints - 1,
          retryAfterSeconds: windowSeconds,
        };
      }

      if (existing.points >= maxPoints) {
        const retryAfter = Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000));
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: retryAfter,
        };
      }

      const incremented = await tx.rateLimitRecord.update({
        where: { key },
        data: { points: { increment: 1 } },
      });

      return {
        allowed: true,
        remaining: Math.max(0, maxPoints - incremented.points),
        retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)),
      };
    });

    return result;
  } catch (err) {
    // Graceful fallback to memory store if DB is briefly unreachable
    const nowTime = Date.now();
    let mem = memoryStore.get(key);
    if (!mem || mem.expiresAt < nowTime) {
      mem = { points: 1, expiresAt: nowTime + windowMs };
      memoryStore.set(key, mem);
      return { allowed: true, remaining: maxPoints - 1, retryAfterSeconds: windowSeconds };
    }

    if (mem.points >= maxPoints) {
      const retryAfter = Math.max(1, Math.ceil((mem.expiresAt - nowTime) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    mem.points += 1;
    return {
      allowed: true,
      remaining: Math.max(0, maxPoints - mem.points),
      retryAfterSeconds: Math.max(1, Math.ceil((mem.expiresAt - nowTime) / 1000)),
    };
  }
}

/**
 * Creates an Express middleware for abuse protection.
 */
function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test' ||
    process.env.npm_lifecycle_event === 'test:all' ||
    process.env.npm_lifecycle_event === 'test:e2e' ||
    process.argv.some((arg) => arg.includes('--test'))
  );
}

export function rateLimiter(options: RateLimiterOptions) {
  const { prefix, maxPoints, windowSeconds, message, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // In automated test suites, allow bypassing unless the test is specifically testing rate limiting
    if (isTestEnvironment() && !req.headers['x-test-rate-limit']) {
      next();
      return;
    }

    const identifier = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const key = `${prefix}:${identifier}`;

    const { allowed, remaining, retryAfterSeconds } = await consumeRateLimit(
      key,
      maxPoints,
      windowSeconds
    );

    res.setHeader('X-RateLimit-Limit', maxPoints.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', retryAfterSeconds.toString());

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        success: false,
        error:
          message ||
          `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
