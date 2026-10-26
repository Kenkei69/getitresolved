import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { createApp, prisma } from './app';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(`[Getitresolved Server] Running on http://${HOST}:${PORT}`);
  console.log(`[Getitresolved Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Getitresolved Server] AI Provider: ${process.env.AI_PROVIDER || 'fallback'}`);
  console.log(`[Getitresolved Server] Attachments Directory: ${uploadDir}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Getitresolved Server] Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Getitresolved Server] Server closed, database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
