import { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type LoadingStateProps = {
  message?: string;
  icon?: ReactNode;
  className?: string;
};

export function LoadingState({ message = "Loading...", icon, className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-6 text-center",
        className,
      )}
    >
      {icon ?? <Spinner className="h-6 w-6" />}
      <div className="text-sm font-semibold text-foreground">{message}</div>
    </div>
  );
}
