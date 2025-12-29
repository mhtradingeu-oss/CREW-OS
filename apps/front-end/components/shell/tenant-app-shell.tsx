import { ReactNode } from "react";
import { TenantSidebar } from "./tenant-sidebar.tsx";
import { TenantTopbar, type TenantTopbarProps } from "./tenant-topbar.tsx";

export type TenantAppShellProps = {
  children: ReactNode;
  breadcrumbs?: TenantTopbarProps["breadcrumbs"];
};

export function TenantAppShell({ children, breadcrumbs }: TenantAppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <TenantSidebar />
      <div className="flex flex-1 flex-col">
        <TenantTopbar breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
