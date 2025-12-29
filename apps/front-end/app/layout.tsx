
// Architectural: RootLayout wraps all pages in AppShell (Server Component)
// All imports explicit, ESM, alias-based
import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import AppShell from '@/components/shell/AppShell.tsx';

export const metadata: Metadata = {
  title: "MH-OS SUPERAPP",
  description: "Global command shell for brands, automation, and virtual office.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
