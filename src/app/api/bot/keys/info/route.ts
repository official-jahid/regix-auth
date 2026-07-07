import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === serverEnv.SECRET_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key },
      include: {
        user: { select: { username: true, email: true } },
      },
    });

    if (!premiumKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      key: {
        id: premiumKey.id,
        key: premiumKey.key,
        duration: premiumKey.duration,
        isLifetime: premiumKey.isLifetime,
        isRedeemed: premiumKey.isRedeemed,
        redeemedAt: premiumKey.redeemedAt,
        expiresAt: premiumKey.expiresAt,
        isActive: premiumKey.isActive,
        isIpLocked: premiumKey.isIpLocked,
        lockedIp: premiumKey.lockedIp,
        createdBy: premiumKey.createdBy,
        createdAt: premiumKey.createdAt,
        user: premiumKey.user,
      },
    });
  } catch (error) {
    console.error("Bot key info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
