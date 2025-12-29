"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { SectionCard } from "@/components/shell/section-card";
import { AIRecommendationPanel } from "@/components/shell/ai-recommendation-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listCampaigns, type CampaignDto } from "@/lib/api/marketing";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackCampaigns: CampaignDto[] = [
  { id: "cmp-1", name: "Global Launch", objective: "Awareness", budget: 42000, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cmp-2", name: "Studio CRM", objective: "Retention", budget: 8000, status: "PAUSED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cmp-3", name: "Stand Pop", objective: "Field", budget: 4000, status: "DRAFT", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function GrowthMarketingPage() {
  const [showErrors, setShowErrors] = useState(false);

  const campaignsQuery = useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: () => listCampaigns({ page: 1, pageSize: 25 }),
  });

  const rows = useMemo(() => {
    const data = campaignsQuery.data?.data ?? fallbackCampaigns;
    return data.map((cmp) => [
      <Link key={cmp.id} href={`/growth/marketing/${cmp.id}`} className="font-medium underline-offset-4 hover:underline">
        {cmp.name}
      </Link>,
      cmp.objective ?? "-",
      <Badge key={`${cmp.id}-status`} variant="outline">{cmp.status ?? "-"}</Badge>,
      cmp.budget ? `$${cmp.budget.toLocaleString()}` : "-",
      "Growth",
    ]);
  }, [campaignsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth · Marketing"
        description="Campaign health, spend, and AI creative cues."
        breadcrumbs={[{ label: "Growth", href: "/growth" }, { label: "Marketing" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowErrors((v) => !v)}>
              {showErrors ? "Hide status" : "Show status"}
            </Button>
            <Button>New campaign</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="ROAS" value="4.2x" hint="Trailing 30d" meta={<TrendingUp className="h-4 w-4 text-green-500" />} />
        <StatCard title="Active campaigns" value="18" hint="Multi-channel" meta={<Megaphone className="h-4 w-4 text-primary" />} />
        <StatCard title="Experiments" value="9" hint="A/B + creative" meta={<PlayCircle className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="AI ideas" value="7" hint="Queued" meta={<Sparkles className="h-4 w-4 text-amber-500" />} />
      </div>

      <TableWithToolbar
        title="Campaign board"
        description="React Query pulls campaigns; AI drafts creative next."
        columns={["Campaign", "Objective", "Status", "Budget", "Owner"]}
        rows={rows}
        searchPlaceholder="Search campaigns"
        actions={<Button size="sm" variant="ghost">Export</Button>}
      />

      {showErrors && campaignsQuery.isError ? (
        <p className="text-sm text-red-500">{apiErrorMessage(campaignsQuery.error)}</p>
      ) : null}

      <SectionCard
        title="Creative pipeline"
        description="AI drafts and orchestrates assets across channels."
        actions={<Badge variant="outline">AI pilot</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Next up</p>
            <p className="text-sm text-muted-foreground">Launch video for Studio CRM with loyalty CTA.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Guardrails</p>
            <p className="text-sm text-muted-foreground">Brand-safe copy, auto-approve only when spend &lt; $2k.</p>
          </div>
        </div>
      </SectionCard>

      <AIRecommendationPanel
        title="AI creative cues"
        items={[
          "Boost Global Launch spend in North America after inventory sync.",
          "Test loyalty snippet in CRM email #4 with A/B images.",
          "Re-activate Stand Pop bundle with CLV audience lookalike.",
        ]}
      />
    </div>
  );
}
