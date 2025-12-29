"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, LifeBuoy, Sparkles, Timer } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { SectionCard } from "@/components/shell/section-card";
import { AIRecommendationPanel } from "@/components/shell/ai-recommendation-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listSupportTickets, type SupportTicketDto } from "@/lib/api/support";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackTickets: SupportTicketDto[] = [
  {
    id: "t-1001",
    subject: "POS outage at Stand 12",
    status: "OPEN",
    priority: "P1",
    assignee: "Support",
    channel: "Email",
    customer: "Stand 12",
    slaBreached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t-1002",
    subject: "Invoice mismatch",
    status: "IN_PROGRESS",
    priority: "P2",
    assignee: "Finance",
    channel: "Portal",
    customer: "Retail North",
    slaBreached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t-1003",
    subject: "Loyalty points not syncing",
    status: "OPEN",
    priority: "P2",
    assignee: "Loyalty",
    channel: "Chat",
    customer: "Spa East",
    slaBreached: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function SupportPage() {
  const [showErrors, setShowErrors] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: () => listSupportTickets({ page: 1, pageSize: 25 }),
  });

  const rows = useMemo(() => {
    const data = ticketsQuery.data?.data ?? fallbackTickets;
    return data.map((ticket) => [
      <Link key={ticket.id} href={`/support/${ticket.id}`} className="font-medium underline-offset-4 hover:underline">
        {ticket.subject}
      </Link>,
      <Badge key={`${ticket.id}-status`} variant="outline">{ticket.status}</Badge>,
      <Badge key={`${ticket.id}-priority`} variant="secondary">{ticket.priority ?? "-"}</Badge>,
      ticket.assignee ?? "-",
      ticket.slaBreached ? <Badge variant="destructive">SLA</Badge> : <Badge variant="outline">On track</Badge>,
    ]);
  }, [ticketsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Ticket triage, SLAs, and AI summaries."
        breadcrumbs={[{ label: "Support" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowErrors((v) => !v)}>
              {showErrors ? "Hide status" : "Show status"}
            </Button>
            <Button>New ticket</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open" value="24" hint="All priorities" meta={<LifeBuoy className="h-4 w-4 text-primary" />} />
        <StatCard title="Breaches" value="3" hint="SLA" meta={<AlertOctagon className="h-4 w-4 text-red-500" />} />
        <StatCard title="AI triage" value="12" hint="Last 24h" meta={<Sparkles className="h-4 w-4 text-amber-500" />} />
        <StatCard title="Avg response" value="7m" hint="P1" meta={<Timer className="h-4 w-4 text-green-500" />} />
      </div>

      <TableWithToolbar
        title="Ticket board"
        description="React Query fetches tickets; AI assists triage."
        columns={["Ticket", "Status", "Priority", "Assignee", "SLA"]}
        rows={rows}
        searchPlaceholder="Search tickets"
        actions={<Button size="sm" variant="ghost">Export</Button>}
      />

      {showErrors && ticketsQuery.isError ? (
        <p className="text-sm text-red-500">{apiErrorMessage(ticketsQuery.error)}</p>
      ) : null}

      <SectionCard
        title="Runbooks"
        description="Keep ops consistent across channels."
        actions={<Badge variant="outline">AI pilot</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">POS outage</p>
            <p className="text-sm text-muted-foreground">Check gateway, restart POS agent, escalate to Infra.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Loyalty sync</p>
            <p className="text-sm text-muted-foreground">Verify ledger worker status; rerun sync; notify loyalty lead.</p>
          </div>
        </div>
      </SectionCard>

      <AIRecommendationPanel
        title="AI triage cues"
        items={[
          "Escalate Stand 12 outage if POS agent offline for >10m.",
          "Auto-reply invoice mismatch tickets with checklist and assign finance.",
          "Surface loyalty sync tickets to Growth when CLV accounts impacted.",
        ]}
      />
    </div>
  );
}
