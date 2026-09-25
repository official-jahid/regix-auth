"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const postInputSchema = z.object({
  title: z
    .string()
    .min(1, { error: "Title is required" })
    .max(150, { error: "Title is too long" })
    .trim(),
  excerpt: z.string().max(300).trim().optional(),
  content: z.string().min(1, { error: "Content is required" }).trim(),
  coverUrl: z.union([z.literal(""), z.url()]).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});

export type PostInput = z.infer<typeof postInputSchema>;

const emptyToUndefined = (value: string | undefined) =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const requireAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return session;
};

const slugify = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const ensureUniqueSlug = async (base: string, excludePostId?: string) => {
  let slug = base;
  let attempt = 1;

  for (;;) {
    const [category, tag, post] = await Promise.all([
      prisma.category.findUnique({ where: { slug }, select: { id: true } }),
      prisma.tag.findUnique({ where: { slug }, select: { id: true } }),
      prisma.post.findUnique({ where: { slug }, select: { id: true } }),
    ]);

    if (!category && !tag && (!post || post.id === excludePostId)) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

export const listPosts = async ({
  q = "",
  status = "all",
  categoryId = "",
  tagId = "",
  sort = "newest",
  dir = "desc",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  status?: string;
  categoryId?: string;
  tagId?: string;
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
          { title: { contains: q.trim() } },
          { slug: { contains: q.trim() } },
        ],
      }),
    ...(status === "all" ? {} : { status }),
    ...(categoryId === "" ? {} : { categories: { some: { categoryId } } }),
    ...(tagId === "" ? {} : { tags: { some: { tagId } } }),
  };

  const orderDir = (dir === "asc" ? "asc" : "desc") as "asc" | "desc";
  const orderBy =
    sort === "title" ? [{ title: orderDir }] : [{ createdAt: orderDir }];

  const [total, items] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
        tags: { select: { tag: { select: { id: true, name: true } } } },
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

export const getPost = async (id: string) => {
  await requireAdmin();
  return prisma.post.findUnique({
    where: { id },
    include: {
      categories: { select: { categoryId: true } },
      tags: { select: { tagId: true } },
    },
  });
};

export const getPostPickerOptions = async () => {
  await requireAdmin();

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.tag.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const byId = new Map(categories.map((row) => [row.id, row]));
  const categoryOptions = categories.map((row) => {
    const trail: string[] = [row.name];
    let current = row.parentId ? byId.get(row.parentId) : undefined;
    while (current) {
      trail.unshift(current.name);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return { id: row.id, label: trail.join(" / ") };
  });

  return {
    categoryOptions,
    tagOptions: tags.map((row) => ({ id: row.id, label: row.name })),
  };
};

export const createPost = async (raw: PostInput) => {
  await requireAdmin();
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = parsed.data;

  const [validCategories, validTags] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: input.categoryIds } },
      select: { id: true },
    }),
    prisma.tag.findMany({
      where: { id: { in: input.tagIds } },
      select: { id: true },
    }),
  ]);
  if (validCategories.length !== input.categoryIds.length) {
    return { error: "A selected category no longer exists." };
  }
  if (validTags.length !== input.tagIds.length) {
    return { error: "A selected tag no longer exists." };
  }

  const slug = await ensureUniqueSlug(slugify(input.title));
  const publishedAt = input.status === "published" ? new Date() : undefined;

  const post = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      excerpt: emptyToUndefined(input.excerpt),
      content: input.content,
      coverUrl: emptyToUndefined(input.coverUrl),
      status: input.status,
      publishedAt,
      categories: {
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
      tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
    },
  });
  return { id: post.id };
};

export const updatePost = async (id: string, raw: PostInput) => {
  await requireAdmin();
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const input = parsed.data;

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, publishedAt: true },
  });
  if (!existing) {
    return { error: "Post no longer exists." };
  }

  const [validCategories, validTags] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: input.categoryIds } },
      select: { id: true },
    }),
    prisma.tag.findMany({
      where: { id: { in: input.tagIds } },
      select: { id: true },
    }),
  ]);
  if (validCategories.length !== input.categoryIds.length) {
    return { error: "A selected category no longer exists." };
  }
  if (validTags.length !== input.tagIds.length) {
    return { error: "A selected tag no longer exists." };
  }

  await prisma.$transaction([
    prisma.postCategory.deleteMany({ where: { postId: id } }),
    prisma.postTag.deleteMany({ where: { postId: id } }),
    prisma.post.update({
      where: { id },
      data: {
        title: input.title,
        excerpt: emptyToUndefined(input.excerpt),
        content: input.content,
        coverUrl: emptyToUndefined(input.coverUrl),
        status: input.status,
        publishedAt:
          input.status === "published" ?
            (existing.publishedAt ?? new Date())
          : null,
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);
  return { id };
};

export const deletePost = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Post no longer exists." };
  }

  await prisma.post.delete({ where: { id } });
  return { id };
};
