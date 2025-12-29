import { Suspense } from "react";
import CreateUserPageClient from "./CreateUserPageClient";

export default function CreateUserPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateUserPageClient />
    </Suspense>
  );
}
