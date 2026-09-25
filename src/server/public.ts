import prisma from "@/lib/dbClient/prisma";

const postSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverUrl: true,
  publishedAt: true,
  createdAt: true,
  categories: {
    select: {
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

export const getPublishedPosts = async () =>
  prisma.post.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: postSelect,
  });

export const getPublishedPostBySlug = async (slug: string) =>
  prisma.post.findFirst({
    where: { slug, status: "published" },
    select: postSelect,
  });

export const getActiveCategories = async () =>
  prisma.category.findMany({
    where: { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: { where: { post: { status: "published" } } },
        },
      },
    },
  });

export const getActiveCategoryBySlug = async (slug: string) =>
  prisma.category.findFirst({
    where: { slug, status: "active" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      posts: {
        where: { post: { status: "published" } },
        select: {
          post: { select: postSelect },
        },
        orderBy: [
          { post: { publishedAt: "desc" } },
          { post: { createdAt: "desc" } },
        ],
      },
    },
  });

export const getActiveTags = async () =>
  prisma.tag.findMany({
    where: { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: { where: { post: { status: "published" } } },
        },
      },
    },
  });

export const getActiveTagBySlug = async (slug: string) =>
  prisma.tag.findFirst({
    where: { slug, status: "active" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      posts: {
        where: { post: { status: "published" } },
        select: {
          post: { select: postSelect },
        },
        orderBy: [
          { post: { publishedAt: "desc" } },
          { post: { createdAt: "desc" } },
        ],
      },
    },
  });
