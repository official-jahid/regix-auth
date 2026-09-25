"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const categoryInputSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(100, { error: "Name is too long" })
    .trim(),
  description: z.string().max(500).trim().optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().max(16).trim().optional(),
  icon: z.string().max(48).trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  seoTitle: z.string().max(120).trim().optional(),
  seoDescription: z.string().max(200).trim().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

const emptyToUndefined = (value: string | undefined) =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const normalizeInput = (input: CategoryInput) => ({
  name: input.name,
  description: emptyToUndefined(input.description),
  parentId: input.parentId ?? null,
  color: emptyToUndefined(input.color),
  icon: emptyToUndefined(input.icon),
  sortOrder: input.sortOrder,
  status: input.status,
  seoTitle: emptyToUndefined(input.seoTitle),
  seoDescription: emptyToUndefined(input.seoDescription),
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

const getDescendantIds = async (id: string) => {
  const all = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const childrenOf = new Map<string, string[]>();
  for (const row of all) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row.id);
    childrenOf.set(row.parentId, list);
  }

  const result = new Set<string>();
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (result.has(current)) continue;
    result.add(current);
    stack.push(...(childrenOf.get(current) ?? []));
  }
  return result;
};

export const listCategories = async ({
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
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        parent: { select: { id: true, name: true } },
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

export const getCategory = async (id: string) => {
  await requireAdmin();
  return prisma.category.findUnique({
    where: { id },
    include: { parent: { select: { id: true, name: true } } },
  });
};

export const getCategoryOptions = async (excludeId?: string) => {
  await requireAdmin();

  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });

  const byId = new Map(all.map((row) => [row.id, row]));
  const excluded = new Set<string>();
  if (excludeId) {
    excluded.add(excludeId);
    for (const id of await getDescendantIds(excludeId)) {
      excluded.add(id);
    }
  }

  return all
    .filter((row) => !excluded.has(row.id))
    .map((row) => {
      const trail: string[] = [row.name];
      let current = row.parentId ? byId.get(row.parentId) : undefined;
      while (current) {
        trail.unshift(current.name);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
      return { id: row.id, label: trail.join(" / ") };
    });
};

export const createCategory = async (raw: CategoryInput) => {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
      select: { id: true },
    });
    if (!parent) {
      return { error: "Selected parent no longer exists." };
    }
  }

  const slug = await ensureUniqueSlug(slugify(input.name));
  const category = await prisma.category.create({
    data: { ...input, slug },
  });
  return { id: category.id };
};

export const updateCategory = async (id: string, raw: CategoryInput) => {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = normalizeInput(parsed.data);

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    return { error: "Category no longer exists." };
  }

  if (input.parentId) {
    if (input.parentId === id) {
      return { error: "A category cannot be its own parent." };
    }
    const descendants = await getDescendantIds(id);
    if (descendants.has(input.parentId)) {
      return { error: "A category cannot move under its own child." };
    }
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
      select: { id: true },
    });
    if (!parent) {
      return { error: "Selected parent no longer exists." };
    }
  }

  await prisma.category.update({
    where: { id },
    data: input,
  });
  return { id };
};

export const deleteCategory = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Category no longer exists." };
  }

  await prisma.category.delete({ where: { id } });
  return { id };
};
