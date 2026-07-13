import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
  title: "Analytics | Regix Auth",
};

async function getStats() {
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
    whitelistedUsers,
    totalAuditLogs,
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
    prisma.botWhitelist.count(),
    prisma.auditLog.count(),
  ]);

  // Daily registrations for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRegistrations = await prisma.user.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Key usage by status
  const keysByStatus = await prisma.premiumKey.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return {
    totalUsers,
    activeUsers,
    blacklistedUsers,
    totalKeys,
    activeKeys,
    redeemedKeys,
    lifetimeKeys,
    totalSessions,
    totalDevices,
    whitelistedUsers,
    totalAuditLogs,
    recentRegistrations: recentRegistrations.map((r) => ({
      date: r.createdAt.toISOString().split("T")[0],
      count: r._count.id,
    })),
    keysByStatus: keysByStatus.map((k) => ({
      status: k.status,
      count: k._count.id,
    })),
  };
}

export default async function StatsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth");

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (
    !adminUser ||
    (adminUser.role !== "admin" && adminUser.role !== "owner")
  ) {
    redirect("/dashboard");
  }

  const stats = await getStats();
  return <StatsClient stats={stats} />;
}
