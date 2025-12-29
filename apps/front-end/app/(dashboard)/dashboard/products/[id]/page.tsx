import { Suspense } from "react";
import ProductDetailPageClient from "./ProductDetailPageClient";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailPageClient />
    </Suspense>
  );
}
