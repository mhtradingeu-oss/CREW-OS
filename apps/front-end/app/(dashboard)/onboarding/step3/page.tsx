"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { StepHeader } from "../components/StepHeader";
import { WizardNav } from "../components/WizardNav";
import { useOnboardingStore } from "../context/onboarding-store";
import { getOnboardingPlanSuggestion } from "@/lib/api/onboarding";
import { toast } from "sonner";

export default function OnboardingStep3PlanPage() {
  const { persona, goals, planSuggestion, setPlanSuggestion } = useOnboardingStore();

  const query = useQuery({
    queryKey: ["onboarding", "plan-suggestion", persona, goals],
    queryFn: getOnboardingPlanSuggestion,
    enabled: Boolean(persona && goals.length),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (query.data) {
      setPlanSuggestion({
        planName: query.data.plan,
        focus: query.data.features,
        rationale: `Plan suggested based on persona ${persona ?? "-"} and goals (${goals.join(", ")}).`,
        features: query.data.features,
      });
    }
  }, [goals, persona, query.data, setPlanSuggestion]);

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to fetch plan suggestion");
    }
  }, [query.isError]);

  const features = planSuggestion?.features ?? query.data?.features ?? [];

  return (
    <div className="space-y-6">
      <StepHeader
        step={3}
        title="Plan suggestion"
        description="We picked a plan and modules based on your persona + goals."
        actions={
          <Button
            onClick={() => query.refetch()}
            variant="outline"
            disabled={query.isFetching || !persona || !goals.length}
          >
            Refresh suggestion
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingState message="Generating a plan for you..." />
      ) : planSuggestion ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{planSuggestion.planName}</CardTitle>
            <p className="text-sm text-muted-foreground">{planSuggestion.rationale}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Included focus areas</p>
            <div className="flex flex-wrap gap-2">
              {planSuggestion.focus.map((item: string) => (
                <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {item}
                </span>
              ))}
            </div>
            {features.length ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Modules unlocked</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {features.map((feature: string) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <LoadingState message="Set persona and goals first." />
      )}

      <WizardNav prevHref="/onboarding/step2" nextHref="/onboarding/step4" nextDisabled={!planSuggestion} />
    </div>
  );
}
