import { ReactNode } from "react";
import { PageHeader } from "./page-header.tsx";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "./section-card.tsx";
import { SimpleTable } from "./simple-table.tsx";
import { AIRecommendationPanel } from "./ai-recommendation-panel.tsx";
export type TableRow = (string | number | ReactNode)[];

export type AiInsights = {
  title?: string;
  description?: string;
  items: string[];
};

export type ModulePageProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  meta?: string;
  controlStrip?: ReactNode;
  kpis: Array<{
    title: string;
    value: string;
    hint?: string;
    trend?: string;
    icon?: ReactNode;
  }>;
  table: {
    title: string;
    description?: string;
    columns: string[];
    rows: TableRow[];
    filters?: ReactNode;
  };
  aiInsights?: AiInsights;
  aiPanel?: ReactNode;
};

export function ModulePageLayout({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  controlStrip,
  kpis,
  table,
  aiInsights,
  aiPanel,
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumbs={breadcrumbs}
        meta={meta}
      />
      {controlStrip ? (
        <div className="space-y-3 pt-1">{controlStrip}</div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi: typeof kpis[number]) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            hint={kpi.hint ?? kpi.trend}
            meta={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </div>
      <SectionCard title={table.title} description={table.description}>
        {table.filters && <div>{table.filters}</div>}
        <SimpleTable columns={table.columns} rows={table.rows} />
      </SectionCard>
      <SectionCard
        title={aiInsights?.title ?? "AI Recommendations"}
        description={aiInsights?.description ?? "Future AI insights and suggested automations."}
        className="bg-transparent border-white/5"
      >
        {aiPanel ?? <AIRecommendationPanel items={aiInsights?.items ?? []} />}
      </SectionCard>
    </div>
  );
}
