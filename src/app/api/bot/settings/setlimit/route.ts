import prisma from "@/lib/database/dbClient";
import { NextResponse } from "next/server";

const VALID_LIMITS = [
  "banLimit",
  "kickLimit",
  "channelDeleteLimit",
  "channelCreateLimit",
  "roleCreateLimit",
  "roleDeleteLimit",
  "webhookLimit",
];

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

    const { guildId, type, value } = await request.json();

    if (!guildId || !type || typeof value !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!VALID_LIMITS.includes(type)) {
      return NextResponse.json(
        { error: `Invalid limit type: ${type}` },
        { status: 400 },
      );
    }

    if (value < 1 || value > 100) {
      return NextResponse.json(
        { error: "Value must be between 1 and 100" },
        { status: 400 },
      );
    }

    await prisma.antiNukeConfig.upsert({
      where: { guildId },
      update: { [type]: value },
      create: {
        id: crypto.randomUUID(),
        guildId,
        [type]: value,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setlimit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
