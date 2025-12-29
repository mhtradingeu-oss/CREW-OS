import { Suspense } from "react";
import CreateProductPageClient from "./CreateProductPageClient";

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateProductPageClient />
    </Suspense>
  );
}
