import { TenantAppLayout } from "@/components/shell/tenant-app-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <TenantAppLayout>{children}</TenantAppLayout>;
}
