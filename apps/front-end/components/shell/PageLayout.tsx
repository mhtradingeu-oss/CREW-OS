import * as React from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * PageLayout: Unified wrapper for all admin pages
 * - Consistent spacing, rhythm, and background
 * - Optional footer for governance/version notes
 * - Use with PageHeader and main content
 */
export function PageLayout({ children, footer, className }: PageLayoutProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6 py-8 flex flex-col gap-8", className)}>
      {children}
      {footer && (
        <footer className="pt-6 mt-8 border-t border-white/10 text-xs text-slate-500">{footer}</footer>
      )}
    </div>
  );
}
