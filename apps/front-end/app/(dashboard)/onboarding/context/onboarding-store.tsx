"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import type { OnboardingGoal, OnboardingStatus, PersonaChoice, PlanSuggestion } from "@/types/onboarding.types";

interface OnboardingStoreValue {
  status?: OnboardingStatus;
  persona?: PersonaChoice | string;
  goals: OnboardingGoal[];
  planSuggestion?: PlanSuggestion;
  setStatus: (status: OnboardingStatus) => void;
  setPersona: (persona: PersonaChoice | string) => void;
  setGoals: (goals: OnboardingGoal[]) => void;
  setPlanSuggestion: (plan: PlanSuggestion) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingStoreValue | undefined>(undefined);

export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus | undefined>(undefined);
  const [persona, setPersona] = useState<PersonaChoice | string | undefined>(undefined);
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [planSuggestion, setPlanSuggestion] = useState<PlanSuggestion | undefined>(undefined);

  const value = useMemo<OnboardingStoreValue>(
    () => ({
      status,
      persona,
      goals,
      planSuggestion,
      setStatus,
      setPersona,
      setGoals,
      setPlanSuggestion,
      reset: () => {
        setStatus(undefined);
        setPersona(undefined);
        setGoals([]);
        setPlanSuggestion(undefined);
      },
    }),
    [goals, persona, planSuggestion, status],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingStore() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboardingStore must be used within OnboardingStoreProvider");
  return ctx;
}
