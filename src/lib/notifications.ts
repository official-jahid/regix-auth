import prisma from "@/lib/database/dbClient";

// ============================================================
// NOTIFICATION HELPER
// ============================================================

type NotificationType = "info" | "success" | "warning" | "error";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || "info",
      link: input.link || null,
    },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * Get notifications for a user (paginated)
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    unreadCount: await getUnreadCount(userId),
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Create notifications for multiple users (e.g., broadcast to all admins)
 */
export async function createBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: input.title,
      message: input.message,
      type: input.type || "info",
      link: input.link || null,
    })),
  });
}

/**
 * Delete old notifications (older than N days)
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  return prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}
