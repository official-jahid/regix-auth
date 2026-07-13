import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessKey } = await request.json();

    if (!accessKey || typeof accessKey !== "string") {
      return NextResponse.json(
        { error: "Access key is required" },
        { status: 400 },
      );
    }

    const trimmedKey = accessKey.trim().toUpperCase();

    // Find the key
    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: trimmedKey },
    });

    if (!premiumKey) {
      return NextResponse.json(
        { error: "Invalid access key" },
        { status: 404 },
      );
    }

    if (premiumKey.status === "blocked" || !premiumKey.isActive) {
      return NextResponse.json(
        { error: "Access key has been blocked" },
        { status: 400 },
      );
    }

    if (premiumKey.status === "used" || premiumKey.userId) {
      return NextResponse.json(
        { error: "Access key is already in use" },
        { status: 400 },
      );
    }

    if (premiumKey.expiresAt && premiumKey.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Access key has expired" },
        { status: 400 },
      );
    }

    // Check if the redeemed key is the admin lifetime key → grant owner role
    const isAdminLifetimeKey = trimmedKey === serverEnv.ADMIN_LIFETIME_KEY;

    // Deactivate the old key (if any) and assign the new one
    const oldKey = await prisma.premiumKey.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (oldKey) {
      await prisma.premiumKey.update({
        where: { id: oldKey.id },
        data: { isActive: false, status: "expired" },
      });
    }

    // Calculate expiration
    const expiresAt =
      premiumKey.isLifetime ? null : (
        new Date(Date.now() + premiumKey.duration * 24 * 60 * 60 * 1000)
      );

    // Assign new key to user
    await prisma.premiumKey.update({
      where: { id: premiumKey.id },
      data: {
        userId: session.user.id,
        status: "used",
        redeemedAt: new Date(),
        ...(expiresAt ? { expiresAt } : {}),
      },
    });

    // Grant owner role if this is the admin lifetime key
    if (isAdminLifetimeKey) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "owner" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Access key updated successfully",
    });
  } catch (error) {
    console.error("Key update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
