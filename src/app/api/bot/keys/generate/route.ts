import { generatePremiumKey, logAudit } from "@/lib/auth";
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
          createdBy: "bot",
        },
      });
      keys.push(key);
    }

    await logAudit(
      "KEYS_GENERATED_BOT",
      "bot",
      JSON.stringify({ count, duration, isLifetime }),
    );

    return NextResponse.json({
      success: true,
      keys,
      count: keys.length,
    });
  } catch (error) {
    console.error("Bot key generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
