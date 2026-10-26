import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UPLOAD_LIMITS } from '../../shared/constants';

const uploadDir =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL ? '/tmp/uploads' : path.resolve(process.cwd(), 'uploads'));

// Ensure directory exists safely
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Upload Directory Setup Notice]', e);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = UPLOAD_LIMITS.allowedExtensions.includes(ext as any) ? ext : '.jpg';
    cb(null, `${Date.now()}-${randomBytes}${safeExt}`);
  },
});

export const complaintUpload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_LIMITS.maxSizeBytes,
    files: UPLOAD_LIMITS.maxFiles,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      UPLOAD_LIMITS.allowedMimeTypes.includes(file.mimetype as any) &&
      UPLOAD_LIMITS.allowedExtensions.includes(ext as any)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP.`));
    }
  },
});
