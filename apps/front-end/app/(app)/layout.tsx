import type { Metadata } from "next";
import { TenantAppLayout } from "@/components/shell/tenant-app-layout";

export const metadata: Metadata = {
  title: "MH-OS SuperApp Shell",
  description: "High-level navigation shell for MH-OS global operating system",
};

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return <TenantAppLayout>{children}</TenantAppLayout>;
}
