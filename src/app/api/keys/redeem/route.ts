import { getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: key.toUpperCase() },
    });

    if (!premiumKey) {
      return NextResponse.json({ error: "Invalid key" }, { status: 404 });
    }

    if (!premiumKey.isActive) {
      return NextResponse.json(
        { error: "Key is deactivated" },
        { status: 400 },
      );
    }

    if (premiumKey.isRedeemed) {
      return NextResponse.json(
        { error: "Key already redeemed" },
        { status: 400 },
      );
    }

    const expiresAt =
      premiumKey.isLifetime ? null : (
        new Date(Date.now() + premiumKey.duration * 86400000)
      );

    await prisma.premiumKey.update({
      where: { id: premiumKey.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        userId: user.id,
        expiresAt,
      },
    });

    await logAudit(
      "KEY_REDEEMED",
      user.id,
      JSON.stringify({
        key: premiumKey.key,
        duration:
          premiumKey.isLifetime ? "lifetime" : `${premiumKey.duration} days`,
      }),
    );

    return NextResponse.json({
      success: true,
      premium: {
        key: premiumKey.key,
        isLifetime: premiumKey.isLifetime,
        expiresAt,
      },
      message:
        premiumKey.isLifetime ?
          "Lifetime premium activated!"
        : `Premium activated for ${premiumKey.duration} days!`,
    });
  } catch (error) {
    console.error("Key redeem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
