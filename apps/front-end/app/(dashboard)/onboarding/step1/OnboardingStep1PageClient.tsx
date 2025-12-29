"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepHeader } from "../components/StepHeader.tsx";
import { WizardNav } from "../components/WizardNav.tsx";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { useOnboardingStore } from "../context/onboarding-store.ts";
// Local read-only mock onboarding store for V1
const useOnboardingStore = () => {
  const [persona, setPersona] = React.useState("");
  return { persona, setPersona };
};
import { postOnboardingPersona } from "@/lib/api/onboarding";
import type { PersonaChoice } from "@/types/onboarding.types";

const PERSONAS: { value: PersonaChoice | string; title: string; blurb: string }[] = [
  { value: "founder", title: "Founder / Operator", blurb: "Own the stack, launch fast." },
  { value: "marketer", title: "Marketing", blurb: "Campaigns, content, AI copy." },
  { value: "ops", title: "Operations", blurb: "Pricing, inventory, approvals." },
  { value: "sales", title: "Sales / Field", blurb: "Stands, reps, refills." },
  { value: "finance", title: "Finance", blurb: "Margins, forecasts, budgets." },
  { value: "product", title: "Product", blurb: "SKU roadmap, variants." },
  { value: "growth", title: "Growth", blurb: "Funnels, conversion, CAC." },
  { value: "support", title: "Support", blurb: "Tickets, SLAs, CSAT." },
  { value: "ai", title: "AI Lead", blurb: "Orchestrate agents, prompts." },
  { value: "partner", title: "Partner", blurb: "Ecosystem integrations." },
];

export default function OnboardingStep1PageClient() {
  const router = useRouter();
  const { persona, setPersona } = useOnboardingStore();

  const mutation = useMutation({
    mutationFn: (choice: PersonaChoice | string) => postOnboardingPersona({ persona: choice }),
    onSuccess: (_, choice) => {
      setPersona(choice);
      toast.success("Persona saved");
      router.push("/onboarding/step2");
    },
    onError: (err) => toast.error((err as Error).message ?? "Failed to save persona"),
  });

  return (
    <div className="space-y-6">
      <StepHeader
        step={1}
        title="Choose your persona"
        description="Pick the role that best fits how you'll run MH-OS."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PERSONAS.map((item: typeof PERSONAS[number]) => {
          const active = persona === item.value;
          return (
            <Card
              key={item.value}
              className={`cursor-pointer transition ${active ? "border-primary shadow" : "hover:border-slate-300"}`}
              onClick={() => mutation.mutate(item.value)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {item.title}
                  {active ? <span className="text-xs font-semibold text-primary">Selected</span> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.blurb}</CardContent>
            </Card>
          );
        })}
      </div>

      <WizardNav nextHref="/onboarding/step2" nextDisabled={!persona} />
    </div>
  );
}
