"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "../components/StepHeader.tsx";
import { WizardNav } from "../components/WizardNav.tsx";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { useOnboardingStore } from "../context/onboarding-store.ts";
// Local read-only mock onboarding store for V1
const useOnboardingStore = () => {
  const [goals, setGoals] = React.useState([]);
  return { goals, setGoals };
};
import { postOnboardingGoals } from "@/lib/api/onboarding";
import type { OnboardingGoal } from "@/types/onboarding.types";

const GOALS: { value: OnboardingGoal | string; title: string; hint: string }[] = [
  { value: "launch", title: "Launch fast", hint: "MVP, SKUs, approvals" },
  { value: "scale", title: "Scale spend", hint: "Campaigns, ROAS" },
  { value: "optimize", title: "Optimize margin", hint: "Pricing, COGS, VAT" },
  { value: "omnichannel", title: "Omnichannel", hint: "Retail + DTC + Stand" },
  { value: "retention", title: "Retention", hint: "Loyalty, CRM" },
  { value: "automation", title: "Automation", hint: "Playbooks, triggers" },
];

export default function OnboardingStep2GoalsPageClient() {
  const router = useRouter();
  const { goals, setGoals } = useOnboardingStore();

  const toggle = (goal: OnboardingGoal | string) => {
    const next = goals.includes(goal as OnboardingGoal)
      ? goals.filter((g: string) => g !== goal)
      : [...goals, goal as OnboardingGoal];
    setGoals(next as OnboardingGoal[]);
  };

  const mutation = useMutation({
    mutationFn: (selected: OnboardingGoal[]) => postOnboardingGoals({ goals: selected }),
    onSuccess: (_, selected) => {
      toast.success("Goals saved");
      router.push("/onboarding/step3");
    },
    onError: (err) => toast.error((err as Error).message ?? "Failed to save goals"),
  });

  const canContinue = useMemo(() => goals.length > 0, [goals.length]);

  return (
    <div className="space-y-6">
      <StepHeader
        step={2}
        title="Select your goals"
        description="Pick the outcomes you want to prioritize first."
        actions={
          <Button onClick={() => mutation.mutate(goals)} disabled={!goals.length}>
            Save goals
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {GOALS.map((goal: typeof GOALS[number]) => {
          const active = goals.includes(goal.value as OnboardingGoal);
          return (
            <Card
              key={goal.value}
              className={`cursor-pointer transition ${active ? "border-primary shadow" : "hover:border-slate-300"}`}
              onClick={() => toggle(goal.value)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {goal.title}
                  {active ? <span className="text-xs font-semibold text-primary">Selected</span> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{goal.hint}</CardContent>
            </Card>
          );
        })}
      </div>

      <WizardNav prevHref="/onboarding/step1" />
    </div>
  );
}
