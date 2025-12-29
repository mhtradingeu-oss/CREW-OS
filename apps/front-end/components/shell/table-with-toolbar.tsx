import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleTable } from "./simple-table.tsx";
import { cn } from "@/lib/utils";

export type TableWithToolbarProps = {
  title?: string;
  description?: string;
  columns: (string | ReactNode)[];
  rows: (string | number | ReactNode)[][];
  className?: string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  bulkActions?: ReactNode;
};

export function TableWithToolbar({
  title,
  description,
  columns,
  rows,
  className,
  searchPlaceholder = "Search...",
  filters,
  actions,
  bulkActions,
}: TableWithToolbarProps) {
  return (
    <div className={cn("space-y-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? <h3 className="text-base font-semibold leading-tight">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Input placeholder={searchPlaceholder} className="w-64" />
          {filters ? filters : null}
        </div>
        {bulkActions ? <div className="flex items-center gap-2">{bulkActions}</div> : null}
      </div>
      <SimpleTable columns={columns as string[]} rows={rows} />
      {!columns.length || !rows.length ? (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <span>No data yet.</span>
          <Button variant="ghost" size="sm">
            Refresh
          </Button>
        </div>
      ) : null}
    </div>
  );
}
