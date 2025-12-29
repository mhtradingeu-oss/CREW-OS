"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TenantAppShell } from "./tenant-app-shell.tsx";
import { useAuth } from "@/lib/auth/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { getOnboardingStart } from "@/lib/api/onboarding";

export function TenantAppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const onboarding = useQuery({
    queryKey: ["onboarding", "start"],
    queryFn: getOnboardingStart,
    staleTime: 60_000,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) void refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!onboarding.data || onboarding.data.status !== "in_progress") return;
    if (pathname?.startsWith("/onboarding")) return;
    router.replace("/onboarding/step1");
  }, [onboarding.data, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <TenantAppShell>{children}</TenantAppShell>;
}
