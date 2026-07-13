import prisma from "@/lib/database/dbClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const secretKey = process.env.SECRET_KEY;
    if (token !== secretKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const { action, discordId, addedBy, reason } = await request.json();

    if (!action || !discordId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (action === "add") {
      await prisma.botWhitelist.upsert({
        where: { discordId },
        update: { addedBy: addedBy || "system", reason: reason || null },
        create: {
          id: crypto.randomUUID(),
          discordId,
          addedBy: addedBy || "system",
          reason: reason || null,
        },
      });
      return NextResponse.json({ success: true, whitelisted: true });
    }

    if (action === "remove") {
      await prisma.botWhitelist
        .delete({ where: { discordId } })
        .catch(() => {});
      return NextResponse.json({ success: true, whitelisted: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Whitelist modify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
