"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StepHeader } from "../components/StepHeader";
import { WizardNav } from "../components/WizardNav";
import { useOnboardingStore } from "../context/onboarding-store";
import { completeOnboarding } from "@/lib/api/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingStep5ConfirmPageClient() {
  const router = useRouter();
  const { persona, goals, planSuggestion, setStatus } = useOnboardingStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload?: Record<string, unknown>) => completeOnboarding(payload ?? {}),
    onSuccess: () => {
      setStatus("completed");
      // Invalidate onboarding start so guards stop redirecting after completion
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "start"] });
      toast.success("Onboarding completed");
      router.replace("/dashboard");
    },
    onError: (err) => toast.error((err as Error).message ?? "Failed to complete onboarding"),
  });

  const ready = Boolean(persona && goals.length && planSuggestion);

  return (
    <div className="space-y-6">
      <StepHeader
        step={5}
        title="Confirm and finish"
        description="Review your selections, then finalize onboarding."
        actions={
          <Button onClick={() => mutation.mutate({})} disabled={!ready || mutation.isLoading}>
            {mutation.isLoading ? "Completing..." : "Finish onboarding"}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">Persona:</span> {persona ?? "-"}</p>
          <p><span className="font-semibold text-foreground">Goals:</span> {goals.join(", ") || "-"}</p>
          <div>
            <p className="font-semibold text-foreground">Plan</p>
            <p>{planSuggestion?.planName ?? "Pending"}</p>
            <p className="text-xs text-muted-foreground">{planSuggestion?.rationale}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {planSuggestion?.focus.map((item: string) => (
                <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xxs font-semibold uppercase tracking-[0.2em] text-primary">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <WizardNav prevHref="/onboarding/step4" />
    </div>
  );
}
