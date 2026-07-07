import { PrismaClient } from "@generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@regix-auth.com";
  const adminUsername = process.env.ADMIN_USERNAME ?? "owner";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "RegixAdmin123!";

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

  await prisma.user.create({
    data: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      displayName: "System Admin",
      role: "ADMIN",
      isActive: true,
      isBlacklisted: false,
    },
  });

  console.log("✅ Admin account created successfully!");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Username: ${adminUsername}`);
  console.log("   PLEASE CHANGE YOUR PASSWORD ON FIRST LOGIN!");
}

main()
  .catch((e) => {
    console.error("Failed to seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
