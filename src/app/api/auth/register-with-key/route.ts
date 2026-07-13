import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, password, accessKey } = await request.json();

    if (!name || !email || !password || !accessKey) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate the access key
    const trimmedKey = accessKey.trim().toUpperCase();
    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: trimmedKey },
    });

    if (!premiumKey) {
      return NextResponse.json(
        { error: "Invalid access key" },
        { status: 400 },
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    // Use Better Auth's native sign up
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result || !result.user) {
      return NextResponse.json(
        { error: (result as any)?.error || "Failed to create account" },
        { status: 400 },
      );
    }

    const createdUser = result.user;

    // Mark the key as used and associate with the new user
    const expiresAt =
      premiumKey.isLifetime ? null : (
        new Date(Date.now() + premiumKey.duration * 24 * 60 * 60 * 1000)
      );

    await prisma.premiumKey.update({
      where: { id: premiumKey.id },
      data: {
        userId: createdUser.id,
        status: "used",
        redeemedAt: new Date(),
        ...(expiresAt ? { expiresAt } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: createdUser,
    });
  } catch (error) {
    console.error("Register with key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
