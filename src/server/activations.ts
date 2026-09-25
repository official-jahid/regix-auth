"use server";

import { headers } from "next/headers";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const getActor = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "reseller")
  ) {
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

export const listActivations = async ({
  q = "",
  status = "all",
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { row, isAdmin } = await getActor();
  const provider = row.provider ?? "REGIX";

  const where = {
    ...(isAdmin ? {} : { license: { provider } }),
    ...(q.trim() === "" ?
      {}
    : {
        OR: [
          { deviceId: { contains: q.trim() } },
          { ip: { contains: q.trim() } },
          { license: { key: { contains: q.trim() } } },
        ],
      }),
    ...(status === "all" ? {}
    : status === "active" ? { active: true }
    : { active: false }),
  };

  const [total, items] = await Promise.all([
    prisma.activation.count({ where }),
    prisma.activation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        license: {
          select: {
            id: true,
            key: true,
            provider: true,
            createdById: true,
          },
        },
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      canManage: isAdmin || item.license.createdById === row.id,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
};

export const toggleActivation = async (id: string) => {
  const { row, isAdmin } = await getActor();

  const activation = await prisma.activation.findUnique({
    where: { id },
    select: {
      id: true,
      active: true,
      license: { select: { createdById: true } },
    },
  });
  if (!activation) {
    return { error: "Activation no longer exists." };
  }
  if (!isAdmin && activation.license.createdById !== row.id) {
    return { error: "You can only manage your own keys." };
  }

  const updated = await prisma.activation.update({
    where: { id },
    data: {
      active: !activation.active,
      revokedAt: activation.active ? new Date() : null,
    },
    select: { id: true, active: true },
  });
  return { id: updated.id, active: updated.active };
};
