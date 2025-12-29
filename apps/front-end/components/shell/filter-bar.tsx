import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs uppercase tracking-[0.35em] text-slate-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
