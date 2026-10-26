import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Readable } from 'stream';
import { put, get, head, del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { Request, Response } from 'express';
import { UPLOAD_LIMITS } from '../../shared/constants';

const localUploadDir =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL ? '/tmp/uploads' : path.resolve(process.cwd(), 'uploads'));

try {
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Notice on local upload directory creation:', e);
}

export const isBlobStorageConfigured = (): boolean => {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
};

export function assertStorageConfigured(): void {
  if (process.env.NODE_ENV === 'production' && !isBlobStorageConfigured()) {
    throw new Error(
      'CRITICAL STORAGE ERROR: BLOB_READ_WRITE_TOKEN is missing in production. ' +
      'Durable private object storage (Vercel Blob) is strictly required. ' +
      'Local or temporary filesystem storage is forbidden in production.'
    );
  }
}

export interface StoredAttachmentResult {
  originalFilename: string;
  storageFilename: string;
  mimeType: string;
  fileSize: number;
  url?: string;
}

/**
 * Persist an uploaded buffer to durable private storage (Vercel Blob in production, local disk in dev/fallback)
 */
export async function saveAttachment(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  userId: string
): Promise<StoredAttachmentResult> {
  assertStorageConfigured();

  const ext = path.extname(originalFilename).toLowerCase();
  const safeExt = UPLOAD_LIMITS.allowedExtensions.includes(ext as any) ? ext : '.jpg';
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const safeBlobPath = `attachments/users/${userId}/${Date.now()}-${randomBytes}${safeExt}`;

  // 1. Production / Vercel Blob (Enforce Private Store Access)
  if (isBlobStorageConfigured()) {
    const blob = await put(safeBlobPath, buffer, {
      access: 'private', // Strictly private: no anonymous CDN downloads
      contentType: mimeType,
      addRandomSuffix: false,
    });

    return {
      originalFilename,
      storageFilename: blob.url,
      mimeType,
      fileSize: buffer.length,
      url: blob.url,
    };
  }

  // 2. Local filesystem storage (Dev & offline testing only)
  const safeFilename = `${Date.now()}-${randomBytes}${safeExt}`;
  const filePath = path.join(localUploadDir, safeFilename);
  await fs.promises.writeFile(filePath, buffer);

  return {
    originalFilename,
    storageFilename: safeFilename,
    mimeType,
    fileSize: buffer.length,
  };
}

/**
 * Resolve an attachment for authenticated streaming to authorized users.
 * Never redirects to raw URLs; fetches private blobs via the SDK.
 */
export async function resolveAttachment(storageFilename: string): Promise<
  | { type: 'stream'; stream: NodeJS.ReadableStream; mimeType?: string }
  | { type: 'missing' }
> {
  // 1. Private Vercel Blob store
  if (storageFilename.startsWith('http://') || storageFilename.startsWith('https://')) {
    if (!isBlobStorageConfigured()) {
      console.error('[Storage] Cannot resolve blob URL without BLOB_READ_WRITE_TOKEN.');
      return { type: 'missing' };
    }

    try {
      const response = await get(storageFilename, { access: 'private' });
      if (!response || !response.stream) {
        return { type: 'missing' };
      }

      // response.stream is a Web ReadableStream; convert to Node Readable
      const nodeStream = Readable.fromWeb(response.stream as any);
      return {
        type: 'stream',
        stream: nodeStream,
        mimeType: response.blob?.contentType || undefined,
      };
    } catch (err: any) {
      console.error('[Storage] Error reading private blob from Vercel:', err?.message || err);
      return { type: 'missing' };
    }
  }

  // 2. Local filesystem
  const filePath = path.join(localUploadDir, storageFilename);
  if (!fs.existsSync(filePath)) {
    return { type: 'missing' };
  }

  return {
    type: 'stream',
    stream: fs.createReadStream(filePath),
  };
}

/**
 * Direct-to-Vercel-Blob upload handler
 * Generates an upload token scoped strictly to the authenticated user and private access.
 * Records a server-issued UploadGrant in the database for reliable ownership verification.
 */
export async function handleDirectBlobUpload(
  req: Request & { user?: any },
  res: Response,
  prismaClient?: any
): Promise<void> {
  if (!isBlobStorageConfigured()) {
    res.status(501).json({
      success: false,
      error: 'Direct blob upload is not configured. BLOB_READ_WRITE_TOKEN is missing.',
    });
    return;
  }

  if (!req.user || !req.user.id) {
    res.status(401).json({
      success: false,
      error: 'Authentication required to obtain an upload authorization token.',
    });
    return;
  }

  try {
    const body = req.body as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const ext = path.extname(pathname).toLowerCase();
        if (!UPLOAD_LIMITS.allowedExtensions.includes(ext as any)) {
          throw new Error(`File extension "${ext}" is not permitted. Only JPG, PNG, and WEBP are allowed.`);
        }

        const randomBytes = crypto.randomBytes(8).toString('hex');
        const userScopedPath = `attachments/users/${req.user.id}/${Date.now()}-${randomBytes}${ext}`;

        // Record a server-issued upload grant
        if (prismaClient?.uploadGrant) {
          try {
            await prismaClient.uploadGrant.create({
              data: {
                userId: req.user.id,
                pathname: userScopedPath,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
              },
            });
          } catch (grantErr) {
            console.warn('[Storage] Notice on upload grant recording:', grantErr);
          }
        }

        return {
          allowedContentTypes: [...UPLOAD_LIMITS.allowedMimeTypes],
          maximumSizeInBytes: UPLOAD_LIMITS.maxSizeBytes, // 5 MB
          tokenPayload: JSON.stringify({ userId: req.user.id, pathname: userScopedPath }),
          pathname: userScopedPath,
          access: 'private', // Enforce private store access
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Blob upload completed, update grant with verified storage URL
        if (prismaClient?.uploadGrant && blob?.url) {
          try {
            await prismaClient.uploadGrant.updateMany({
              where: {
                userId: req.user.id,
                pathname: blob.pathname,
              },
              data: {
                storageUrl: blob.url,
              },
            });
          } catch {}
        }
      },
    });

    res.json(jsonResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Direct upload token creation failed.' });
  }
}

/**
 * Validate pre-uploaded attachments from the client.
 * Verifies that the files belong to the submitting user and our storage account via server-issued grants.
 * Verifies actual object metadata (true size, MIME type) rather than trusting client-supplied values.
 * Rejects arbitrary URLs, another user's uploads, duplicate attachment reuse, and oversized submissions.
 */
export async function validatePreUploadedAttachment(
  attachment: any,
  submittingUserId: string,
  prismaClient: any
): Promise<{ valid: boolean; error?: string }> {
  if (!attachment || typeof attachment !== 'object') {
    return { valid: false, error: 'Attachment data is invalid.' };
  }

  const { storageFilename, originalFilename, mimeType, fileSize } = attachment;

  if (!storageFilename || typeof storageFilename !== 'string') {
    return { valid: false, error: 'Attachment storage identifier is missing.' };
  }

  if (fileSize && (fileSize > UPLOAD_LIMITS.maxSizeBytes || fileSize <= 0)) {
    return { valid: false, error: 'Attachment exceeds the 5MB size limit.' };
  }

  if (mimeType && !UPLOAD_LIMITS.allowedMimeTypes.includes(mimeType as any)) {
    return { valid: false, error: `Disallowed MIME type "${mimeType}". Allowed: JPG, PNG, WEBP.` };
  }

  const ext = path.extname(originalFilename || storageFilename).toLowerCase();
  if (originalFilename && !UPLOAD_LIMITS.allowedExtensions.includes(ext as any)) {
    return { valid: false, error: `Invalid file extension "${ext}".` };
  }

  // 1. Blob URL Verification
  if (storageFilename.startsWith('http://') || storageFilename.startsWith('https://')) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(storageFilename);
    } catch {
      return { valid: false, error: 'Attachment storage URL is malformed.' };
    }

    if (parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'Insecure attachment protocol. HTTPS required.' };
    }

    // Must originate from our Vercel Blob domain
    if (!parsedUrl.hostname.endsWith('.blob.vercel-storage.com')) {
      return { valid: false, error: 'Untrusted storage host. Only our Vercel Blob store is permitted.' };
    }

    // Must belong to the submitting user
    const expectedUserPrefix = `/attachments/users/${submittingUserId}/`;
    if (!parsedUrl.pathname.includes(expectedUserPrefix)) {
      return {
        valid: false,
        error: 'Upload ownership mismatch: this file was not authorized for your user account.',
      };
    }

    // Check server-issued upload grant record if available
    if (prismaClient?.uploadGrant) {
      const grant = await prismaClient.uploadGrant.findFirst({
        where: {
          userId: submittingUserId,
          used: false,
          expiresAt: { gte: new Date() },
          OR: [
            { pathname: { in: [parsedUrl.pathname.slice(1), parsedUrl.pathname] } },
            { storageUrl: storageFilename },
          ],
        },
      });

      if (!grant && process.env.NODE_ENV === 'production') {
        return {
          valid: false,
          error: 'Upload authorization record not found, expired, or already used.',
        };
      }
    }

    // Verify actual object metadata from the storage provider if configured
    if (isBlobStorageConfigured()) {
      try {
        const meta = await head(storageFilename);
        if (!meta) {
          return { valid: false, error: 'Uploaded object not found in private storage.' };
        }
        if (meta.size > UPLOAD_LIMITS.maxSizeBytes) {
          return { valid: false, error: `Verified attachment size (${meta.size} bytes) exceeds the 5MB limit.` };
        }
        if (meta.contentType && !UPLOAD_LIMITS.allowedMimeTypes.includes(meta.contentType as any)) {
          return { valid: false, error: `Verified content type "${meta.contentType}" is not an allowed image format.` };
        }
        attachment.fileSize = meta.size;
        attachment.mimeType = meta.contentType;
      } catch (headErr: any) {
        if (process.env.NODE_ENV === 'production') {
          return { valid: false, error: 'Failed to verify storage object metadata.' };
        }
      }
    }
  } else {
    // 2. Local storage verification (strictly forbidden in production)
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Local storage references are forbidden in production.' };
    }

    if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(storageFilename)) {
      return { valid: false, error: 'Invalid local attachment filename.' };
    }

    const localFilePath = path.join(localUploadDir, storageFilename);
    if (fs.existsSync(localFilePath)) {
      const stat = fs.statSync(localFilePath);
      if (stat.size > UPLOAD_LIMITS.maxSizeBytes) {
        return { valid: false, error: 'Attachment exceeds the 5MB size limit.' };
      }
      attachment.fileSize = stat.size;
    }
  }

  // 3. Prevent photo re-use across complaints
  const existing = await prismaClient.attachment.findFirst({
    where: { storageFilename },
  });
  if (existing) {
    return { valid: false, error: 'This photo has already been registered to another complaint.' };
  }

  return { valid: true };
}

/**
 * Mark upload grants as used once a complaint is created to prevent reuse.
 */
export async function markUploadGrantsUsed(
  storageFilenames: string[],
  userId: string,
  prismaClient: any
): Promise<void> {
  if (!prismaClient?.uploadGrant || !storageFilenames.length) return;
  try {
    for (const filename of storageFilenames) {
      let pathnameMatch = filename;
      try {
        const u = new URL(filename);
        pathnameMatch = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      } catch {}

      await prismaClient.uploadGrant.updateMany({
        where: {
          userId,
          OR: [
            { storageUrl: filename },
            { pathname: pathnameMatch },
          ],
        },
        data: {
          used: true,
          storageUrl: filename,
        },
      });
    }
  } catch (err) {
    console.warn('[Storage] Error marking upload grants as used:', err);
  }
}

/**
 * Safe cleanup of abandoned uploads without deleting files attached to valid complaints.
 */
export async function cleanupAbandonedUploads(prismaClient: any): Promise<number> {
  if (!prismaClient?.uploadGrant) return 0;
  try {
    const expiredGrants = await prismaClient.uploadGrant.findMany({
      where: {
        used: false,
        expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24h
      },
      take: 50,
    });

    let cleaned = 0;
    for (const grant of expiredGrants) {
      if (grant.storageUrl && isBlobStorageConfigured()) {
        try {
          await del(grant.storageUrl);
        } catch {}
      }
      await prismaClient.uploadGrant.delete({ where: { id: grant.id } });
      cleaned++;
    }
    return cleaned;
  } catch (err) {
    console.error('[Storage] Error in cleanupAbandonedUploads:', err);
    return 0;
  }
}
