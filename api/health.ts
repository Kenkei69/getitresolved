import { PrismaClient } from '@prisma/client';

export default async function handler(req: any, res: any) {
  try {
    let dbStatus = 'unconfigured';
    if (process.env.DATABASE_URL) {
      try {
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
        await prisma.$disconnect();
      } catch (dbErr: any) {
        dbStatus = 'disconnected';
      }
    }

    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Getitresolved API',
    });
  } catch (err: any) {
    res.status(200).json({
      status: 'degraded',
      error: err.message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Getitresolved API',
    });
  }
}
