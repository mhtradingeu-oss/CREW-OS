import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ title = "Something went wrong", description, action, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200/70 bg-red-50/80 p-6 text-center text-red-800",
        className,
      )}
    >
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <div className="text-sm font-semibold">{title}</div>
      {description ? <p className="text-xs text-red-700/90">{description}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
