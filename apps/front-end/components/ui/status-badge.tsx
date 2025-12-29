import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      tone: {
        default: "border-border bg-secondary text-secondary-foreground",
        success: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200/60 bg-amber-50 text-amber-700",
        danger: "border-rose-200/60 bg-rose-50 text-rose-700",
        info: "border-sky-200/60 bg-sky-50 text-sky-700",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadge> {}

export function StatusBadge({ className, tone, ...props }: StatusBadgeProps) {
  return <div className={cn(statusBadge({ tone }), className)} {...props} />;
}
