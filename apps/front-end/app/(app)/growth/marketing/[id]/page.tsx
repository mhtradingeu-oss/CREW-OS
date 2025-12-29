"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Megaphone, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SectionCard } from "@/components/shell/section-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { listCampaigns, getCampaign, type CampaignDto } from "@/lib/api/marketing";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackCampaign: CampaignDto = {
  id: "cmp-1",
  name: "Global Launch",
  objective: "Awareness",
  budget: 42000,
  status: "ACTIVE",
  brandId: "mh",
  channelId: "omni",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function MarketingDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<"overview" | "ai" | "activity">("overview");
  const [askOpen, setAskOpen] = useState(false);

  const campaignQuery = useQuery({
    queryKey: ["marketing", params.id],
    queryFn: () => getCampaign(params.id),
  });

  const activityQuery = useQuery({
    queryKey: ["marketing", params.id, "events"],
    queryFn: () => listCampaigns({ page: 1, pageSize: 3 }),
  });

  const campaign = campaignQuery.data ?? fallbackCampaign;

  const timeline = useMemo(() => {
    const data = activityQuery.data?.data ?? [];
    return [
      {
        day: "Recent",
        events: data.map((item) => ({
          id: item.id,
          title: `${item.name} status ${item.status ?? "PENDING"}`,
          subtitle: item.objective ?? "Campaign objective",
          meta: `Budget $${item.budget ?? 0}`,
          at: new Date(item.updatedAt),
        })),
      },
    ];
  }, [activityQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description="Campaign health, assets, and AI creative rationale."
        breadcrumbs={[{ label: "Growth", href: "/growth" }, { label: "Marketing", href: "/growth/marketing" }, { label: params.id }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAskOpen(true)}>
              Ask AI
            </Button>
            <Button>Launch update</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Budget" value={`$${campaign.budget ?? 0}`} hint="Total" meta={<BarChart3 className="h-4 w-4 text-primary" />} />
        <StatCard title="Status" value={campaign.status ?? "-"} hint="Workflow" meta={<Megaphone className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="AI ideas" value="3" hint="Queued" meta={<Sparkles className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["overview", "ai", "activity"] as const).map((key) => (
            <Button
              key={key}
              variant={tab === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(key)}
            >
              {key.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <SectionCard
          title="Campaign overview"
          description="Objectives, guardrails, and channels."
          actions={<Badge variant="outline">Objective: {campaign.objective ?? "-"}</Badge>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Channels</p>
              <p className="text-sm text-muted-foreground">Omni (paid social, email, POS)</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Guardrails</p>
              <p className="text-xs text-muted-foreground">Brand-safe copy; auto-approve if spend &lt; $2k.</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {tab === "ai" ? (
        <SectionCard title="AI rationale" description="Deterministic summary for creative + spend.">
          <div className="space-y-3 text-sm">
            <p><strong>Creative cues:</strong> Highlight loyalty perk in hero frame; add CTA by 3s.</p>
            <p><strong>Spend guidance:</strong> Shift +10% to POS geo after stand demand spike.</p>
            <p><strong>Risk:</strong> Ensure claims stay within compliance copybook.</p>
          </div>
        </SectionCard>
      ) : null}

      {tab === "activity" ? (
        <SectionCard title="Activity timeline" description="Recent campaign events.">
          <ActivityTimeline items={timeline} />
        </SectionCard>
      ) : null}

      <Modal open={askOpen} title="Ask AI about this campaign" onClose={() => setAskOpen(false)}>
        <div className="space-y-4">
          <Textarea placeholder="Ask for creative variants or spend shifts" />
          {(campaignQuery.isError || activityQuery.isError) ? (
            <p className="text-xs text-red-500">{apiErrorMessage(campaignQuery.error ?? activityQuery.error)}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button>Send</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
