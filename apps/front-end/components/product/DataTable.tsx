import * as React from 'react';

interface DataTableProps<T> {
  columns: Array<{ key: keyof T; label: string; render?: (row: T) => React.ReactNode }>;
  data: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({ columns, data, loading, empty, className }: DataTableProps<T>) {
  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (!data.length) return <div className="py-8 text-center">{empty || 'No data found.'}</div>;
  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            {columns.map((col: typeof columns[number]) => (
              <th key={String(col.key)} className="text-left px-4 py-2 font-semibold text-sm">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: T) => (
            <tr key={row.id} className="bg-white hover:bg-gray-50">
              {columns.map((col: typeof columns[number]) => (
                <td key={String(col.key)} className="px-4 py-2 text-sm">
                  {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
