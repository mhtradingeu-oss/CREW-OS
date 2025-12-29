// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.


export interface FinanceDto {
  id: string;
  brandId?: string;
  productId?: string;
  channel?: string;
  amount?: number | null;
  currency?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listFinance(params?: Record<string, unknown>): Promise<FinanceDto[]> {
  return [];
}
