"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PermissionGuard({
  required,
  children,
}: {
  required: string | string[];
  children: ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(required)) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="text-2xl font-semibold">Not enough permissions</div>
        <p className="text-muted-foreground">Your role does not allow you to view this section.</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
