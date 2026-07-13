-- CreateTable
CREATE TABLE "bot_whitelist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "guild_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "verificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedRoleId" TEXT,
    "verificationChannelId" TEXT,
    "antiNukeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "antiRaidEnabled" BOOLEAN NOT NULL DEFAULT false,
    "antiSpamEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "anti_nuke_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "banLimit" INTEGER NOT NULL DEFAULT 5,
    "kickLimit" INTEGER NOT NULL DEFAULT 5,
    "channelDeleteLimit" INTEGER NOT NULL DEFAULT 3,
    "channelCreateLimit" INTEGER NOT NULL DEFAULT 3,
    "roleCreateLimit" INTEGER NOT NULL DEFAULT 3,
    "roleDeleteLimit" INTEGER NOT NULL DEFAULT 3,
    "webhookLimit" INTEGER NOT NULL DEFAULT 3,
    "punishment" TEXT NOT NULL DEFAULT 'ban',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "anti_raid_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "joinThreshold" INTEGER NOT NULL DEFAULT 10,
    "joinTimeWindow" INTEGER NOT NULL DEFAULT 10,
    "messageThreshold" INTEGER NOT NULL DEFAULT 20,
    "messageTimeWindow" INTEGER NOT NULL DEFAULT 10,
    "mentionThreshold" INTEGER NOT NULL DEFAULT 10,
    "punishment" TEXT NOT NULL DEFAULT 'ban',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "anti_spam_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "messageLimit" INTEGER NOT NULL DEFAULT 5,
    "timeWindow" INTEGER NOT NULL DEFAULT 5,
    "duplicateLimit" INTEGER NOT NULL DEFAULT 3,
    "punishment" TEXT NOT NULL DEFAULT 'mute',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guildId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admin_ip_allowlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "label" TEXT,
    "addedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "totp_secret" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "totp_backup_code" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_whitelist_discordId_key" ON "bot_whitelist"("discordId");

-- CreateIndex
CREATE INDEX "bot_whitelist_discordId_idx" ON "bot_whitelist"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_settings_guildId_key" ON "guild_settings"("guildId");

-- CreateIndex
CREATE INDEX "guild_settings_guildId_idx" ON "guild_settings"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "anti_nuke_config_guildId_key" ON "anti_nuke_config"("guildId");

-- CreateIndex
CREATE INDEX "anti_nuke_config_guildId_idx" ON "anti_nuke_config"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "anti_raid_config_guildId_key" ON "anti_raid_config"("guildId");

-- CreateIndex
CREATE INDEX "anti_raid_config_guildId_idx" ON "anti_raid_config"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "anti_spam_config_guildId_key" ON "anti_spam_config"("guildId");

-- CreateIndex
CREATE INDEX "anti_spam_config_guildId_idx" ON "anti_spam_config"("guildId");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_guildId_idx" ON "audit_log"("guildId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_ip_allowlist_ipAddress_key" ON "admin_ip_allowlist"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "totp_secret_userId_key" ON "totp_secret"("userId");

-- CreateIndex
CREATE INDEX "totp_secret_userId_idx" ON "totp_secret"("userId");

-- CreateIndex
CREATE INDEX "totp_backup_code_userId_idx" ON "totp_backup_code"("userId");
