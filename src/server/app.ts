import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
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

export function createApp() {
  const app = express();

  // Trust proxy for Vercel, Docker, Replit, reverse proxies
  app.set('trust proxy', 1);

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

      res.json({
        status: 'ready',
        database: 'connected',
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

  // Return JSON 404 for unknown /api/* requests
  app.all('/api/*', (_req: Request, res: Response) => {
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
