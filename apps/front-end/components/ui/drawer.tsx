"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DrawerProps = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  footer?: ReactNode;
  className?: string;
};

// Lightweight drawer built on portal-less overlay to avoid extra deps.
export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  side = "right",
  footer,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl transition-transform animate-in slide-in-from-right",
          side === "left" ? "ml-0 mr-auto border-l-0 border-r animate-in slide-in-from-left" : "ml-auto",
          className,
        )}
        style={{ transform: open ? "translateX(0)" : side === "left" ? "-100%" : "100%" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title ? <h3 className="text-lg font-semibold leading-tight">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
