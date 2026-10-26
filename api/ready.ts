import { PrismaClient } from '@prisma/client';

export default async function handler(req: any, res: any) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'missing_database_url',
        error: 'DATABASE_URL environment variable is not configured.',
        timestamp: new Date().toISOString(),
      });
    }

    const prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
    } finally {
      await prisma.$disconnect();
    }

    const isProd = process.env.NODE_ENV === 'production';
    const blobConfigured = Boolean(
      process.env.BLOB_READ_WRITE_TOKEN &&
      !process.env.BLOB_READ_WRITE_TOKEN.startsWith('fallback-')
    );

    if (isProd && !blobConfigured) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'connected',
        storage: 'missing_blob_token',
        error: 'Production requires BLOB_READ_WRITE_TOKEN for durable private photo storage.',
        timestamp: new Date().toISOString(),
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (isProd && (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('fallback'))) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'connected',
        auth: 'insecure_or_missing_secret',
        error: 'Authentication misconfiguration in production.',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      auth: 'configured',
      storage: blobConfigured ? 'durable_private_blob' : 'local_disk',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: err.message || 'Database connection check failed',
      timestamp: new Date().toISOString(),
    });
  }
}
