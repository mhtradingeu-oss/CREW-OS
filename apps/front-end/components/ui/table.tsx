import * as React from "react";
import { cn } from "@/lib/utils";

const Table = ({ className, style, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={cn("w-full caption-bottom text-sm bg-[var(--brand-surface)] text-[var(--brand-text)]", className)} style={style} {...props} />
);

const TableHeader = ({ className, style, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)} style={style} {...props} />
);

const TableBody = ({ className, style, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} style={style} {...props} />
);

const TableRow = ({ className, style, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b transition-colors hover:bg-[var(--brand-secondary)]/10", className)} style={style} {...props} />
);

const TableHead = ({ className, style, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn("h-10 px-2 text-left align-middle font-medium text-[var(--brand-primary)]", className)}
    style={style}
    {...props}
  />
);

const TableCell = ({ className, style, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-2 align-middle", className)} style={style} {...props} />
);

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
