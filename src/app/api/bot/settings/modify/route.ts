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

    const { guildId, setting, value } = await request.json();
    if (!guildId || setting === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await prisma.guildSettings.upsert({
      where: { guildId },
      update: { [setting]: value },
      create: {
        id: crypto.randomUUID(),
        guildId,
        [setting]: value,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings modify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
