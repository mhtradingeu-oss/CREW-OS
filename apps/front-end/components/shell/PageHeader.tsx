import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  statusBadge?: { label: string; variant?: string };
  right?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader: Unified admin page header for MH-OS SUPERAPP
 * - Title (H1)
 * - Description (1 line max)
 * - Optional right-side context (badge/status)
 * - Consistent spacing/typography
 */
export function PageHeader({ title, description, statusBadge, right, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <h1 className="text-3xl font-bold text-white leading-tight">{title}</h1>
        {description && <p className="text-slate-400 text-base mt-1 max-w-2xl truncate">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {statusBadge && <Badge variant={statusBadge.variant as any}>{statusBadge.label}</Badge>}
        {right}
      </div>
    </header>
  );
}
