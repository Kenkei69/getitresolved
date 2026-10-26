import { createApp } from '../src/server/app';

let appInstance: any = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  try {
    const app = getApp();

    // If Vercel rewrote the path, restore original requested route from x-matched-path with query string
    const matchedPath = req.headers['x-matched-path'] as string | undefined;
    if (matchedPath && matchedPath.startsWith('/api')) {
      const queryIndex = (req.url || '').indexOf('?');
      const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
      req.url = matchedPath + queryString;
    } else if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Function Crash Caught]', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'Server initialization error. Please verify database and security configuration.'
            : (err.message || 'Server initialization failed'),
      });
    }
  }
}
