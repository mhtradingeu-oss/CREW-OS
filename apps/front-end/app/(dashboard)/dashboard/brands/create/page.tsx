import { Suspense } from "react";
import CreateBrandPageClient from "./CreateBrandPageClient";

export default function CreateBrandPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateBrandPageClient />
    </Suspense>
  );
}
