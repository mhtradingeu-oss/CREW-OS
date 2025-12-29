import { Suspense } from "react";
import UserDetailPageClient from "./UserDetailPageClient";

export default function UserDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserDetailPageClient />
    </Suspense>
  );
}
