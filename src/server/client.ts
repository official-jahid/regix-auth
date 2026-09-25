"use server";

import { headers } from "next/headers";
import z from "zod";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";

const redeemSchema = z.object({
  key: z
    .string()
    .min(1, { error: "Key is required" })
    .max(64, { error: "Key is too long" })
    .trim(),
  deviceId: z
    .string()
    .min(1, { error: "Device ID is required" })
    .max(128, { error: "Device ID is too long" })
    .trim(),
});

const renewalSchema = z.object({
  licenseId: z.string().min(1),
  note: z.string().max(300).trim().optional(),
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

const clientIp = async () => {
  const all = await headers();
  return (
    all.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    all.get("x-real-ip")?.trim() ??
    "unknown"
  );
};

const durationToDays = (duration: string | null) => {
  if (!duration || duration === "lifetime") return null;
  const days = Number(duration);
  return Number.isInteger(days) && days > 0 ? days : null;
};

export const checkLicenseKey = async (key: string) => {
  const clean = key.trim();
  if (!clean) {
    return { valid: false as const, error: "A valid license key is required." };
  }

  const license = await prisma.licenseKey.findUnique({
    where: { key: clean },
    select: {
      id: true,
      provider: true,
      duration: true,
      isUsed: true,
      active: true,
      product: { select: { name: true } },
    },
  });

  if (!license || !license.active) {
    return { valid: false as const, error: "Invalid or banned key." };
  }
  if (license.isUsed) {
    return { valid: false as const, error: "This key is already in use." };
  }

  return {
    valid: true as const,
    provider: license.provider,
    product: license.product?.name ?? null,
    lifetime: license.duration === "lifetime",
  };
};

export const claimLicense = async (key: string) => {
  const session = await getSession();
  const clean = key.trim();

  const license = await prisma.licenseKey.findUnique({
    where: { key: clean },
    select: { id: true, duration: true },
  });
  if (!license) {
    return { error: "Invalid key." };
  }

  const days = durationToDays(license.duration);

  const claimed = await prisma.licenseKey.updateMany({
    where: { id: license.id, isUsed: false, active: true },
    data: {
      isUsed: true,
      usedBy: session.user.name ?? session.user.email,
      ownerId: session.user.id,
      expiresAt:
        days === null ? null : new Date(Date.now() + days * 86_400_000),
    },
  });

  if (claimed.count === 0) {
    return { error: "This key was just claimed. Try another key." };
  }

  const bound = await prisma.licenseKey.findUnique({
    where: { id: license.id },
    select: { provider: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { provider: bound?.provider ?? "REGIX" },
  });

  return { id: license.id };
};

export const getMyLicense = async () => {
  const session = await getSession();

  const license = await prisma.licenseKey.findFirst({
    where: { ownerId: session.user.id, isUsed: true },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      product: { select: { name: true } },
      activations: {
        where: { active: true },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true, deviceId: true, ip: true, createdAt: true },
      },
      renewals: {
        where: { status: "pending" },
        select: { id: true, createdAt: true },
      },
    },
  });

  if (!license) {
    return { license: null };
  }

  const reseller = await prisma.user.findFirst({
    where: { role: "reseller", provider: license.provider },
    select: { username: true, email: true },
  });

  return { license, reseller };
};

export const redeemLicense = async (raw: { key: string; deviceId: string }) => {
  const session = await getSession();
  const parsed = redeemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Enter a key and a device ID." };
  }

  const license = await prisma.licenseKey.findUnique({
    where: { key: parsed.data.key },
    select: {
      id: true,
      provider: true,
      duration: true,
      isUsed: true,
      active: true,
    },
  });

  if (!license || !license.active) {
    return { error: "Invalid or banned key." };
  }
  if (license.isUsed) {
    return { error: "This key is already bound to an account." };
  }

  const days = durationToDays(license.duration);
  const ip = await clientIp();

  await prisma.$transaction([
    prisma.licenseKey.update({
      where: { id: license.id },
      data: {
        isUsed: true,
        usedBy: session.user.name ?? session.user.email,
        ownerId: session.user.id,
        expiresAt:
          days === null ? null : new Date(Date.now() + days * 86_400_000),
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { provider: license.provider },
    }),
    prisma.activation.create({
      data: { licenseId: license.id, deviceId: parsed.data.deviceId, ip },
    }),
  ]);

  return { id: license.id };
};

export const removeMyDevice = async (activationId: string) => {
  const session = await getSession();

  const activation = await prisma.activation.findUnique({
    where: { id: activationId },
    select: {
      id: true,
      active: true,
      license: { select: { ownerId: true } },
    },
  });

  if (
    !activation ||
    !activation.active ||
    activation.license.ownerId !== session.user.id
  ) {
    return { error: "Device no longer exists." };
  }

  await prisma.activation.update({
    where: { id: activationId },
    data: { active: false, revokedAt: new Date() },
  });
  return { id: activationId };
};

export const requestRenewal = async (raw: {
  licenseId: string;
  note?: string;
}) => {
  const session = await getSession();
  const parsed = renewalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const license = await prisma.licenseKey.findUnique({
    where: { id: parsed.data.licenseId },
    select: { id: true, ownerId: true },
  });

  if (!license || license.ownerId !== session.user.id) {
    return { error: "License no longer exists." };
  }

  const pending = await prisma.renewalRequest.findFirst({
    where: { licenseId: license.id, status: "pending" },
    select: { id: true },
  });
  if (pending) {
    return { error: "A renewal request is already pending." };
  }

  const note = parsed.data.note?.trim() ? parsed.data.note.trim() : undefined;

  await prisma.renewalRequest.create({
    data: {
      licenseId: license.id,
      requesterId: session.user.id,
      note,
    },
  });
  return { id: license.id };
};

export const listRenewals = async () => {
  const session = await getSession();
  const role = session.user.role;

  if (role !== "admin" && role !== "reseller") {
    throw new Error("Not authorized");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, provider: true },
  });
  if (!me) {
    throw new Error("Not authorized");
  }

  const isAdmin = me.role === "admin";
  const where = {
    status: "pending",
    ...(isAdmin ? {} : { license: { provider: me.provider ?? "REGIX" } }),
  };

  const items = await prisma.renewalRequest.findMany({
    where,
    orderBy: [{ createdAt: "asc" }],
    include: {
      license: {
        select: {
          id: true,
          key: true,
          provider: true,
          duration: true,
          expiresAt: true,
          createdById: true,
          owner: { select: { username: true, email: true } },
        },
      },
      requester: { select: { username: true, email: true } },
    },
  });

  return {
    items: items.map((item) => ({
      ...item,
      canManage: isAdmin || item.license.createdById === me.id,
    })),
    isAdmin,
  };
};

export const approveRenewal = async (id: string) => {
  const session = await getSession();
  const role = session.user.role;

  if (role !== "admin" && role !== "reseller") {
    return { error: "Not authorized." };
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!me) {
    return { error: "Not authorized." };
  }

  const renewal = await prisma.renewalRequest.findUnique({
    where: { id },
    include: {
      license: {
        select: {
          id: true,
          duration: true,
          expiresAt: true,
          createdById: true,
        },
      },
    },
  });
  if (!renewal || renewal.status !== "pending") {
    return { error: "Request no longer exists." };
  }
  if (me.role !== "admin" && renewal.license.createdById !== me.id) {
    return { error: "You can only manage your own keys." };
  }

  const days = durationToDays(renewal.license.duration);
  const base = Math.max(Date.now(), renewal.license.expiresAt?.getTime() ?? 0);

  await prisma.$transaction([
    prisma.licenseKey.update({
      where: { id: renewal.license.id },
      data: {
        active: true,
        expiresAt: days === null ? null : new Date(base + days * 86_400_000),
      },
    }),
    prisma.renewalRequest.update({
      where: { id },
      data: { status: "approved" },
    }),
  ]);
  return { id };
};

export const rejectRenewal = async (id: string) => {
  const session = await getSession();
  const role = session.user.role;

  if (role !== "admin" && role !== "reseller") {
    return { error: "Not authorized." };
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!me) {
    return { error: "Not authorized." };
  }

  const renewal = await prisma.renewalRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      license: { select: { createdById: true } },
    },
  });
  if (!renewal || renewal.status !== "pending") {
    return { error: "Request no longer exists." };
  }
  if (me.role !== "admin" && renewal.license.createdById !== me.id) {
    return { error: "You can only manage your own keys." };
  }

  await prisma.renewalRequest.update({
    where: { id },
    data: { status: "rejected" },
  });
  return { id };
};
