import { PrismaClient } from "@generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const adapter = new PrismaLibSql({ url: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("Applying schema changes...");

  // 1. Add status column to User table
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE User ADD COLUMN status TEXT NOT NULL DEFAULT 'offline'`,
    );
    console.log("Added status column to User");
  } catch {
    console.log("status column might already exist");
  }

  // 2. Add lastSeenAt column to User table
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE User ADD COLUMN lastSeenAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    console.log("Added lastSeenAt column to User");
  } catch {
    console.log("lastSeenAt column might already exist");
  }

  // Create Conversation table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Conversation (
        id TEXT NOT NULL PRIMARY KEY,
        user1Id TEXT NOT NULL,
        user2Id TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1Id) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (user2Id) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log("Created Conversation table");
  } catch {
    console.log("Conversation table might already exist");
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS Conversation_user1Id_user2Id_key ON Conversation(user1Id, user2Id)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS Conversation_user1Id_idx ON Conversation(user1Id)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS Conversation_user2Id_idx ON Conversation(user2Id)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS Conversation_updatedAt_idx ON Conversation(updatedAt)`,
    );
  } catch {}

  // Create ChatMessage table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ChatMessage (
        id TEXT NOT NULL PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        content TEXT NOT NULL,
        isEdited INTEGER NOT NULL DEFAULT 0,
        isDeleted INTEGER NOT NULL DEFAULT 0,
        deletedAt TEXT,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log("Created ChatMessage table");
  } catch {
    console.log("ChatMessage table might already exist");
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ChatMessage_conversationId_createdAt_idx ON ChatMessage(conversationId, createdAt)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ChatMessage_senderId_idx ON ChatMessage(senderId)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ChatMessage_receiverId_idx ON ChatMessage(receiverId)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ChatMessage_expiresAt_idx ON ChatMessage(expiresAt)`,
    );
  } catch {}

  // Create ChatReaction table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ChatReaction (
        id TEXT NOT NULL PRIMARY KEY,
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        emoji TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (messageId) REFERENCES ChatMessage(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log("Created ChatReaction table");
  } catch {
    console.log("ChatReaction table might already exist");
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS ChatReaction_messageId_userId_emoji_key ON ChatReaction(messageId, userId, emoji)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ChatReaction_messageId_idx ON ChatReaction(messageId)`,
    );
  } catch {}

  // Create ApiKey table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ApiKey (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        keyPrefix TEXT NOT NULL,
        userId TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT 'read',
        isActive INTEGER NOT NULL DEFAULT 1,
        lastUsedAt TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log("Created ApiKey table");
  } catch {
    console.log("ApiKey table might already exist");
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ApiKey_key_idx ON ApiKey(key)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ApiKey_userId_idx ON ApiKey(userId)`,
    );
  } catch {}

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ApiKey_isActive_idx ON ApiKey(isActive)`,
    );
  } catch {}

  // Update existing users with default status
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE User SET status = 'offline' WHERE status IS NULL`,
    );
  } catch {}

  console.log("Schema applied successfully!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
