import { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "./page-header.tsx";

export type ModuleScaffoldProps = {
  header: PageHeaderProps;
  children: ReactNode;
};

// Lightweight wrapper to standardize module pages before adding tabs/AI panels.
export function ModuleScaffold({ header, children }: ModuleScaffoldProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader {...header} />
      <div className="space-y-4">{children}</div>
    </div>
  );
}
