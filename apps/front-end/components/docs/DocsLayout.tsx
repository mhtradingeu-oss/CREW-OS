import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DocsLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export default function DocsLayout({ children, sidebar }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-950">
        <div className="font-bold text-lg tracking-tight">MH-OS SUPERAPP Docs</div>
        {/* Add logo or nav if needed */}
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-64 border-r bg-muted/50 p-4 overflow-y-auto hidden md:block">
          {sidebar}
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
