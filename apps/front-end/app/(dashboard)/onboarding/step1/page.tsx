import { Suspense } from "react";
import OnboardingStep1PageClient from "./OnboardingStep1PageClient.tsx";

export default function OnboardingStep1Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingStep1PageClient />
    </Suspense>
  );
}
