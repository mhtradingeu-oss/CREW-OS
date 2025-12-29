import type { ReactNode } from "react";

export const metadata = {
  title: "MH-OS",
  description: "Public experience for MH-OS Superapp",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
