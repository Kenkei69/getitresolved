import { createApp } from '../src/server/app';

const app = createApp();

export default function handler(req: any, res: any) {
  // If Vercel rewrote the path, restore original requested route from x-matched-path
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  if (matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}

