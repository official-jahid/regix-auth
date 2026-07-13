-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_premium_key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "userId" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "isLifetime" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ipLock" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "redeemedAt" DATETIME,
    CONSTRAINT "premium_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_premium_key" ("createdAt", "duration", "expiresAt", "id", "ipLock", "isActive", "isLifetime", "key", "redeemedAt", "userId") SELECT "createdAt", "duration", "expiresAt", "id", "ipLock", "isActive", "isLifetime", "key", "redeemedAt", "userId" FROM "premium_key";
DROP TABLE "premium_key";
ALTER TABLE "new_premium_key" RENAME TO "premium_key";
CREATE UNIQUE INDEX "premium_key_key_key" ON "premium_key"("key");
CREATE INDEX "premium_key_userId_idx" ON "premium_key"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
