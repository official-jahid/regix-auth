import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";


export const metadata: Metadata = {
  title: "Admin Panel | Regix Auth",
  description: "Admin control panel for Regix Auth",
};

export interface AdminStats {
  stats: {
    totalUsers: number;
    activeUsers: number;
    blacklistedUsers: number;
    totalKeys: number;
    activeKeys: number;
    redeemedKeys: number;
    lifetimeKeys: number;
    totalSessions: number;
    totalDevices: number;
  };
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  recentKeys: { id: string; key: string; isLifetime: boolean; isActive: boolean; createdAt: string }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  isActive: boolean;
  isBlacklisted: boolean;
  createdAt: string;
  _count: { sessions: number; devices: number; premiumKeys: number };
}

export interface AdminKey {
  id: string;
  key: string;
  duration: number;
  isLifetime: boolean;
  isActive: boolean;
  ipLock: string | null;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  userId: string | null;
  user: { name: string; email: string } | null;
}

async function getAdminData(): Promise<{
  stats: AdminStats | null;
  users: AdminUser[];
  keys: AdminKey[];
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!admin || (admin.role !== "admin" && admin.role !== "owner")) {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    activeUsers,
    blacklistedUsers,
    totalKeys,
    activeKeys,
    redeemedKeys,
    lifetimeKeys,
    totalSessions,
    totalDevices,
    recentUsers,
    recentKeys,
    users,
    keys,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true, isBlacklisted: false } }),
    prisma.user.count({ where: { isBlacklisted: true } }),
    prisma.premiumKey.count(),
    prisma.premiumKey.count({ where: { isActive: true } }),
    prisma.premiumKey.count({ where: { userId: { not: null } } }),
    prisma.premiumKey.count({ where: { isLifetime: true } }),
    prisma.session.count(),
    prisma.device.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.premiumKey.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, key: true, isLifetime: true, isActive: true, createdAt: true },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        isActive: true,
        isBlacklisted: true,
        createdAt: true,
        _count: { select: { sessions: true, devices: true, premiumKeys: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.premiumKey.findMany({
      select: {
        id: true,
        key: true,
        duration: true,
        isLifetime: true,
        isActive: true,
        ipLock: true,
        createdAt: true,
        expiresAt: true,
        redeemedAt: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    stats: {
      stats: {
        totalUsers,
        activeUsers,
        blacklistedUsers,
        totalKeys,
        activeKeys,
        redeemedKeys,
        lifetimeKeys,
        totalSessions,
        totalDevices,
      },
      recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
      recentKeys: recentKeys.map((k) => ({ ...k, createdAt: k.createdAt.toISOString() })),
    },
    users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    keys: keys.map((k) => ({
      ...k,
      createdAt: k.createdAt.toISOString(),
      expiresAt: k.expiresAt?.toISOString() ?? null,
      redeemedAt: k.redeemedAt?.toISOString() ?? null,
    })),
  };
}

export default async function AdminPage() {
  const data = await getAdminData();
  return <AdminClient data={data} />;
}