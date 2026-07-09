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

    const { guildId, logChannelId } = await request.json();

    if (!guildId) {
      return NextResponse.json(
        { error: "guildId is required" },
        { status: 400 },
      );
    }

    const config = await prisma.botConfig.upsert({
      where: { guildId },
      update: {
        ...(logChannelId !== undefined ? { logChannelId } : {}),
      },
      create: {
        guildId,
        logChannelId: logChannelId || null,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        guildId: config.guildId,
        logChannelId: config.logChannelId,
      },
    });
  } catch (error) {
    console.error("Bot log config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId");

    if (!guildId) {
      return NextResponse.json(
        { error: "guildId is required" },
        { status: 400 },
      );
    }

    const config = await prisma.botConfig.findUnique({
      where: { guildId },
    });

    return NextResponse.json({
      success: true,
      config: config || { guildId, logChannelId: null },
    });
  } catch (error) {
    console.error("Bot log config fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
