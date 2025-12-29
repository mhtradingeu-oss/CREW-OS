import { Suspense } from "react";
import PricingPageClient from "./PricingPageClient";

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingPageClient />
    </Suspense>
  );
}
