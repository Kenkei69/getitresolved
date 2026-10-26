import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

import authRoutes from './routes/auth';
import metaRoutes from './routes/meta';
import complaintsRoutes from './routes/complaints';
import adminRoutes from './routes/admin';
import statsRoutes from './routes/stats';
import { isBlobStorageConfigured } from './services/storage';
import { assertAuthConfigured } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';

export function createApp() {
  const app = express();

  // Trust proxy for Vercel, Docker, reverse proxies
  app.set('trust proxy', 1);

  // Request Correlation ID and Structured Logging (Safe: no passwords, tokens, or private images logged)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawId = req.headers['x-request-id'];
    const requestId =
      typeof rawId === 'string' && rawId.length > 0 && rawId.length < 100
        ? rawId
        : crypto.randomUUID();

    (req as any).id = requestId;
    res.setHeader('X-Request-Id', requestId);

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[HTTP] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms reqId=${requestId}`
        );
      }
    });

    next();
  });

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: blob: https://*.blob.vercel-storage.com; " +
      "connect-src 'self' https://*.blob.vercel-storage.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  });

  // Dynamic CORS restricted strictly to explicitly configured application origins
  const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
    ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const explicitlyAllowedOrigins = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    ...additionalOrigins,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        // In local development / testing, allow localhost and loopback
        if (process.env.NODE_ENV !== 'production') {
          if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
          }
        }
        // In production, strictly match explicitly configured origins (never wildcard *.vercel.app)
        if (explicitlyAllowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(
          new Error(`CORS blocked: Origin "${origin}" is not an authorized application origin.`),
          false
        );
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health and Readiness endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Getitresolved API',
    });
  });

  app.get('/api/ready', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      const isProd = process.env.NODE_ENV === 'production';
      const storageReady = !isProd || isBlobStorageConfigured();

      if (!storageReady) {
        res.status(503).json({
          status: 'not_ready',
          database: 'connected',
          storage: 'missing_blob_token',
          error: 'Production requires BLOB_READ_WRITE_TOKEN for durable private photo storage.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      try {
        assertAuthConfigured();
      } catch (authErr: any) {
        res.status(503).json({
          status: 'not_ready',
          database: 'connected',
          auth: 'insecure_or_missing_secret',
          error: authErr.message || 'Authentication misconfiguration in production.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        status: 'ready',
        database: 'connected',
        auth: 'configured',
        storage: isBlobStorageConfigured() ? 'durable_private_blob' : 'local_disk',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        error: err.message || 'Database connection error',
      });
    }
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api/complaints', complaintsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/stats', statsRoutes);

  // Root /api operational endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'Getitresolved Civic Management API',
      status: 'operational',
      version: '1.0.0',
    });
  });

  // Return JSON 404 for unknown /api/* requests
  app.all(['/api', '/api/*'], (_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  });

  // Serve static assets in production
  const clientDistPaths = [
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(__dirname, '../../dist/client'),
    path.resolve(__dirname, '../client'),
  ];

  let clientDist = clientDistPaths.find((p) => fs.existsSync(p));

  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDist!, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Server Error]', err);
    if (res.headersSent) return;
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'An unexpected internal server error occurred.',
    });
  });

  return app;
}
