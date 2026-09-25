"use server";

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

const productInputSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(100, { error: "Name is too long" })
    .trim(),
  description: z.string().max(500).trim().optional(),
  version: z.string().max(32).trim().optional(),
  expiryDays: z.preprocess(
    toNullableNumber,
    z.number().int().min(1).max(36500).nullable().optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

const emptyToUndefined = (value: string | undefined) =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const normalizeInput = (input: ProductInput) => ({
  name: input.name,
  description: emptyToUndefined(input.description),
  version: emptyToUndefined(input.version),
  expiryDays: input.expiryDays ?? null,
  sortOrder: input.sortOrder,
  status: input.status,
});

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

const requireAdminOrReseller = async () => {
  const session = await getSession();

  if (session.user.role !== "admin" && session.user.role !== "reseller") {
    throw new Error("Not authorized");
  }

  return session;
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const ensureUniqueSlug = async (base: string) => {
  let slug = base;
  let attempt = 1;

  for (;;) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

export const listProducts = async ({
  q = "",
  status = "all",
  sort = "manual",
  dir = "asc",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
}) => {
  await requireAdminOrReseller();

  const where = {
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { name: { contains: q.trim() } },
          { slug: { contains: q.trim() } },
        ],
      }),
    ...(status === "all" ? {} : { status }),
  };

  const direction = dir === "desc" ? "desc" : "asc";
  const orderBy =
    sort === "name" ? [{ name: direction }]
    : sort === "newest" ? [{ createdAt: direction }]
    : [{ sortOrder: direction }, { name: "asc" as const }];

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { licenses: true } },
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

export const getProduct = async (id: string) => {
  await requireAdminOrReseller();
  return prisma.product.findUnique({ where: { id } });
};

export const getProductOptions = async () => {
  await requireAdminOrReseller();
  return prisma.product.findMany({
    where: { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
};

export const createProduct = async (raw: ProductInput) => {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  const slug = await ensureUniqueSlug(slugify(input.name));
  const product = await prisma.product.create({
    data: { ...input, slug },
  });
  return { id: product.id };
};

export const updateProduct = async (id: string, raw: ProductInput) => {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Product no longer exists." };
  }

  await prisma.product.update({
    where: { id },
    data: input,
  });
  return { id };
};

export const deleteProduct = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Product no longer exists." };
  }

  await prisma.product.delete({ where: { id } });
  return { id };
};
