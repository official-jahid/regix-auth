-- AlterTable
ALTER TABLE "user" ADD COLUMN "provider" TEXT;

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "expiryDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "license_key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'REGIX',
    "duration" TEXT,
    "productId" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "license_key_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "license_key_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "license_key_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "deviceId" TEXT,
    "ip" TEXT,
    "sid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "license_key" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "renewal_request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "requesterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "renewal_request_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "license_key" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "renewal_request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE INDEX "product_sortOrder_idx" ON "product"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");

-- CreateIndex
CREATE INDEX "license_key_productId_idx" ON "license_key"("productId");

-- CreateIndex
CREATE INDEX "license_key_ownerId_idx" ON "license_key"("ownerId");

-- CreateIndex
CREATE INDEX "license_key_createdById_idx" ON "license_key"("createdById");

-- CreateIndex
CREATE INDEX "license_key_provider_idx" ON "license_key"("provider");

-- CreateIndex
CREATE INDEX "license_key_active_idx" ON "license_key"("active");

-- CreateIndex
CREATE UNIQUE INDEX "license_key_key_key" ON "license_key"("key");

-- CreateIndex
CREATE INDEX "activation_licenseId_idx" ON "activation"("licenseId");

-- CreateIndex
CREATE INDEX "activation_active_idx" ON "activation"("active");

-- CreateIndex
CREATE INDEX "renewal_request_licenseId_idx" ON "renewal_request"("licenseId");

-- CreateIndex
CREATE INDEX "renewal_request_status_idx" ON "renewal_request"("status");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_provider_idx" ON "user"("provider");
