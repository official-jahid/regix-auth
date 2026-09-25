import { auth } from "../src/lib/auth";
import prisma from "../src/lib/dbClient/prisma";
import { serverEnv } from "../src/lib/env/serverEnv";

const seedUser = async ({
  email,
  password,
  username,
  name,
  role,
}: {
  email: string;
  password: string;
  username: string;
  name: string;
  role: "admin" | "reseller" | "user";
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role,
        username: existing.username ?? username.toLowerCase(),
        emailVerified: true,
        banned: false,
      },
    });
    console.log(`Seed: kept existing ${role} ${email}`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name, username },
  });

  await prisma.user.update({
    where: { email },
    data: { role, emailVerified: true, banned: false },
  });
  console.log(`Seed: created ${role} ${email}`);
};

const seed = async () => {
  await seedUser({
    email: serverEnv.ADMIN_EMAIL,
    password: serverEnv.ADMIN_PASSWORD,
    username: serverEnv.ADMIN_USERNAME,
    name: "REGIX Admin",
    role: "admin",
  });

  await seedUser({
    email: serverEnv.USER_EMAIL ?? "user@regix.studio",
    password: serverEnv.USER_PASSWORD ?? "User@12345",
    username: serverEnv.USER_USERNAME ?? "regixuser",
    name: "REGIX User",
    role: "user",
  });

  await seedUser({
    email: serverEnv.RESELLER_EMAIL ?? "reseller@regix.studio",
    password: serverEnv.RESELLER_PASSWORD ?? "Reseller@12345",
    username: serverEnv.RESELLER_USERNAME ?? "regixreseller",
    name: "REGIX Reseller",
    role: "reseller",
  });

  const resellerEmail = serverEnv.RESELLER_EMAIL ?? "reseller@regix.studio";
  await prisma.user.update({
    where: { email: resellerEmail },
    data: { provider: serverEnv.RESELLER_PROVIDER ?? "REGIX" },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
