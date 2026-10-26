import { createApp } from '../src/server/app';

const app = createApp();

export default function handler(req: any, res: any) {
  // Normalize req.url so both /api/... and /... resolve to Express /api/... routes
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}

