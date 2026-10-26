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
});
