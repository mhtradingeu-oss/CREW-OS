"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SectionCard } from "@/components/shell/section-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  getPricing,
  getAIPricingSuggestion,
  listLogs,
  listDrafts,
  listCompetitors,
  approveDraft,
  rejectDraft,
  aiPlan,
} from "@/lib/api/pricing";
import type {
  PricingSuggestionOutputDto,
  PricingLogEntryDto,
  PricingDraftDto,
  CompetitorPriceDto,
  PricingRecordDto,
} from "@mh-os/shared";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackSuggestion: PricingSuggestionOutputDto = {
  suggestedPrice: 42,
  reasoning: "Suggested uplift based on competitor parity and inventory health.",
  riskLevel: "LOW",
  competitorSummary: "Top 3 competitors average $41.20; two are on promo",
  confidenceScore: 0.78,
  currentNet: 40,
  strategy: "guardrail",
};

export default function PricingDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "ai" | "activity" | "settings">("overview");
  const [askOpen, setAskOpen] = useState(false);
  const [planOutput, setPlanOutput] = useState<unknown | null>(null);

  const pricingQuery = useQuery<PricingRecordDto | null>({
    queryKey: ["pricing", params.id],
    queryFn: () => getPricing(params.id),
  });

  const aiSuggestionQuery = useQuery<PricingSuggestionOutputDto | null>({
    queryKey: ["pricing", params.id, "ai"],
    queryFn: () => getAIPricingSuggestion(params.id),
    staleTime: 60 * 1000,
  });

  const logsQuery = useQuery<PricingLogEntryDto[] | null>({
    queryKey: ["pricing", params.id, "logs"],
    queryFn: () => listLogs(params.id),
  });

  const draftsQuery = useQuery<PricingDraftDto[] | null>({
    queryKey: ["pricing", params.id, "drafts"],
    queryFn: () => listDrafts(params.id),
  });

  const competitorsQuery = useQuery<CompetitorPriceDto[] | null>({
    queryKey: ["pricing", params.id, "competitors"],
    queryFn: () => listCompetitors(params.id),
  });

  const approveDraftMutation = useMutation({
    mutationFn: (draftId: string) => approveDraft(params.id, draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing", params.id, "drafts"] });
      queryClient.invalidateQueries({ queryKey: ["pricing", params.id] });
    },
  });

  const rejectDraftMutation = useMutation({
    mutationFn: (payload: { draftId: string; reason?: string }) =>
      rejectDraft(params.id, payload.draftId, { reason: payload.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing", params.id, "drafts"] });
    },
  });

  const planMutation = useMutation({
    mutationFn: () => aiPlan(params.id, { strategy: aiSuggestionQuery.data?.strategy ?? undefined }),
    onSuccess: (data) => setPlanOutput(data),
  });

  const timeline = useMemo(() => {
    const events: PricingLogEntryDto[] = logsQuery.data ?? [];
    if (!Array.isArray(events) || !events.length) return [];
    const formatMoney = (value: number | null | undefined) =>
      value === null || value === undefined ? "-" : `$${value.toFixed(2)}`;
    return [
      {
        day: "Recent",
        events: events.map((log: PricingLogEntryDto) => ({
          id: log.id,
          title: log.summary ?? "Price change",
          subtitle: `${log.channel ?? ""} ${formatMoney(log.oldNet)} → ${formatMoney(log.newNet)}`.trim(),
          meta: `${log.aiAgent ?? "AI"} • Confidence ${Math.round((log.confidenceScore ?? 0) * 100)}%`,
          at: new Date(log.createdAt),
        })),
      },
    ];
  }, [logsQuery.data]);

  const suggestion = aiSuggestionQuery.data ?? fallbackSuggestion;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price detail"
        description="Guardrails, AI reasoning, and audit timeline for this SKU."
        breadcrumbs={[
          { label: "Commerce", href: "/commerce" },
          { label: "Pricing", href: "/commerce/pricing" },
          { label: params.id },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAskOpen(true)}>
              Ask AI
            </Button>
            <Button onClick={() => planMutation.mutate()} disabled={planMutation.isLoading}>
              {planMutation.isLoading ? "Planning..." : "AI plan"}
            </Button>
          </div>
        }
      />

      {pricingQuery.isError ? (
        <p className="text-sm text-red-500">{apiErrorMessage(pricingQuery.error)}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net price"
          value={`${pricingQuery.data?.currency ?? ""} ${pricingQuery.data?.basePrice ?? 0}`}
          hint="Base"
          meta={<Sparkles className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Dealer net"
          value={`${pricingQuery.data?.currency ?? ""} ${(pricingQuery.data?.margin ?? 0).toFixed(2)}`}
          hint="Margin"
          meta={<Layers className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Guardrail"
          value="Safe"
          hint="AI lock"
          meta={<ShieldCheck className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          title="Risk"
          value={suggestion.riskLevel}
          hint="AI view"
          meta={<AlertCircle className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["overview", "ai", "activity", "settings"] as const).map((key) => (
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
          title="Pricing overview"
          description="Channel deltas and guardrail posture."
          actions={<Badge variant="outline">SKU {pricingQuery.data?.productId ?? "unknown"}</Badge>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
              <p className="text-sm font-semibold">Channels</p>
              <p className="text-sm text-muted-foreground">Retail, Wholesale, Loyalty, POS</p>
              <p className="text-xs text-muted-foreground">
                AI automatically creates / adjusts pricing models using competitive data.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
              <p className="text-sm font-semibold">Guardrail status</p>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Safe • No policy overrides
              </div>
              <p className="text-xs text-muted-foreground">
                Finance cost updates synced nightly; loyalty uplift capped at 3%.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
            <p className="text-sm font-semibold">Drafts</p>
            {Array.isArray(draftsQuery.data) && draftsQuery.data.length ? (
              <div className="space-y-2 text-sm">
                {draftsQuery.data.map((draft: PricingDraftDto) => (
                  <div key={draft.id} className="flex flex-wrap items-center justify-between rounded-md border border-border/50 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{draft.channel}</span>
                      <span className="text-xs text-muted-foreground">
                        {draft.oldNet ?? "-"} → {draft.newNet ?? "-"} ({draft.status ?? "DRAFT"})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{draft.status ?? "DRAFT"}</Badge>
                      {draft.status !== "APPROVED" && draft.status !== "REJECTED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveDraftMutation.mutate(draft.id)}
                            disabled={approveDraftMutation.isLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectDraftMutation.mutate({ draftId: draft.id })}
                            disabled={rejectDraftMutation.isLoading}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No drafts yet.</p>
            )}
          </div>
          <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
            <p className="text-sm font-semibold">Competitors</p>
            {Array.isArray(competitorsQuery.data) && competitorsQuery.data.length ? (
              <div className="space-y-2 text-sm">
                {competitorsQuery.data.map((item: CompetitorPriceDto) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between rounded-md border border-border/50 px-3 py-2">
                    <div>
                      <span className="font-medium">{item.competitor}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{item.marketplace ?? "-"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.currency ?? ""} {item.priceNet ?? "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No competitor prices yet.</p>
            )}
          </div>
        </SectionCard>
      ) : null}

      {tab === "ai" ? (
        <SectionCard
          title="AI reasoning"
          description="Deterministic summary for cache / audit."
          actions={
            <Badge variant="outline">
              Confidence {Math.round((suggestion.confidenceScore ?? 0) * 100)}%
            </Badge>
          }
        >
          {aiSuggestionQuery.isError ? (
            <p className="text-sm text-red-500">{apiErrorMessage(aiSuggestionQuery.error)}</p>
          ) : null}
          <div className="space-y-3 text-sm">
            <p>
              <strong>Suggested price:</strong> {suggestion.suggestedPrice ?? "-"} ({suggestion.strategy ?? "standard"})
            </p>
            <p>
              <strong>Reasoning:</strong> {suggestion.reasoning}
            </p>
            <p>
              <strong>Competitors:</strong> {suggestion.competitorSummary ?? "Pending scrape"}
            </p>
            {planOutput ? (
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                {JSON.stringify(planOutput, null, 2)}
              </pre>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {tab === "activity" ? (
        <SectionCard title="Activity timeline" description="Audit log for this price.">
          {timeline.length ? (
            <ActivityTimeline items={timeline} />
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </SectionCard>
      ) : null}

      {tab === "settings" ? (
        <SectionCard title="Channel settings" description="Configure guardrails and deltas.">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Retail guardrail</p>
              <p className="text-xs text-muted-foreground">
                Cap uplift at 5%. Auto-hold if competitor drop exceeds 8%.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Wholesale guardrail</p>
              <p className="text-xs text-muted-foreground">
                Finance approval required for deltas above 2%.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <Modal open={askOpen} title="Ask AI about this price" onClose={() => setAskOpen(false)}>
        <div className="space-y-4">
          <Textarea placeholder="Ask for guardrail checks or scenario planning" />
          {pricingQuery.isError ? (
            <p className="text-xs text-red-500">{apiErrorMessage(pricingQuery.error)}</p>
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
