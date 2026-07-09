import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "Receiver ID and message content are required" },
        { status: 400 },
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 },
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 },
      );
    }

    // Find existing conversation or create a new one
    // Always store with consistent ordering: user1Id < user2Id
    const [user1Id, user2Id] = [user.id, receiverId].sort();

    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: { user1Id, user2Id },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id, user2Id },
      });
    }

    // Calculate expiry (24h from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        receiverId,
        content: content.trim(),
        expiresAt,
      },
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
        receiver: {
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
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
