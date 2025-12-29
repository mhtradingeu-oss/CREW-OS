import { Suspense } from "react";
import UsersPageClient from "./UsersPageClient";

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersPageClient />
    </Suspense>
  );
}
