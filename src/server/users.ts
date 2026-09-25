"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const resellerCreateSchema = z.object({
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30, { error: "Username must be at most 30 characters" })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      error: "Username can only contain letters, numbers, and . _ -",
    })
    .trim(),
  email: z.email({ error: "Enter a valid email" }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password is too long" }),
  provider: z
    .string()
    .min(1, { error: "Provider is required" })
    .max(64, { error: "Provider is too long" })
    .trim(),
});

export type ResellerCreateInput = z.infer<typeof resellerCreateSchema>;

const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Not authorized");
  }

  return session;
};

const requireAdmin = async () => {
  const session = await getSession();

  if (session.user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return session;
};

export const listUsers = async ({
  q = "",
  role = "all",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) => {
  const session = await requireAdmin();

  const where = {
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { username: { contains: q.trim() } },
          { email: { contains: q.trim() } },
        ],
      }),
    ...(role === "all" ? {} : { role }),
    id: { not: session.user.id },
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        provider: true,
        banned: true,
        createdAt: true,
        _count: { select: { ownedLicenses: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
};

export const toggleUserBan = async (id: string) => {
  const session = await requireAdmin();

  if (id === session.user.id) {
    return { error: "You cannot ban yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, banned: true },
  });
  if (!target) {
    return { error: "User no longer exists." };
  }
  if (target.role === "admin") {
    return { error: "Admin accounts cannot be banned." };
  }

  const banned = !target.banned;
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        banned,
        banReason: banned ? "Banned by admin." : null,
      },
    }),
    ...(banned ?
      [
        prisma.session.deleteMany({
          where: { userId: id },
        }),
      ]
    : []),
  ]);
  return { id, banned };
};

export const listResellers = async ({
  q = "",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  await requireAdmin();

  const where = {
    role: "reseller",
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { username: { contains: q.trim() } },
          { email: { contains: q.trim() } },
          { provider: { contains: q.trim() } },
        ],
      }),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        email: true,
        provider: true,
        banned: true,
        createdAt: true,
        _count: { select: { createdLicenses: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
};

export const createReseller = async (raw: ResellerCreateInput) => {
  await requireAdmin();
  const parsed = resellerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });
  if (existingUsername) {
    return { error: "Username already exists." };
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existingEmail) {
    return { error: "Email already used." };
  }

  await auth.api.createUser({
    body: {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.username,
      role: "reseller",
      data: { username: parsed.data.username.toLowerCase() },
    },
    headers: await headers(),
  });

  await prisma.user.update({
    where: { email: parsed.data.email },
    data: {
      username: parsed.data.username.toLowerCase(),
      role: "reseller",
      provider: parsed.data.provider,
      emailVerified: true,
      banned: false,
    },
  });

  return { email: parsed.data.email };
};

export const deleteReseller = async (id: string) => {
  const session = await requireAdmin();

  if (id === session.user.id) {
    return { error: "You cannot delete yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target || target.role !== "reseller") {
    return { error: "Reseller no longer exists." };
  }

  await prisma.user.delete({ where: { id } });
  return { id };
};

const getResellerActor = async () => {
  const session = await getSession();
  const role = session.user.role;

  if (role !== "admin" && role !== "reseller") {
    throw new Error("Not authorized");
  }

  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, provider: true },
  });

  if (!row) {
    throw new Error("Not authorized");
  }

  return { row, isAdmin: row.role === "admin" };
};

export const listClients = async ({
  q = "",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { row, isAdmin } = await getResellerActor();
  const provider = row.provider ?? "REGIX";

  const where = {
    role: "user",
    ...(isAdmin ? {} : { provider }),
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { username: { contains: q.trim() } },
          { email: { contains: q.trim() } },
        ],
      }),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        email: true,
        provider: true,
        banned: true,
        ownedLicenses: {
          where: { isUsed: true },
          select: {
            id: true,
            key: true,
            expiresAt: true,
            _count: {
              select: { activations: { where: { active: true } } },
            },
          },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
};

export const toggleClientBan = async (id: string) => {
  const { row, isAdmin } = await getResellerActor();

  if (id === row.id) {
    return { error: "You cannot ban yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, provider: true, banned: true },
  });
  if (!target || target.role !== "user") {
    return { error: "Client no longer exists." };
  }
  if (!isAdmin && target.provider !== (row.provider ?? "REGIX")) {
    return { error: "This client is not under your provider." };
  }

  const banned = !target.banned;
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        banned,
        banReason: banned ? "Banned by provider." : null,
      },
    }),
    ...(banned ?
      [
        prisma.session.deleteMany({
          where: { userId: id },
        }),
      ]
    : []),
  ]);
  return { id, banned };
};

export const resetClientDevices = async (id: string) => {
  const { row, isAdmin } = await getResellerActor();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, provider: true },
  });
  if (!target || target.role !== "user") {
    return { error: "Client no longer exists." };
  }
  if (!isAdmin && target.provider !== (row.provider ?? "REGIX")) {
    return { error: "This client is not under your provider." };
  }

  const cleared = await prisma.activation.updateMany({
    where: {
      active: true,
      license: { ownerId: id },
      ...(isAdmin ? {} : { license: { provider: row.provider ?? "REGIX" } }),
    },
    data: { active: false, revokedAt: new Date() },
  });
  return { id, cleared: cleared.count };
};
