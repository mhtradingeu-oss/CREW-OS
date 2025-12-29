import { Suspense } from "react";
import InventoryPageClient from "./InventoryPageClient";

export default function InventoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryPageClient />
    </Suspense>
  );
}
