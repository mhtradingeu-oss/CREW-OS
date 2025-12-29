import { Suspense } from "react";
import InventoryDetailPageClient from "./InventoryDetailPageClient";

export default function InventoryDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryDetailPageClient />
    </Suspense>
  );
}
