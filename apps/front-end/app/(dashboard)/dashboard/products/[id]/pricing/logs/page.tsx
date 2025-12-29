import { Suspense } from "react";
import PricingLogsPageClient from "./PricingLogsPageClient";

export default function PricingLogsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingLogsPageClient />
    </Suspense>
  );
}
