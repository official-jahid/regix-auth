"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const resourceSchema = z.object({
  type: z
    .string()
    .min(1, { error: "Type is required" })
    .max(32, { error: "Type is too long" })
    .trim(),
  title: z
    .string()
    .min(1, { error: "Title is required" })
    .max(120, { error: "Title is too long" })
    .trim(),
  content: z
    .string()
    .min(1, { error: "Content is required" })
    .max(2000, { error: "Content is too long" })
    .trim(),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

const requireAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return session;
};

const requireMember = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Not authorized");
  }

  return session;
};

export const listResources = async () => {
  await requireAdmin();
  return prisma.resource.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
};

export const createResource = async (raw: ResourceInput) => {
  await requireAdmin();
  const parsed = resourceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }

  const item = await prisma.resource.create({ data: parsed.data });
  return { id: item.id };
};

export const deleteResource = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.resource.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Resource no longer exists." };
  }

  await prisma.resource.delete({ where: { id } });
  return { id };
};

export const getMemberResources = async () => {
  await requireMember();
  return prisma.resource.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, type: true, title: true, content: true },
  });
};
