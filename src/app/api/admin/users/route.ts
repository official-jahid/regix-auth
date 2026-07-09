import { getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        discordAccount: { select: { discordId: true, username: true } },
        premiumKeys: {
          where: { isRedeemed: true },
          select: { key: true, isLifetime: true, expiresAt: true },
        },
        devices: {
          where: { isActive: true },
          select: { hwid: true, sid: true, ip: true, lastSeenAt: true },
        },
        _count: { select: { loginHistory: true, sessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, action, value, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action are required" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "blacklist":
        await prisma.user.update({
          where: { id: userId },
          data: { isBlacklisted: true },
        });
        await prisma.blacklistEntry.create({
          data: {
            userId,
            reason: reason ?? "No reason provided",
            blacklistedBy: admin.id,
          },
        });
        await logAudit(
          "USER_BLACKLISTED",
          userId,
          JSON.stringify({ reason, by: admin.id }),
        );
        return NextResponse.json({
          success: true,
          message: "User blacklisted",
        });

      case "unblacklist":
        await prisma.user.update({
          where: { id: userId },
          data: { isBlacklisted: false },
        });
        await logAudit(
          "USER_UNBLACKLISTED",
          userId,
          JSON.stringify({ by: admin.id }),
        );
        return NextResponse.json({
          success: true,
          message: "User unblacklisted",
        });

      case "activate":
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, message: "User activated" });

      case "deactivate":
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });
        return NextResponse.json({
          success: true,
          message: "User deactivated",
        });

      case "setRole":
        if (
          ![
            "USER",
            "ADMIN",
            "MODERATOR",
            "DISTRIBUTOR",
            "RESELLER",
            "OWNER",
          ].includes(value)
        ) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { role: value },
        });
        await logAudit(
          "USER_ROLE_CHANGED",
          userId,
          JSON.stringify({ role: value, by: admin.id }),
        );
        return NextResponse.json({
          success: true,
          message: `Role set to ${value}`,
        });

      case "delete":
        await prisma.user.delete({ where: { id: userId } });
        await logAudit(
          "USER_DELETED",
          userId,
          JSON.stringify({ by: admin.id }),
        );
        return NextResponse.json({ success: true, message: "User deleted" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
