import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { SuperAdminShell } from "@/components/superadmin/super-admin-shell";

export const metadata = {
  title: "SuperAdmin | MH-OS",
  description: "Platform control plane",
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="SUPER_ADMIN" fallback={<div className="p-8 text-center text-muted-foreground">Checking access...</div>}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </RequireRole>
  );
}
