"use client";

import { ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TenantAppLayout } from "@/components/shell/tenant-app-layout";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingStoreProvider, useOnboardingStore } from "./context/onboarding-store";
import { getOnboardingStart } from "@/lib/api/onboarding";
import type { OnboardingGoal } from "@/types/onboarding.types";

function OnboardingBootstrap({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setStatus, setPersona, setGoals } = useOnboardingStore();
  const { data, isLoading } = useQuery({ queryKey: ["onboarding", "start"], queryFn: getOnboardingStart });

  useEffect(() => {
    if (!data) return;
    if (data.status === "completed") {
      router.replace("/dashboard");
      return;
    }
    if (data.persona) setPersona(data.persona);
    if (data.goals) setGoals(data.goals as OnboardingGoal[]);
    setStatus(data.status);
  }, [data, router, setGoals, setPersona, setStatus]);

  if (isLoading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <TenantAppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <OnboardingStoreProvider>
          <OnboardingBootstrap>{children}</OnboardingBootstrap>
        </OnboardingStoreProvider>
      </div>
    </TenantAppLayout>
  );
}
