/**
 * DashboardShell is the persistent layout for the admin, handling navigation + top bar.
 * Keep the API light: it only expects children. Navigation items live locally to match RBAC.
 */
import { ReactNode } from "react";
import { TenantAppShell } from "@/components/shell/tenant-app-shell";

export function DashboardShell({ children }: { children: ReactNode }) {
  return <TenantAppShell>{children}</TenantAppShell>;
}
