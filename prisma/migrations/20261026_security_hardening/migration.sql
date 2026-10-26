-- CreateTable RateLimitRecord
CREATE TABLE IF NOT EXISTS "RateLimitRecord" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitRecord_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimitRecord_expiresAt_idx" ON "RateLimitRecord"("expiresAt");

-- CreateTable UploadGrant
CREATE TABLE IF NOT EXISTS "UploadGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "storageUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UploadGrant_userId_idx" ON "UploadGrant"("userId");
CREATE INDEX IF NOT EXISTS "UploadGrant_pathname_idx" ON "UploadGrant"("pathname");
CREATE INDEX IF NOT EXISTS "UploadGrant_storageUrl_idx" ON "UploadGrant"("storageUrl");
CREATE INDEX IF NOT EXISTS "UploadGrant_expiresAt_idx" ON "UploadGrant"("expiresAt");
