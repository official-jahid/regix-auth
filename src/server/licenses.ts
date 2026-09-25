"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const toNullableNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const licenseCreateSchema = z.object({
  provider: z
    .string()
    .min(1, { error: "Provider is required" })
    .max(64, { error: "Provider is too long" })
    .trim(),
  productId: z.string().nullable().optional(),
  durationDays: z.preprocess(
    toNullableNumber,
    z.number().int().min(1).max(36500).nullable().optional(),
  ),
  notes: z.string().max(300).trim().optional(),
});

export type LicenseCreateInput = z.infer<typeof licenseCreateSchema>;

const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Not authorized");
  }

  return session;
};

const getActor = async () => {
  const session = await getSession();
  const role = session.user.role;

  if (role !== "admin" && role !== "reseller") {
    throw new Error("Not authorized");
  }

  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, role: true, provider: true },
  });

  if (!row) {
    throw new Error("Not authorized");
  }

  return { session, row, isAdmin: row.role === "admin" };
};

const generateKey = () =>
  `RGX-${randomBytes(12)
    .toString("hex")
    .toUpperCase()
    .match(/.{1,4}/g)
    ?.join("-")}`;

const ensureUniqueKey = async () => {
  for (;;) {
    const key = generateKey();
    const existing = await prisma.licenseKey.findUnique({
      where: { key },
      select: { id: true },
    });
    if (!existing && key) {
      return key;
    }
  }
};

export const getLicenseCreateContext = async () => {
  const { row, isAdmin } = await getActor();

  const products = await prisma.product.findMany({
    where: { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, expiryDays: true },
  });

  return {
    isAdmin,
    provider: isAdmin ? "REGIX" : (row.provider ?? "REGIX"),
    resellerName: row.username ?? "",
    products,
  };
};

export const listLicenses = async ({
  q = "",
  status = "all",
  used = "all",
  sort = "newest",
  dir = "desc",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  status?: string;
  used?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { row, isAdmin } = await getActor();
  const provider = row.provider ?? "REGIX";

  const where = {
    ...(isAdmin ? {} : { provider }),
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { key: { contains: q.trim() } },
          { provider: { contains: q.trim() } },
          { usedBy: { contains: q.trim() } },
        ],
      }),
    ...(status === "all" ? {}
    : status === "active" ? { active: true }
    : { active: false }),
    ...(used === "all" ? {}
    : used === "used" ? { isUsed: true }
    : { isUsed: false }),
  };

  const orderDir = (dir === "asc" ? "asc" : "desc") as "asc" | "desc";
  const orderBy =
    sort === "provider" ? [{ provider: orderDir }] : [{ createdAt: orderDir }];

  const [total, items] = await Promise.all([
    prisma.licenseKey.count({ where }),
    prisma.licenseKey.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { id: true, name: true } },
        owner: { select: { id: true, username: true, email: true } },
        _count: { select: { activations: true } },
      },
    }),
  ]);

  const actorName = row.username ?? "";

  return {
    items: items.map((item) => ({
      ...item,
      canManage: isAdmin || item.createdById === row.id,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    isAdmin,
    actorName,
  };
};

export const createLicense = async (raw: LicenseCreateInput) => {
  const { row, isAdmin } = await getActor();
  const parsed = licenseCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }

  const provider = isAdmin ? parsed.data.provider : (row.provider ?? "REGIX");

  const productId: string | null = parsed.data.productId ?? null;
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, expiryDays: true },
    });
    if (!product) {
      return { error: "Selected product no longer exists." };
    }
  }

  let durationDays = parsed.data.durationDays ?? null;
  if (durationDays === null && productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { expiryDays: true },
    });
    durationDays = product?.expiryDays ?? null;
  }

  const notes =
    parsed.data.notes === undefined || parsed.data.notes.trim() === "" ?
      undefined
    : parsed.data.notes.trim();

  const key = await ensureUniqueKey();
  const license = await prisma.licenseKey.create({
    data: {
      key,
      provider,
      duration: durationDays === null ? "lifetime" : String(durationDays),
      productId,
      createdById: row.id,
      isUsed: false,
      active: true,
      notes,
    },
  });
  return { id: license.id, key: license.key };
};

export const toggleLicenseActive = async (id: string) => {
  const { row, isAdmin } = await getActor();

  const license = await prisma.licenseKey.findUnique({
    where: { id },
    select: { id: true, active: true, createdById: true },
  });
  if (!license) {
    return { error: "License no longer exists." };
  }
  if (!isAdmin && license.createdById !== row.id) {
    return { error: "You can only manage keys you created." };
  }

  const updated = await prisma.licenseKey.update({
    where: { id },
    data: { active: !license.active },
    select: { id: true, active: true },
  });
  return { id: updated.id, active: updated.active };
};

export const resetLicense = async (id: string) => {
  const { row, isAdmin } = await getActor();

  const license = await prisma.licenseKey.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
  if (!license) {
    return { error: "License no longer exists." };
  }
  if (!isAdmin && license.createdById !== row.id) {
    return { error: "You can only manage keys you created." };
  }

  await prisma.licenseKey.update({
    where: { id },
    data: {
      isUsed: false,
      usedBy: null,
      ownerId: null,
      expiresAt: null,
      active: true,
    },
  });
  return { id };
};

export const deleteLicense = async (id: string) => {
  const { row, isAdmin } = await getActor();

  const license = await prisma.licenseKey.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
  if (!license) {
    return { error: "License no longer exists." };
  }
  if (!isAdmin && license.createdById !== row.id) {
    return { error: "You can only manage keys you created." };
  }

  await prisma.licenseKey.delete({ where: { id } });
  return { id };
};
