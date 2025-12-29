"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

type RequireRoleProps = {
  role: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
};

function buildAccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm text-center rounded-2xl border border-border bg-card/60 p-6 shadow">
        <p className="text-lg font-semibold text-foreground">Access denied</p>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { status, user, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <>{fallback ?? <div className="p-6 text-center">Loading...</div>}</>;
  }

  if (status === "unauthenticated") {
    return <>{fallback ?? <div className="p-6 text-center">Redirecting...</div>}</>;
  }

  if (!user || !hasRole(role)) {
    return <>{fallback ?? buildAccessDenied()}</>;
  }

  return <>{children}</>;
}
