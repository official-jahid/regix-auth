import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: "Message ID and emoji are required" },
        { status: 400 },
      );
    }

    // Validate emoji is a single emoji character
    if ([...emoji].length > 2) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user already reacted with this emoji - toggle it
    const existingReaction = await prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId: user.id, emoji },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.chatReaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ success: true, action: "removed" });
    }

    // Add reaction
    const reaction = await prisma.chatReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json({ success: true, action: "added", reaction });
  } catch (error) {
    console.error("React to message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
