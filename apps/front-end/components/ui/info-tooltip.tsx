"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type InfoTooltipProps = {
  content: string;
  className?: string;
};

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center rounded-full border border-border p-1 text-muted-foreground hover:text-foreground",
        className,
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label={content}
    >
      <Info className="h-3.5 w-3.5" />
      {open && (
        <div className="absolute left-1/2 top-8 z-20 w-64 -translate-x-1/2 rounded-md border border-border bg-popover p-3 text-xs text-foreground shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
}
