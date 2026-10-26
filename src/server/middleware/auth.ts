import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, SafeUser } from '../../shared/types';
import { prisma } from '../app';
import { setCsrfCookie } from './csrf';

export interface AuthRequest extends Request {
  user?: SafeUser;
}

const FALLBACK_SECRET = 'civic-resolve-fallback-secret-2026';

export function getJwtSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === FALLBACK_SECRET || secret.length < 32) {
      throw new Error(
        'CRITICAL AUTH ERROR: A secure, strong JWT_SECRET (at least 32 characters) is strictly required in production.'
      );
    }
    return secret;
  }
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}

export function assertAuthConfigured(): void {
  getJwtSecret();
}

const TOKEN_COOKIE_NAME = 'civic_session';

export function signToken(user: SafeUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function setAuthCookie(res: Response, token: string) {
  const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
  setCsrfCookie(res);
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[TOKEN_COOKIE_NAME] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { id: string; email: string; role: Role };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
      },
    });

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, error: 'User account not found.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      createdAt: user.createdAt.toISOString(),
    };

    next();
  } catch (err) {
    clearAuthCookie(res);
    res.status(401).json({ success: false, error: 'Session expired or invalid. Please log in again.' });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] permissions. Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
