import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FiltersBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * FiltersBar aligns filter controls horizontally with consistent spacing.
 */
export function FiltersBar({ children, className }: FiltersBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card/60 p-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
