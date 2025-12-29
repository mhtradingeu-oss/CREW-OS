import { Suspense } from "react";
import BrandDetailPageClient from "./BrandDetailPageClient";

export default function BrandDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandDetailPageClient />
    </Suspense>
  );
}
