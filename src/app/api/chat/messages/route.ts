import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const otherUserId = searchParams.get("otherUserId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    } else if (otherUserId) {
      const [user1Id, user2Id] = [user.id, otherUserId].sort();
      conversation = await prisma.conversation.findUnique({
        where: { user1Id_user2Id: { user1Id, user2Id } },
      });
    }

    if (!conversation) {
      // No conversation exists yet, return empty messages
      return NextResponse.json({ messages: [], nextCursor: null });
    }

    // Verify user is part of this conversation
    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where: Record<string, unknown> = {
      conversationId: conversation.id,
      isDeleted: false,
      expiresAt: { gt: new Date() },
    };

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
      hasMore ?
        resultMessages[resultMessages.length - 1]?.createdAt.toISOString()
      : null;

    // Reverse to chronological order
    resultMessages.reverse();

    return NextResponse.json({ messages: resultMessages, nextCursor });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
