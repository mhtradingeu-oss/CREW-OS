// Sales KPI Summary DTO for shared contract

export type SalesKpiSummary = {
  kpiName: string;
  value: number;
  target?: number;
  period: string; // e.g., '2025-Q1', '2025-12-01'
  unit?: string;
  notes?: string;
};
