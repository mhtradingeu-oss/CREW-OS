import { apiFetch } from "./client";

export interface KPIRevenueSeries {
  label: string;
  value: number;
  currency?: string | null;
}

export interface KPIPricingDeltaSeries {
  label: string;
  change: number;
}

export interface KPIInventoryRiskSeries {
  label: string;
  lowStock: number;
  stockouts: number;
}

export interface KPIMarketingSeries {
  label: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface KPILoyaltySeries {
  label: string;
  transactions: number;
  points: number;
}

export interface KPIDemandSeries {
  label: string;
  leads: number;
  deals: number;
}

export interface KPIAggSummary {
  revenueTotal: number;
  revenueCurrency?: string | null;
  revenueChange?: number | null;
  pricingDeltaAvg?: number | null;
  lowStock?: number;
  stockouts?: number;
  conversionRate?: number | null;
  loyaltyTransactions?: number;
  loyaltyPointsNet?: number;
  marketingConversions?: number;
}

export interface KPINarrative {
  overview: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  severity?: "low" | "medium" | "high";
}

export interface KPIOverviewPayload {
  brandId?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
  revenueSeries: KPIRevenueSeries[];
  pricingSeries: KPIPricingDeltaSeries[];
  inventorySeries: KPIInventoryRiskSeries[];
  marketingSeries: KPIMarketingSeries[];
  loyaltySeries: KPILoyaltySeries[];
  demandSeries: KPIDemandSeries[];
  summary: KPIAggSummary;
  aiNarrative?: KPINarrative;
}


export async function getKpiSummary(params: {
  brandId?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<KPIOverviewPayload | null> {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch<KPIOverviewPayload>(`/ai/insights/kpi/summary`);
  return data ?? null;
}
