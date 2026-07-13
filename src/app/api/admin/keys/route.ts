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

    const keys = await prisma.premiumKey.findMany({
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
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Admin keys fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const { count, duration, lifetime } = await request.json();

    if (!count || count < 1 || count > 100) {
      return NextResponse.json({ error: "Count must be between 1-100" }, { status: 400 });
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generatedKeys = [];

    for (let i = 0; i < count; i++) {
      const segments: string[] = [];
      for (let s = 0; s < 4; s++) {
        let segment = "";
        for (let c = 0; c < 5; c++) {
          segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
      }
      const keyString = segments.join("-");

      const expiresAt = lifetime ? null : new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      const premiumKey = await prisma.premiumKey.create({
        data: {
          id: crypto.randomUUID(),
          key: keyString,
          duration: lifetime ? 0 : duration,
          isLifetime: lifetime || false,
          isActive: true,
          expiresAt,
        },
      });

      generatedKeys.push(premiumKey);
    }

    return NextResponse.json({ keys: generatedKeys, count: generatedKeys.length });
  } catch (error) {
    console.error("Admin key generation error:", error);
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

    const { keyId, action } = await request.json();

    if (!keyId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const targetKey = await prisma.premiumKey.findUnique({ where: { id: keyId } });
    if (!targetKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    switch (action) {
      case "toggleActive":
        await prisma.premiumKey.update({ where: { id: keyId }, data: { isActive: !targetKey.isActive } });
        break;
      case "delete":
        await prisma.premiumKey.delete({ where: { id: keyId } });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin key update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}