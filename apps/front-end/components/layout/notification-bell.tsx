"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { listNotifications, markNotificationsRead } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
// import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notifications", { limit: 5 }],
    queryFn: () => listNotifications({ pageSize: 5 }),
  });

  const unread = data?.data.filter((item) => item.status !== "read") ?? [];

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationsRead([id]);
      await refetch();
    } catch (err) {
      console.error("Failed to mark notification read", apiErrorMessage(err));
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {unread.length}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-sm font-semibold">Notifications</div>
            <Link
              href="/dashboard/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
          <div className="max-h-80 divide-y divide-border overflow-y-auto">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
            {isError && (
              <div className="px-3 py-4 text-sm text-destructive">
                Error: {apiErrorMessage(error)}
              </div>
            )}
            {!isLoading && data?.data.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">No notifications yet</div>
            )}
            {data?.data.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-3 py-3 text-sm",
                  notification.status !== "read" ? "bg-accent/40" : "",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{notification.title}</div>
                    <div className="text-xs text-muted-foreground">{notification.message}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {notification.status !== "read" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
