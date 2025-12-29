"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { SectionCard } from "@/components/shell/section-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { AIRecommendationPanel } from "@/components/shell/ai-recommendation-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { listPricing } from "@/lib/api/pricing";
import type { PricingDto } from "@/lib/types/pricing";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackRows: PricingDto[] = [
  {
    id: "draft-1",
    productId: "serum-001",
    brandId: "mh",
    basePrice: 42,
    cost: 25,
    margin: 17,
    currency: "EUR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "draft-2",
    productId: "cleanser-101",
    brandId: "mh",
    basePrice: 18,
    cost: 10,
    margin: 8,
    currency: "EUR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "draft-3",
    productId: "kit-500",
    brandId: "mh",
    basePrice: 65,
    cost: 40,
    margin: 25,
    currency: "EUR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CommercePricingPage() {
  const [askOpen, setAskOpen] = useState(false);

  const pricingQuery = useQuery<{ data: PricingDto[]; total: number } | null>({
    queryKey: ["pricing", "list"],
    queryFn: () => listPricing({ page: 1, pageSize: 15 }),
  });

  const tableRows = useMemo(() => {
    const rows: PricingDto[] = pricingQuery.data?.data ?? fallbackRows;
    const formatMoney = (value?: number | null, currency?: string | null) =>
      value === null || value === undefined ? "-" : `${currency ?? ""} ${value.toFixed(2)}`;
    return rows.map((price: PricingDto) => [
      <Link key={price.id} href={`/commerce/pricing/${price.id}`} className="font-medium underline-offset-4 hover:underline">
        {price.productId}
      </Link>,
      price.brandId ?? "-",
      formatMoney(price.basePrice, price.currency),
      formatMoney(price.margin, price.currency),
      <Badge key={`${price.id}-guardrail`} variant="outline">Guardrail: Safe</Badge>,
    ]);
  }, [pricingQuery.data]);

  const guardrailEvents = [
    {
      id: "gr-1",
      title: "AI guardrail approved retail delta",
      subtitle: "+1.5% uplift for hero SKU",
      meta: "Competitor parity and stock check passed",
      at: new Date("2024-05-01T12:00:00Z"),
    },
    {
      id: "gr-2",
      title: "Wholesale hold auto-applied",
      subtitle: "Awaiting finance cost refresh",
      meta: "Channel: Wholesale · Risk: Medium",
      at: new Date("2024-05-01T09:00:00Z"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commerce · Pricing"
        description="AI guardrails keep deltas safe while auto-adjusting price models."
        breadcrumbs={[{ label: "Commerce", href: "/commerce" }, { label: "Pricing" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAskOpen(true)}>
              Ask AI
            </Button>
            <Button variant="default">New price draft</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Avg margin" value="37%" hint="Trailing 30d" meta={<TrendingUp className="h-4 w-4 text-green-500" />} />
        <StatCard title="Pending guardrails" value="12" hint="Need review" meta={<ShieldCheck className="h-4 w-4 text-amber-500" />} />
        <StatCard title="AI adjustments" value="7" hint="Last 24h" meta={<Sparkles className="h-4 w-4 text-primary" />} />
        <StatCard title="Risk flags" value="2" hint="Hold channels" meta={<AlertCircle className="h-4 w-4 text-red-500" />} />
      </div>

      <TableWithToolbar
        title="Pricing list"
        description="Live pricing entries; guardrail status coming soon."
        columns={["Product", "Brand", "Base price", "Margin", "Guardrail"]}
        rows={tableRows}
        searchPlaceholder="Search product or channel"
        actions={<Button variant="ghost" size="sm">Export CSV</Button>}
      />
      {pricingQuery.isError ? (
        <p className="text-sm text-red-500">{apiErrorMessage(pricingQuery.error)}</p>
      ) : null}

      <SectionCard
        title="Guardrail timeline"
        description="AI automatically creates and adjusts pricing models using competitive data."
        actions={<Button size="sm" variant="outline">View workflows</Button>}
      >
        <ActivityTimeline items={[{ day: "Today", events: guardrailEvents }]} />
      </SectionCard>

      <AIRecommendationPanel
        title="AI pricing insights"
        description="Deterministic cache-ready insights from orchestrator (wired once backend lands)."
        items={[
          "Boost prestige bundle by 1% in North America; guardrail safe.",
          "Hold wholesale SKU kit-500 until landed costs refresh tonight.",
          "Auto-create retail draft when competitor drops price more than 3%.",
        ]}
      />

      <Modal open={askOpen} title="Ask AI about pricing" onClose={() => setAskOpen(false)}>
        <div className="space-y-4">
          <Textarea placeholder="Ask for guardrail checks, competitor deltas, or ROI scenarios" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button>Send to AI</Button>
          </div>
          {pricingQuery.isError ? (
            <p className="text-xs text-red-500">{apiErrorMessage(pricingQuery.error)}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
