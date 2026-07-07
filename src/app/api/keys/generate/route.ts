import { generatePremiumKey, getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      count = 1,
      duration = 30,
      isLifetime = false,
    } = await request.json();

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: "Count must be between 1 and 100" },
        { status: 400 },
      );
    }

    const keys: string[] = [];

    for (let i = 0; i < count; i++) {
      const key = generatePremiumKey();
      await prisma.premiumKey.create({
        data: {
          key,
          duration: isLifetime ? 0 : duration,
          isLifetime,
          createdBy: user.id,
        },
      });
      keys.push(key);
    }

    await logAudit(
      "KEYS_GENERATED",
      user.id,
      JSON.stringify({ count, duration, isLifetime }),
    );

    return NextResponse.json({
      success: true,
      keys,
      count: keys.length,
    });
  } catch (error) {
    console.error("Key generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
