import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

// Get departments
router.get('/departments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
});

// Get categories
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true, keywords: true },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// Get service areas
router.get('/service-areas', async (_req: Request, res: Response): Promise<void> => {
  try {
    const areas = await prisma.serviceArea.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });
    res.json({ success: true, data: areas });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch service areas.' });
  }
});

// Get routing rules (publicly viewable reference)
router.get('/routing-rules', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rules = await prisma.routingRule.findMany({
      include: {
        category: { select: { id: true, name: true, code: true } },
        serviceArea: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ category: { name: 'asc' } }, { serviceArea: { name: 'asc' } }],
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch routing rules.' });
  }
});

// Public deployment configuration
router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  const isProd = process.env.NODE_ENV === 'production';
  const enableDemoAccounts =
    process.env.ENABLE_DEMO_ACCOUNTS === 'true' ||
    (!isProd && process.env.ENABLE_DEMO_ACCOUNTS !== 'false');

  res.json({
    success: true,
    data: {
      enableDemoAccounts,
      storageProvider: process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local',
      directUploadEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      aiProvider: process.env.AI_PROVIDER || 'fallback',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
