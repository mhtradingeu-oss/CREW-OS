import type { BrandSummary } from "./operator-audit.types.js";

type NormalizableBrand = {
  id: string;
  name?: string | null;
  tenantId?: string | null;
};

export const normalizeOptional = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

export const normalizeBrand = (brand?: NormalizableBrand | null): BrandSummary | undefined => {
  if (!brand) {
    return undefined;
  }

  return {
    id: brand.id,
    name: brand.name ?? undefined,
    tenantId: normalizeOptional(brand.tenantId),
  };
};
