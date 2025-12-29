"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Mail, PhoneCall, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SectionCard } from "@/components/shell/section-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { getLead, scoreLead, type LeadAIScoreDto, type LeadDto } from "@/lib/api/crm";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackLead: LeadDto = {
  id: "lead-1",
  name: "Aurora Spa",
  status: "Negotiation",
  ownerId: "crm",
  score: 91,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fallbackScore: LeadAIScoreDto = {
  score: 90,
  probability: 0.42,
  reasons: ["Recent engagement high", "Budget confirmed", "Positive sentiment"],
  nextAction: "Send proposal and schedule call",
};

const timelineNow = Date.now();

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<"overview" | "ai" | "activity">("overview");
  const [askOpen, setAskOpen] = useState(false);

  const leadQuery = useQuery({ queryKey: ["crm", params.id], queryFn: () => getLead(params.id) });
  const aiScoreQuery = useQuery({ queryKey: ["crm", params.id, "ai"], queryFn: () => scoreLead(params.id) });

  const lead = leadQuery.data ?? fallbackLead;
  const aiScore = aiScoreQuery.data ?? fallbackScore;

  const timeline = useMemo(() => {
    return [
      {
        day: "Recent",
        events: [
          {
            id: "ev-1",
            title: "Email opened",
            subtitle: "Pricing deck viewed",
            meta: "Today",
            at: new Date(),
          },
          {
            id: "ev-2",
            title: "Call scheduled",
            subtitle: "Follow-up with growth lead",
            meta: "Yesterday",
            at: new Date(timelineNow - 1000 * 60 * 60 * 20),
          },
        ],
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name ?? "Lead"}
        description="AI-driven scoring, follow-ups, and timeline."
        breadcrumbs={[{ label: "Growth", href: "/growth" }, { label: "CRM", href: "/growth/crm" }, { label: params.id }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAskOpen(true)}>
              Ask AI
            </Button>
            <Button>Start cadence</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Score" value={`${aiScore.score}`} hint="AI" meta={<Sparkles className="h-4 w-4 text-primary" />} />
        <StatCard title="Win probability" value={`${Math.round(aiScore.probability * 100)}%`} hint="Model" meta={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        <StatCard title="Owner" value={lead.ownerId ?? "-"} hint="Routing" meta={<PhoneCall className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["overview", "ai", "activity"] as const).map((key) => (
            <Button key={key} variant={tab === key ? "default" : "ghost"} size="sm" onClick={() => setTab(key)}>
              {key.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <SectionCard
          title="Lead overview"
          description="Contact, stage, and routing."
          actions={<Badge variant="outline">Stage: {lead.status ?? "-"}</Badge>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Contact</p>
              <p className="text-sm text-muted-foreground">Email, phone, company metadata TBD.</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Routing</p>
              <p className="text-sm text-muted-foreground">Owner {lead.ownerId ?? "-"}; auto-escalate if SLA breached.</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {tab === "ai" ? (
        <SectionCard title="AI scoring" description="Deterministic score + next action.">
          <div className="space-y-3 text-sm">
            <p><strong>Score:</strong> {aiScore.score} · Probability {Math.round(aiScore.probability * 100)}%</p>
            <p><strong>Reasons:</strong> {aiScore.reasons.join(", ")}</p>
            <p><strong>Next action:</strong> {aiScore.nextAction}</p>
          </div>
        </SectionCard>
      ) : null}

      {tab === "activity" ? (
        <SectionCard title="Activity timeline" description="Signals and events for this lead.">
          <ActivityTimeline items={timeline} />
        </SectionCard>
      ) : null}

      <Modal open={askOpen} title="Ask AI about this lead" onClose={() => setAskOpen(false)}>
        <div className="space-y-4">
          <Textarea placeholder="Ask for next best action or objection handling" />
          {leadQuery.isError || aiScoreQuery.isError ? (
            <p className="text-xs text-red-500">{apiErrorMessage(leadQuery.error ?? aiScoreQuery.error)}</p>
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
