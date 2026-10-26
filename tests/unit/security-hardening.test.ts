import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp, prisma } from '../../src/server/app';
import {
  validatePreUploadedAttachment,
  isBlobStorageConfigured,
  assertStorageConfigured,
} from '../../src/server/services/storage';

const app = createApp();

describe('Production Security & Storage Hardening', () => {
  it('confirms public bootstrap endpoint /setup-initial-admin is completely removed', async () => {
    const res = await request(app)
      .post('/api/auth/setup-initial-admin')
      .send({ email: 'attacker@evil.com', password: 'Password123!', name: 'Attacker' });
    
    // Must return 404 Not Found since public bootstrap endpoint is removed
    assert.strictEqual(res.status, 404);
  });

  it('rejects arbitrary URLs in preUploadedAttachments', async () => {
    const userId = 'citizen-user-123';
    const fakeAttachment = {
      originalFilename: 'photo.jpg',
      storageFilename: 'https://evil-hacker.com/malicious-payload.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
    };

    const validation = await validatePreUploadedAttachment(fakeAttachment, userId, prisma);
    assert.strictEqual(validation.valid, false);
    assert.match(validation.error || '', /Untrusted storage host/i);
  });

  it('rejects another user’s blob uploads in preUploadedAttachments', async () => {
    const submittingUserId = 'legitimate-citizen-123';
    const anotherUserId = 'victim-citizen-456';

    const hijackedAttachment = {
      originalFilename: 'evidence.jpg',
      storageFilename: `https://store123.private.blob.vercel-storage.com/attachments/users/${anotherUserId}/1234567-photo.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 2048,
    };

    const validation = await validatePreUploadedAttachment(hijackedAttachment, submittingUserId, prisma);
    assert.strictEqual(validation.valid, false);
    assert.match(validation.error || '', /ownership mismatch/i);
  });

  it('accepts legitimate preUploadedAttachments belonging strictly to the submitting user', async () => {
    const submittingUserId = 'valid-citizen-789';

    const validAttachment = {
      originalFilename: 'pothole.jpg',
      storageFilename: `https://store123.private.blob.vercel-storage.com/attachments/users/${submittingUserId}/1792994000-abc12345.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 1024 * 500, // 500 KB
    };

    const validation = await validatePreUploadedAttachment(validAttachment, submittingUserId, prisma);
    assert.strictEqual(validation.valid, true);
  });

  it('rejects pre-uploaded attachments exceeding 5MB or with disallowed MIME types', async () => {
    const userId = 'citizen-user-123';

    // File too large (> 5MB)
    const largeAttachment = {
      originalFilename: 'massive.jpg',
      storageFilename: `https://store123.private.blob.vercel-storage.com/attachments/users/${userId}/photo.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 6 * 1024 * 1024, // 6 MB
    };
    const sizeValidation = await validatePreUploadedAttachment(largeAttachment, userId, prisma);
    assert.strictEqual(sizeValidation.valid, false);
    assert.match(sizeValidation.error || '', /exceeds the 5MB size limit/i);

    // Disallowed MIME type
    const exeAttachment = {
      originalFilename: 'script.exe',
      storageFilename: `https://store123.private.blob.vercel-storage.com/attachments/users/${userId}/script.exe`,
      mimeType: 'application/x-msdownload',
      fileSize: 1024,
    };
    const mimeValidation = await validatePreUploadedAttachment(exeAttachment, userId, prisma);
    assert.strictEqual(mimeValidation.valid, false);
    assert.match(mimeValidation.error || '', /Disallowed MIME type/i);
  });

  it('fails clearly in production when required storage credentials are missing', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.BLOB_READ_WRITE_TOKEN;

      assert.throws(
        () => {
          assertStorageConfigured();
        },
        /CRITICAL STORAGE ERROR: BLOB_READ_WRITE_TOKEN is missing in production/i
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalBlobToken) {
        process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
      }
    }
  });

  it('restricts credentialed CORS in production and rejects unauthorized *.vercel.app domains', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalOrigin = process.env.APP_ORIGIN;

    try {
      process.env.NODE_ENV = 'production';
      process.env.APP_ORIGIN = 'https://civicresolve.gov';

      // Re-create app to capture production CORS configuration
      const prodApp = createApp();

      // 1. Authorized origin succeeds
      const allowedRes = await request(prodApp)
        .get('/api/health')
        .set('Origin', 'https://civicresolve.gov');
      assert.strictEqual(allowedRes.status, 200);
      assert.strictEqual(allowedRes.headers['access-control-allow-origin'], 'https://civicresolve.gov');

      // 2. Arbitrary external *.vercel.app domain is blocked
      const blockedRes = await request(prodApp)
        .get('/api/health')
        .set('Origin', 'https://attacker-app.vercel.app');
      
      // Express CORS throws an error when blocked, caught by global handler (500)
      assert.strictEqual(blockedRes.status, 500);
      assert.match(blockedRes.body.error, /CORS blocked/i);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.APP_ORIGIN = originalOrigin;
    }
  });

  it('fails clearly in production when JWT_SECRET is missing or insecure', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      const { assertAuthConfigured } = require('../../src/server/middleware/auth');
      assert.throws(
        () => {
          assertAuthConfigured();
        },
        /CRITICAL AUTH ERROR: A secure, strong JWT_SECRET/i
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      }
    }
  });

  it('enforces staff department isolation on retry-analysis endpoint', async () => {
    // 1. Log in as Electrical staff
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff.electrical@civicresolve.gov',
        password: 'Staff123!',
      });
    assert.strictEqual(staffLogin.status, 200);
    const staffCookie = staffLogin.headers['set-cookie'];

    // 2. Find a Roads complaint (assigned to Roads, not Electrical)
    const roadsComplaint = await prisma.complaint.findFirst({
      where: { department: { code: 'ROADS' } },
    });
    assert.ok(roadsComplaint, 'Roads complaint must exist in database');

    // 3. Electrical staff attempts to trigger retry-analysis on Roads complaint
    const forbiddenRes = await request(app)
      .post(`/api/complaints/${roadsComplaint.id}/retry-analysis`)
      .set('Cookie', staffCookie);

    assert.strictEqual(forbiddenRes.status, 403);
    assert.match(forbiddenRes.body.error, /Access denied: You can only retry analysis for complaints assigned to your department/i);
  });

  it('enforces CSRF defense against unauthorized cross-site mutations', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen.jane@example.com',
        password: 'Citizen123!',
      });
    const sessionCookie = loginRes.headers['set-cookie'];

    // Cross-site fetch metadata attempt with session cookie must be blocked with 403
    const crossSiteRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', sessionCookie)
      .set('Origin', 'http://localhost:5000')
      .set('Sec-Fetch-Site', 'cross-site')
      .send({ title: 'Hacked Pothole', description: 'Cross site request forgery attempt' });

    assert.strictEqual(crossSiteRes.status, 403);
    assert.match(crossSiteRes.body.error, /Cross-site request blocked/i);

    // Browser request with missing CSRF token header must be blocked with 403
    const missingTokenRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', sessionCookie)
      .set('Origin', 'http://localhost:5000')
      .set('Sec-Fetch-Mode', 'cors')
      .send({ title: 'Hacked Pothole', description: 'Cross site request forgery attempt' });

    assert.strictEqual(missingTokenRes.status, 403);
    assert.match(missingTokenRes.body.error, /Missing CSRF token header/i);
  });

  it('enforces rate limiting abuse protection when threshold is exceeded', async () => {
    const { consumeRateLimit } = require('../../src/server/services/rateLimit');
    const testKey = `test:ip:abuse-${Date.now()}`;
    const maxPoints = 3;
    const windowSeconds = 60;

    const r1 = await consumeRateLimit(testKey, maxPoints, windowSeconds);
    assert.strictEqual(r1.allowed, true);

    const r2 = await consumeRateLimit(testKey, maxPoints, windowSeconds);
    assert.strictEqual(r2.allowed, true);

    const r3 = await consumeRateLimit(testKey, maxPoints, windowSeconds);
    assert.strictEqual(r3.allowed, true);

    // 4th call exceeds maxPoints (3)
    const r4 = await consumeRateLimit(testKey, maxPoints, windowSeconds);
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);
    assert.ok(r4.retryAfterSeconds > 0);
  });

  it('provides lightweight /api status and issues request correlation ID', async () => {
    const res = await request(app).get('/api');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'operational');
    assert.ok(res.headers['x-request-id'], 'Must include X-Request-Id header');
  });

  it('returns structured JSON 404 for unknown /api subpaths', async () => {
    const res = await request(app).get('/api/definitely-not-a-valid-route');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'API endpoint not found');
  });

  it('readiness endpoint safely reports dependency health without secret disclosure', async () => {
    const res = await request(app).get('/api/ready');
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.status);
    assert.ok(res.body.database);
    // Never expose secret strings or tokens in readiness payload
    const bodyStr = JSON.stringify(res.body);
    assert.strictEqual(bodyStr.includes('Admin123!'), false);
    assert.strictEqual(bodyStr.includes('postgres://'), false);
  });
});
