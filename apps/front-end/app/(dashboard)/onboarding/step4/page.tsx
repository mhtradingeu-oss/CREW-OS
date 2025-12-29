"use client";

import { StepHeader } from "../components/StepHeader";
import { WizardNav } from "../components/WizardNav";
import { useOnboardingStore } from "../context/onboarding-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";

export default function OnboardingStep4ModulesPage() {
  const { planSuggestion } = useOnboardingStore();

  if (!planSuggestion) {
    return (
      <div className="space-y-4">
        <StepHeader step={4} title="Module overview" description="Load the plan first." />
        <LoadingState message="No plan found. Go back and generate a suggestion." />
        <WizardNav prevHref="/onboarding/step3" nextDisabled />
      </div>
    );
  }

  const modules = planSuggestion.features ?? planSuggestion.focus;

  return (
    <div className="space-y-6">
      <StepHeader
        step={4}
        title="Module overview"
        description="Review the modules and capabilities enabled for your plan."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((feature: string) => (
          <Card key={feature}>
            <CardHeader>
              <CardTitle className="text-lg">{feature}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This module will be provisioned for your workspace. Configure details after onboarding.
            </CardContent>
          </Card>
        ))}
      </div>

      <WizardNav prevHref="/onboarding/step3" nextHref="/onboarding/step5" />
    </div>
  );
}
