import prisma from "@/lib/database/dbClient";
import { NextResponse } from "next/server";

/**
 * This endpoint is called by a cron job to clean up expired messages.
 * In production, set up a Vercel Cron Job or similar to call this endpoint.
 * Or use a setInterval in the bot process.
 */
export async function POST() {
  try {
    const now = new Date();

    // Delete reactions on expired messages first
    await prisma.$executeRawUnsafe(
      `DELETE FROM ChatReaction WHERE messageId IN (SELECT id FROM ChatMessage WHERE expiresAt <= ?)`,
      [now.toISOString()],
    );

    // Delete expired messages
    const result = await prisma.chatMessage.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    });

    // Clean up conversations with no active messages
    // (conversations will be auto-removed when last message is deleted via CASCADE)

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
