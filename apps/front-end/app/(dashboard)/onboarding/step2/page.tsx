import { Suspense } from "react";
import OnboardingStep2GoalsPageClient from "./OnboardingStep2GoalsPageClient";

export default function OnboardingStep2GoalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingStep2GoalsPageClient />
    </Suspense>
  );
}
