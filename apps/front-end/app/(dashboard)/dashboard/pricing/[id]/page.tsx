import { Suspense } from "react";
import PricingDetailPageClient from "./PricingDetailPageClient";

export default function PricingDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingDetailPageClient />
    </Suspense>
  );
}
