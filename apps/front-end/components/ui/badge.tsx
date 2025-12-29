import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]",
        secondary: "border-transparent bg-[var(--brand-secondary)] text-white",
        outline: "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--brand-surface)]",
        destructive: "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, style, ...props }: BadgeProps & { style?: React.CSSProperties }) {
  return <div className={cn(badgeVariants({ variant }), className)} style={style} {...props} />;
}
