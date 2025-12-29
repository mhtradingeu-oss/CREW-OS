"use client";

import { ReactNode } from "react";
import { RequireRole } from "@/components/auth";

export default function CommerceLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role={["ADMIN", "BRAND_ADMIN"]}>
      {children}
    </RequireRole>
  );
}
