import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./info-tooltip.tsx";

type Breadcrumb = { label: string; href?: string };

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  infoTooltip?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

// Canonical page header used across Tenant and SuperAdmin shells.
export function PageHeader({
  title,
  description,
  breadcrumbs,
  infoTooltip,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl bg-card/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb: typeof breadcrumbs[number], idx: number) => (
              <span key={crumb.label} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="opacity-60">/</span>}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold leading-tight">{title}</h1>
          {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
          {infoTooltip ? <InfoTooltip content={infoTooltip} /> : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
