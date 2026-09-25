-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'info',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "announcement_ack" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("announcementId", "userId"),
    CONSTRAINT "announcement_ack_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "announcement_ack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "announcement_active_idx" ON "announcement"("active");

-- CreateIndex
CREATE INDEX "announcement_ack_userId_idx" ON "announcement_ack"("userId");
