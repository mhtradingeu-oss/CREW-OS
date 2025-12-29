"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card/70 px-3 py-2">
      <div className="text-right">
        <p className="text-sm font-semibold">{user?.email ?? "Guest"}</p>
        <Badge variant="secondary" className="text-[0.65rem] uppercase tracking-[0.25em]">
          {user?.role ?? "Guest"}
        </Badge>
      </div>
      <Button size="sm" variant="ghost" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}
