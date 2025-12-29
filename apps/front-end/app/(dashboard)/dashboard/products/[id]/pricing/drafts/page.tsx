import { Suspense } from "react";
import PricingDraftsPageClient from "./PricingDraftsPageClient";

export default function PricingDraftsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingDraftsPageClient />
    </Suspense>
  );
}
