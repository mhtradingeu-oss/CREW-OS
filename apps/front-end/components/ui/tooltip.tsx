import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  // Simple tooltip for V1 (no logic)
  return (
    <span className="group relative inline-block">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 scale-0 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:scale-100 group-hover:opacity-100">
        {content}
      </span>
    </span>
  );
}
