"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const tagInputSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(100, { error: "Name is too long" })
    .trim(),
  description: z.string().max(500).trim().optional(),
  color: z.string().max(16).trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type TagInput = z.infer<typeof tagInputSchema>;

const emptyToUndefined = (value: string | undefined) =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const normalizeInput = (input: TagInput) => ({
  name: input.name,
  description: emptyToUndefined(input.description),
  color: emptyToUndefined(input.color),
  sortOrder: input.sortOrder,
  status: input.status,
});

const requireAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
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
    const [category, tag, post] = await Promise.all([
      prisma.category.findUnique({ where: { slug }, select: { id: true } }),
      prisma.tag.findUnique({ where: { slug }, select: { id: true } }),
      prisma.post.findUnique({ where: { slug }, select: { id: true } }),
    ]);

    if (!category && !tag && !post) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

export const listTags = async ({
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
  await requireAdmin();

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
    prisma.tag.count({ where }),
    prisma.tag.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { posts: true } },
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

export const getTag = async (id: string) => {
  await requireAdmin();
  return prisma.tag.findUnique({ where: { id } });
};

export const createTag = async (raw: TagInput) => {
  await requireAdmin();
  const parsed = tagInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  const slug = await ensureUniqueSlug(slugify(input.name));
  const tag = await prisma.tag.create({
    data: { ...input, slug },
  });
  return { id: tag.id };
};

export const updateTag = async (id: string, raw: TagInput) => {
  await requireAdmin();
  const parsed = tagInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  const existing = await prisma.tag.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Tag no longer exists." };
  }

  await prisma.tag.update({
    where: { id },
    data: input,
  });
  return { id };
};

export const deleteTag = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.tag.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Tag no longer exists." };
  }

  await prisma.tag.delete({ where: { id } });
  return { id };
};
