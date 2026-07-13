import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const trimmedKey = key.trim().toUpperCase();

    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: trimmedKey },
    });

    if (!premiumKey) {
      return NextResponse.json({ error: "Invalid key" }, { status: 404 });
    }

    if (!premiumKey.isActive) {
      return NextResponse.json({ error: "Key is deactivated" }, { status: 400 });
    }

    if (premiumKey.userId) {
      return NextResponse.json({ error: "Key already redeemed" }, { status: 400 });
    }

    if (premiumKey.expiresAt && premiumKey.expiresAt < new Date()) {
      return NextResponse.json({ error: "Key has expired" }, { status: 400 });
    }

    const expiresAt = premiumKey.isLifetime
      ? null
      : new Date(Date.now() + premiumKey.duration * 24 * 60 * 60 * 1000);

    await prisma.premiumKey.update({
      where: { id: premiumKey.id },
      data: {
        userId: session.user.id,
        redeemedAt: new Date(),
        ...(expiresAt ? { expiresAt } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        ...premiumKey,
        userId: session.user.id,
        redeemedAt: new Date(),
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Key redeem error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}