import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SimpleTableProps = {
  columns: (string | ReactNode)[];
  rows: (ReactNode | string | number)[][];
  className?: string;
};

export function SimpleTable({ columns, rows, className }: SimpleTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column: typeof columns[number], idx: number) => (
              <TableHead key={typeof column === "string" ? column : idx}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: typeof rows[number], rowIndex: number) => (
            <TableRow key={rowIndex}>
              {row.map((cell: typeof row[number], cellIndex: number) => (
                <TableCell key={`${rowIndex}-${cellIndex}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
