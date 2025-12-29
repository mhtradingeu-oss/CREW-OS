import { ReactNode } from "react";
import { TenantAppShell } from "./tenant-app-shell.tsx";

type AppShellProps = {
  children: ReactNode;
};

// Deprecated wrapper kept for backward compatibility; delegates to the unified tenant shell.
export function AppShell({ children }: AppShellProps) {
  return <TenantAppShell>{children}</TenantAppShell>;
}
