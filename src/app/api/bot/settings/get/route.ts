import prisma from "@/lib/database/dbClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    if (token !== process.env.SECRET_KEY) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const { guildId } = await request.json();

    const [settings, antiNuke, antiRaid, antiSpam] = await Promise.all([
      prisma.guildSettings.findUnique({ where: { guildId } }),
      prisma.antiNukeConfig.findUnique({ where: { guildId } }),
      prisma.antiRaidConfig.findUnique({ where: { guildId } }),
      prisma.antiSpamConfig.findUnique({ where: { guildId } }),
    ]);

    return NextResponse.json({
      settings,
      antiNuke: antiNuke || null,
      antiRaid: antiRaid || null,
      antiSpam: antiSpam || null,
    });
  } catch (error) {
    console.error("Settings get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
