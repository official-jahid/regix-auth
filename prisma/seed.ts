import { PrismaClient } from "@generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Only seed if all admin env vars are set
  if (!adminEmail || !adminUsername || !adminPassword) {
    console.log("Admin env vars not fully configured. Skipping seed.");
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: adminUsername }],
    },
  });

  if (existingAdmin) {
    console.log("Admin account already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Also generate some demo license keys for testing
  await prisma.user.create({
    data: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      displayName: adminUsername,
      role: "ADMIN",
      isActive: true,
      isBlacklisted: false,
    },
  });

  console.log("Admin account seeded successfully.");
  console.log("IMPORTANT: Change default credentials immediately.");
}

main()
  .catch((e) => {
    console.error("Failed to seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
