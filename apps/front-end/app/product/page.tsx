import { Suspense } from "react";
import ProductPageClient from "./ProductPageClient";

export default function ProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPageClient />
    </Suspense>
  );
}
