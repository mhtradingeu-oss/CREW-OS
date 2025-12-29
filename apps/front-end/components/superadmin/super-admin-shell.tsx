"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminSidebar } from "./super-admin-sidebar.tsx";
import { SuperAdminTopbar } from "./super-admin-topbar.tsx";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const { user, status, refresh, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && status === "loading") void refresh();
  }, [user, status, refresh]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && user && !hasRole("SUPER_ADMIN")) {
      router.replace("/dashboard");
    }
  }, [status, user, hasRole, router]);

  if (status === "loading" || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.08),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.08),transparent_20%)]" />
      <div className="relative flex min-h-screen">
        <SuperAdminSidebar />
        <div className="flex flex-1 flex-col">
          <SuperAdminTopbar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
