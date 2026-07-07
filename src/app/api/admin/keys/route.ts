import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.premiumKey.findMany({
      include: {
        user: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error("Admin keys fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId, action } = await request.json();

    if (!keyId || !action) {
      return NextResponse.json(
        { error: "keyId and action are required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "deactivate":
        await prisma.premiumKey.update({
          where: { id: keyId },
          data: { isActive: false },
        });
        return NextResponse.json({ success: true, message: "Key deactivated" });

      case "activate":
        await prisma.premiumKey.update({
          where: { id: keyId },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, message: "Key activated" });

      case "delete":
        await prisma.premiumKey.delete({ where: { id: keyId } });
        return NextResponse.json({ success: true, message: "Key deleted" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin key action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
