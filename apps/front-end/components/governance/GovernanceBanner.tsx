import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GovernanceBannerProps {
  text?: string;
  className?: string;
}

export function GovernanceBanner({ text = "Execution is disabled in V1. This view is read-only.", className }: GovernanceBannerProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-amber-700 bg-amber-900/80 px-4 py-3 text-amber-200 font-semibold mb-6", className)} role="status" aria-live="polite">
      <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
