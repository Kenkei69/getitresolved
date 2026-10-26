import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'civic_csrf_token';
const SESSION_COOKIE_NAME = 'civic_session';

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function setCsrfCookie(res: Response, token?: string): string {
  const csrfToken = token || generateCsrfToken();
  const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Accessible to client-side JS for X-CSRF-Token header
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return csrfToken;
}

export function isAllowedOrigin(originHeader: string | undefined): boolean {
  if (!originHeader) return true; // Non-browser / curl

  if (process.env.NODE_ENV !== 'production') {
    if (originHeader.startsWith('http://localhost:') || originHeader.startsWith('http://127.0.0.1:')) {
      return true;
    }
  }

  const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
    ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const explicitlyAllowed = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    ...additionalOrigins,
  ].filter(Boolean) as string[];

  return explicitlyAllowed.includes(originHeader);
}

/**
 * Double Submit Cookie & Origin verification for CSRF mitigation
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // Ensure CSRF token cookie is set on safe requests so the frontend SPA has it ready
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      setCsrfCookie(res);
    }
    next();
    return;
  }

  // 1. Origin and Referer validation: block unauthorized cross-origin mutations
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({
      success: false,
      error: `Cross-site request blocked: Origin "${origin}" is not authorized.`,
    });
    return;
  }

  // 2. Cross-site fetch metadata check
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    res.status(403).json({
      success: false,
      error: 'Cross-site request blocked by browser fetch metadata policy.',
    });
    return;
  }

  // 3. Exempt public authentication endpoints from CSRF token check (they establish sessions)
  const isPublicAuth = req.path === '/api/auth/login' || req.path === '/api/auth/register';
  if (isPublicAuth) {
    next();
    return;
  }

  // 4. Token validation for cookie-authenticated browser mutations
  const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
  const isBearerAuth = Boolean(req.headers.authorization?.startsWith('Bearer '));

  if (hasSessionCookie && !isBearerAuth) {
    const clientCsrfToken = req.headers['x-csrf-token'] as string;
    const cookieCsrfToken = req.cookies?.[CSRF_COOKIE_NAME];

    if (clientCsrfToken) {
      if (!cookieCsrfToken || clientCsrfToken !== cookieCsrfToken) {
        res.status(403).json({
          success: false,
          error: 'Security verification failed: Missing or invalid CSRF token. Please refresh the page and try again.',
        });
        return;
      }
    } else if (cookieCsrfToken && (origin || req.headers['sec-fetch-mode'])) {
      // Browser request that has csrf cookie and origin/sec-fetch-mode but missing header
      res.status(403).json({
        success: false,
        error: 'Security verification failed: Missing CSRF token header.',
      });
      return;
    }
  }

  next();
}
