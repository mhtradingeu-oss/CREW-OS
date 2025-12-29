import { Suspense } from "react";
import OnboardingStep5ConfirmPageClient from "./OnboardingStep5ConfirmPageClient";

export default function OnboardingStep5ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingStep5ConfirmPageClient />
    </Suspense>
  );
}
