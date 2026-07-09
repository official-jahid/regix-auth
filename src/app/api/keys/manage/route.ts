import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function generateApiKey(): { raw: string; prefix: string; hashed: string } {
  const raw = `rgx_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = raw.substring(0, 8);
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hashed };
}

// List API keys for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    // Only admins can view other users' keys
    const isAdmin = user.role === "OWNER" || user.role === "ADMIN";
    const userId = targetUserId && isAdmin ? targetUserId : user.id;

    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("List API keys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create a new API key
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can create API keys
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can create API keys" },
        { status: 403 },
      );
    }

    const { name, permissions, expiresInDays } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 },
      );
    }

    const validPermissions = ["read", "write", "admin"];
    const perms = permissions || "read";
    const permList = perms.split(",").map((p: string) => p.trim());
    for (const perm of permList) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json(
          { error: `Invalid permission: ${perm}. Valid: read, write, admin` },
          { status: 400 },
        );
      }
    }

    const { raw, prefix, hashed } = generateApiKey();

    const expiresAt =
      expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

    await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashed,
        keyPrefix: prefix,
        userId: user.id,
        permissions: perms,
        expiresAt,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "API_KEY_CREATED",
        userId: user.id,
        details: JSON.stringify({ name: name.trim(), permissions: perms }),
      },
    });

    return NextResponse.json({
      success: true,
      key: raw, // Only time the raw key is shown
      prefix,
      name: name.trim(),
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Revoke an API key
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can manage API keys" },
        { status: 403 },
      );
    }

    const { keyId, isActive } = await request.json();

    if (!keyId) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 },
      );
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Only OWNER or the key owner can modify
    if (apiKey.userId !== user.id && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "You don't have permission to modify this key" },
        { status: 403 },
      );
    }

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: isActive !== false,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        permissions: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: isActive !== false ? "API_KEY_ENABLED" : "API_KEY_DISABLED",
        userId: user.id,
        details: JSON.stringify({ keyId, keyPrefix: apiKey.keyPrefix }),
      },
    });

    return NextResponse.json({ success: true, key: updated });
  } catch (error) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can delete API keys" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 },
      );
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (apiKey.userId !== user.id && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "You don't have permission to delete this key" },
        { status: 403 },
      );
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    await prisma.auditLog.create({
      data: {
        action: "API_KEY_DELETED",
        userId: user.id,
        details: JSON.stringify({ keyId, keyPrefix: apiKey.keyPrefix }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
