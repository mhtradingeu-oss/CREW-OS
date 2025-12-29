import { Suspense } from "react";
import CompetitorPricingPageClient from "./CompetitorPricingPageClient";

export default function CompetitorPricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompetitorPricingPageClient />
    </Suspense>
  );
}
