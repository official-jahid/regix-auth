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

    const { guildId, module: mod, action } = await request.json();

    if (!guildId || !mod || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const validActions = ["ban", "kick", "mute", "role-remove"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (mod === "antiNuke") {
      await prisma.antiNukeConfig.upsert({
        where: { guildId },
        update: { punishment: action },
        create: {
          id: crypto.randomUUID(),
          guildId,
          punishment: action,
        },
      });
    } else if (mod === "antiRaid") {
      await prisma.antiRaidConfig.upsert({
        where: { guildId },
        update: { punishment: action },
        create: {
          id: crypto.randomUUID(),
          guildId,
          punishment: action,
        },
      });
    } else if (mod === "antiSpam") {
      await prisma.antiSpamConfig.upsert({
        where: { guildId },
        update: { punishment: action },
        create: {
          id: crypto.randomUUID(),
          guildId,
          punishment: action,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setpunishment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
