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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
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
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const { userId, action, value } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "setRole":
        if (!["user", "admin", "moderator", "distributor", "reseller"].includes(value)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await prisma.user.update({ where: { id: userId }, data: { role: value } });
        break;
      case "toggleActive":
        await prisma.user.update({ where: { id: userId }, data: { isActive: !targetUser.isActive } });
        break;
      case "toggleBlacklist":
        await prisma.user.update({ where: { id: userId }, data: { isBlacklisted: !targetUser.isBlacklisted } });
        break;
      case "delete":
        if (targetUser.role === "owner") {
          return NextResponse.json({ error: "Cannot delete owner" }, { status: 403 });
        }
        await prisma.user.delete({ where: { id: userId } });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}