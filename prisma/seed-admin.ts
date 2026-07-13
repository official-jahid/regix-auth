import { PrismaLibSql } from "@prisma/adapter-libsql";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";

config();

const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ceojahid";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RegixAdmin123!";
const ADMIN_LIFETIME_KEY =
  process.env.ADMIN_LIFETIME_KEY || "REGIX-AAAAA-BBBBB-CCCCC-DDDDD";

async function main() {
  const adapter = new PrismaLibSql({ url: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findFirst({
    where: { name: ADMIN_USERNAME },
  });

  if (existing) {
    console.log(`Admin user already exists: ${existing.name}`);

    // Ensure admin lifetime key exists as an unassigned key
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
          // Do NOT assign to admin user - keep it unassigned so new users can register with it
        },
      });
      console.log(
        `Admin lifetime key created: ${ADMIN_LIFETIME_KEY} (unassigned, available for registration)`,
      );
    } else {
      // If the key exists but is assigned to someone, free it
      if (existingKey.userId) {
        await prisma.premiumKey.update({
          where: { key: ADMIN_LIFETIME_KEY },
          data: { userId: null, status: "active" },
        });
        console.log(
          `Admin lifetime key freed from previous assignment: ${ADMIN_LIFETIME_KEY}`,
        );
      } else {
        console.log(`Admin lifetime key already exists (unassigned)`);
      }
    }

    await prisma.$disconnect();
    return;
  }

  const id = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id,
      name: ADMIN_USERNAME,
      email: `${ADMIN_USERNAME}@discord.local`,
      emailVerified: true,
      role: "admin",
    },
  });

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    },
  });

  // Create the admin lifetime key UNASSIGNED so new users can register with it
  await prisma.premiumKey.create({
    data: {
      id: crypto.randomUUID(),
      key: ADMIN_LIFETIME_KEY,
      duration: 0,
      isLifetime: true,
      isActive: true,
      status: "active",
    },
  });

  console.log(`Admin user created successfully:`);
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(
    `  Lifetime Key: ${ADMIN_LIFETIME_KEY} (unassigned, available for registration)`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed to seed admin:", e);
  process.exit(1);
});
