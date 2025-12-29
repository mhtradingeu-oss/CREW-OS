import { Suspense } from "react";
import CreateAutomationPageClient from "./CreateAutomationPageClient";

export default function CreateAutomationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAutomationPageClient />
    </Suspense>
  );
}
