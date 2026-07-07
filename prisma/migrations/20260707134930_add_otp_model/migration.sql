-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OtpCode_userId_type_idx" ON "OtpCode"("userId", "type");

-- CreateIndex
CREATE INDEX "OtpCode_email_code_type_idx" ON "OtpCode"("email", "code", "type");

-- CreateIndex
CREATE INDEX "OtpCode_createdAt_idx" ON "OtpCode"("createdAt");
