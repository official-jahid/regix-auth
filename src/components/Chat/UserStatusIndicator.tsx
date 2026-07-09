"use client";

import { cn } from "@/lib/utils";

interface UserStatusIndicatorProps {
  status: "online" | "offline" | "idle" | "dnd";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-gray-500",
  idle: "bg-amber-500",
  dnd: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  idle: "Idle",
  dnd: "Do Not Disturb",
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function UserStatusIndicator({
  status,
  className,
  size = "md",
}: UserStatusIndicatorProps) {
  return (
    <span
      className={cn(
        "relative inline-flex rounded-full",
        statusColors[status] || statusColors.offline,
        sizeClasses[size],
        className,
      )}
      title={statusLabels[status] || "Offline"}
      aria-label={statusLabels[status] || "Offline"}
    />
  );
}

export function getStatusLabel(status: string): string {
  return statusLabels[status] || "Offline";
}

export { statusColors, statusLabels };
