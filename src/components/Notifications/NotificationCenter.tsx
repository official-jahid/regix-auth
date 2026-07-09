"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import {
  BellIcon,
  CheckCheckIcon,
  ExternalLinkIcon,
  InfoIcon,
  LoaderIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsData {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

const TYPE_ICONS: Record<string, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCheckIcon,
  warning: BellIcon,
  error: BellIcon,
};

const TYPE_COLORS: Record<string, string> = {
  info: "border-blue-500/30 bg-blue-500/5",
  success: "border-green-500/30 bg-green-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  error: "border-red-500/30 bg-red-500/5",
};

export function NotificationCenter() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (page: number = 1) => {
    try {
      const res = await fetch(`/api/notifications?page=${page}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await fetchNotifications();
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });

    if (res.ok) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n,
          ),
        };
      });
    }
  };

  const handleMarkAllRead = async () => {
    const res = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });

    if (res.ok) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        };
      });
      toast.success("All notifications marked as read");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <LoaderIcon className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6 pt-24">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {data && data.unreadCount > 0 && (
            <Badge variant="default">{data.unreadCount} unread</Badge>
          )}
        </div>
        {data && data.unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}>
            <CheckCheckIcon className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {data && data.notifications.length === 0 ?
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <BellIcon className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-lg font-medium">
              No notifications
            </p>
            <p className="text-muted-foreground text-sm">
              You're all caught up!
            </p>
          </CardContent>
        </Card>
      : <div className="space-y-2">
          {data?.notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || InfoIcon;
            return (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition-colors ${notification.read ? "opacity-70" : TYPE_COLORS[notification.type] || TYPE_COLORS.info}`}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkRead(notification.id);
                  }
                  if (notification.link) {
                    window.location.assign(notification.link);
                  }
                }}>
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[10px]">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                      {notification.link && (
                        <ExternalLinkIcon className="text-muted-foreground h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      }

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Button
                key={page}
                variant={page === data.page ? "default" : "outline"}
                size="sm"
                onClick={() => fetchNotifications(page)}>
                {page}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
