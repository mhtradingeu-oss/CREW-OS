"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, PhoneCall, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { SectionCard } from "@/components/shell/section-card";
import { AIRecommendationPanel } from "@/components/shell/ai-recommendation-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listLeads, type LeadDto } from "@/lib/api/crm";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackLeads: LeadDto[] = [
  { id: "lead-1", name: "Aurora Spa", score: 91, status: "Negotiation", ownerId: "crm", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "lead-2", name: "Urban Rituals", score: 78, status: "Qualification", ownerId: "sales", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "lead-3", name: "Field Studio", score: 64, status: "Discovery", ownerId: "field", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function GrowthCrmPage() {
  const [showErrors, setShowErrors] = useState(false);

  const leadsQuery = useQuery({
    queryKey: ["crm", "leads"],
    queryFn: () => listLeads({ page: 1, pageSize: 25 }),
  });

  const rows = useMemo(() => {
    const data = leadsQuery.data?.data ?? fallbackLeads;
    return data.map((lead) => [
      <Link key={lead.id} href={`/growth/crm/${lead.id}`} className="font-medium underline-offset-4 hover:underline">
        {lead.name ?? "Unknown"}
      </Link>,
      lead.score ?? "-",
      lead.status ?? "-",
      lead.ownerId ?? "-",
      "Next best action",
    ]);
  }, [leadsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth · CRM"
        description="Pipeline, lead scoring, and AI follow-up signals."
        breadcrumbs={[{ label: "Growth", href: "/growth" }, { label: "CRM" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowErrors((v) => !v)}>
              {showErrors ? "Hide status" : "Show status"}
            </Button>
            <Button>Create cadence</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active leads" value="284" hint="Qualified" meta={<Users className="h-4 w-4 text-primary" />} />
        <StatCard title="Conversion" value="12%" hint="Last 90d" meta={<Activity className="h-4 w-4 text-green-500" />} />
        <StatCard title="Follow-ups" value="37" hint="Need callbacks" meta={<PhoneCall className="h-4 w-4 text-amber-500" />} />
        <StatCard title="AI scores" value="9" hint="Updated today" meta={<Sparkles className="h-4 w-4 text-indigo-400" />} />
      </div>

      <TableWithToolbar
        title="Lead table"
        description="High-priority leads and next actions."
        columns={["Lead", "Score", "Stage", "Owner", "Next Step"]}
        rows={rows}
        searchPlaceholder="Search leads"
        actions={<Button size="sm" variant="ghost">Export</Button>}
      />

      {showErrors && leadsQuery.isError ? (
        <p className="text-sm text-red-500">{apiErrorMessage(leadsQuery.error)}</p>
      ) : null}

      <SectionCard
        title="Cadence guardrails"
        description="AI keeps follow-ups safe and prioritized."
        actions={<Badge variant="outline">AI pilot</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Next best action</p>
            <p className="text-sm text-muted-foreground">Call Aurora Spa; send proposal if call succeeds.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Risk & compliance</p>
            <p className="text-sm text-muted-foreground">AI ensures region-specific messaging and opt-out honoring.</p>
          </div>
        </div>
      </SectionCard>

      <AIRecommendationPanel
        title="AI follow-up signals"
        items={[
          "Close Aurora Spa with limited launch kit.",
          "Re-engage Global Salon with loyalty offer.",
          "Escalate leads with score drop >10 in 48h.",
        ]}
      />
    </div>
  );
}
