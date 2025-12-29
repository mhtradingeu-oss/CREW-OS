import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHeader is used inside pages to separate blocks with a small label and optional action.
 * Keep it light to avoid visual noise.
 */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-3", className)}>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {action}
    </div>
  );
}
