import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!admin || (admin.role !== "admin" && admin.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.premiumKey.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, key: true, isLifetime: true, isActive: true, createdAt: true } }),
    ]);

    return NextResponse.json({
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
      recentUsers,
      recentKeys,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}