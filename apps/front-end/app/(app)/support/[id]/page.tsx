"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, LifeBuoy, Mail, PhoneCall, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SectionCard } from "@/components/shell/section-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { getSupportTicket, getSupportAiSummary, type SupportAiSummaryDto, type SupportTicketDto } from "@/lib/api/support";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackTicket: SupportTicketDto = {
  id: "t-1001",
  subject: "POS outage at Stand 12",
  status: "OPEN",
  priority: "P1",
  assignee: "Support",
  channel: "Email",
  customer: "Stand 12",
  slaBreached: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

const fallbackAi: SupportAiSummaryDto = {
  severity: "HIGH",
  sentiment: "Frustrated",
  intent: "Restore POS",
  nextActions: [
    "Restart POS agent on Stand 12",
    "Check payment gateway status",
    "Escalate to infra if offline >10m",
  ],
};

const timelineEvents = [
  {
    id: "ev-1",
    title: "Ticket created",
    subtitle: "Customer reported POS outage",
    meta: "Channel: Email",
    at: new Date("2024-01-02T10:00:00Z"),
  },
  {
    id: "ev-2",
    title: "Agent responded",
    subtitle: "Requested logs from Stand 12",
    meta: "Assignee: Support",
    at: new Date("2024-01-02T10:10:00Z"),
  },
  {
    id: "ev-3",
    title: "AI triage",
    subtitle: "Suggest restart POS agent",
    meta: "Severity HIGH",
    at: new Date("2024-01-02T10:12:00Z"),
  },
];

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<"overview" | "ai" | "activity">("overview");
  const [askOpen, setAskOpen] = useState(false);

  const ticketQuery = useQuery({
    queryKey: ["support", params.id],
    queryFn: () => getSupportTicket(params.id),
  });

  const aiQuery = useQuery({
    queryKey: ["support", params.id, "ai"],
    queryFn: () => getSupportAiSummary(params.id),
  });

  const ticket = ticketQuery.data ?? fallbackTicket;
  const aiSummary = aiQuery.data ?? fallbackAi;

  const timeline = useMemo(() => [{ day: "Recent", events: timelineEvents }], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description="AI triage, SLA status, and activity for this ticket."
        breadcrumbs={[{ label: "Support", href: "/support" }, { label: params.id }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAskOpen(true)}>
              Ask AI
            </Button>
            <Button>Update status</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Status" value={ticket.status} hint="Live" meta={<LifeBuoy className="h-4 w-4 text-primary" />} />
        <StatCard title="Priority" value={ticket.priority ?? "-"} hint="Routing" meta={<AlertTriangle className="h-4 w-4 text-red-500" />} />
        <StatCard title="Assignee" value={ticket.assignee ?? "Unassigned"} hint="Owner" meta={<PhoneCall className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Sentiment" value={aiSummary.sentiment} hint="AI" meta={<Sparkles className="h-4 w-4 text-amber-500" />} />
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
          title="Ticket overview"
          description="Channel, customer, and SLA posture."
          actions={<Badge variant="outline">Channel: {ticket.channel ?? "-"}</Badge>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Customer</p>
              <p className="text-sm text-muted-foreground">{ticket.customer ?? "Unknown"}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">SLA</p>
              <p className="text-sm text-muted-foreground">{ticket.slaBreached ? "Breached" : "On track"}</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {tab === "ai" ? (
        <SectionCard title="AI summary" description="Deterministic triage for audit.">
          <div className="space-y-3 text-sm">
            <p><strong>Severity:</strong> {aiSummary.severity}</p>
            <p><strong>Sentiment:</strong> {aiSummary.sentiment}</p>
            <p><strong>Intent:</strong> {aiSummary.intent}</p>
            <p><strong>Next actions:</strong> {aiSummary.nextActions.join(", ")}</p>
          </div>
        </SectionCard>
      ) : null}

      {tab === "activity" ? (
        <SectionCard title="Activity timeline" description="Recent events for this ticket.">
          <ActivityTimeline items={timeline} />
        </SectionCard>
      ) : null}

      <Modal open={askOpen} title="Ask AI about this ticket" onClose={() => setAskOpen(false)}>
        <div className="space-y-4">
          <Textarea placeholder="Ask for triage, RCA hints, or reply suggestions" />
          {(ticketQuery.isError || aiQuery.isError) ? (
            <p className="text-xs text-red-500">{apiErrorMessage(ticketQuery.error ?? aiQuery.error)}</p>
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
