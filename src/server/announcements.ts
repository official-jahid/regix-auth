"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const announcementSchema = z.object({
  title: z
    .string()
    .min(1, { error: "Title is required" })
    .max(120, { error: "Title is too long" })
    .trim(),
  message: z
    .string()
    .min(1, { error: "Message is required" })
    .max(2000, { error: "Message is too long" })
    .trim(),
  urgency: z.enum(["info", "warning", "critical"]).default("info"),
  active: z.boolean().default(true),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

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

export const listAnnouncements = async () => {
  await requireAdmin();
  return prisma.announcement.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { _count: { select: { acks: true } } },
  });
};

export const createAnnouncement = async (raw: AnnouncementInput) => {
  await requireAdmin();
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }

  const item = await prisma.announcement.create({ data: parsed.data });
  return { id: item.id };
};

export const toggleAnnouncement = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, active: true },
  });
  if (!existing) {
    return { error: "Announcement no longer exists." };
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { active: !existing.active },
    select: { id: true, active: true },
  });
  return { id: updated.id, active: updated.active };
};

export const deleteAnnouncement = async (id: string) => {
  await requireAdmin();
  const existing = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Announcement no longer exists." };
  }

  await prisma.announcement.delete({ where: { id } });
  return { id };
};

export const getMyAnnouncements = async () => {
  const session = await getSession();
  return prisma.announcement.findMany({
    where: {
      active: true,
      acks: { none: { userId: session.user.id } },
    },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true, message: true, urgency: true },
  });
};

export const acknowledgeAnnouncement = async (id: string) => {
  const session = await getSession();

  const existing = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, active: true },
  });
  if (!existing || !existing.active) {
    return { error: "Announcement no longer exists." };
  }

  await prisma.announcementAck.upsert({
    where: {
      announcementId_userId: { announcementId: id, userId: session.user.id },
    },
    update: {},
    create: { announcementId: id, userId: session.user.id },
  });
  return { id };
};
