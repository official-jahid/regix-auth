import { PrismaLibSql } from "@prisma/adapter-libsql";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";

config();

const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jahidekbalmallick@gmail.com";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ceojahid";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ceoj@hid.admin";
const ADMIN_LIFETIME_KEY =
  process.env.ADMIN_LIFETIME_KEY || "REGIX-AAAAA-BBBBB-CCCCC-DDDDD";

async function main() {
  const adapter = new PrismaLibSql({ url: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`Admin user already exists: ${existing.email}`);

    // Ensure admin lifetime key exists
    const existingKey = await prisma.premiumKey.findUnique({
      where: { key: ADMIN_LIFETIME_KEY },
    });

    if (!existingKey) {
      await prisma.premiumKey.create({
        data: {
          id: crypto.randomUUID(),
          key: ADMIN_LIFETIME_KEY,
          duration: 0,
          isLifetime: true,
          isActive: true,
          status: "active",
          userId: existing.id,
          redeemedAt: new Date(),
        },
      });
      console.log(
        `Admin lifetime key created for existing admin: ${ADMIN_LIFETIME_KEY}`,
      );
    } else {
      console.log(`Admin lifetime key already exists`);
    }

    await prisma.$disconnect();
    return;
  }

  // Generate a unique ID
  const { randomUUID } = await import("crypto");
  const id = randomUUID();

  // Create the user with admin role
  await prisma.user.create({
    data: {
      id,
      name: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "admin",
    },
  });

  // Hash the password using the same format Better Auth uses
  // Better Auth uses bcrypt with the format: $2b$12$...
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Create the account with credential provider
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    },
  });

  // Create admin lifetime key
  await prisma.premiumKey.create({
    data: {
      id: randomUUID(),
      key: ADMIN_LIFETIME_KEY,
      duration: 0,
      isLifetime: true,
      isActive: true,
      status: "active",
      userId: id,
      redeemedAt: new Date(),
    },
  });

  console.log(`Admin user created successfully:`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Lifetime Key: ${ADMIN_LIFETIME_KEY}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed to seed admin:", e);
  process.exit(1);
});
