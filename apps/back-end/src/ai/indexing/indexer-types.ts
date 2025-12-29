import { forbidden } from "../../core/http/errors.js";

export type IndexingScope = {
  brandId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  role?: string | null;
  permissions?: string[];
  enforcePermissions?: boolean;
};

export type EmbeddingVector = {
  vector: number[];
  model: string;
  cached?: boolean;
};

export type IndexRecord = {
  id: string;
  type: string;
  brandId?: string;
  tenantId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  embedding: EmbeddingVector;
  metadata: Record<string, unknown>;
  content: string;
  source: string;
  updatedAt: string;
  raw?: Record<string, unknown>;
};

export function assertScopeOwnership(
  recordBrandId: string | null | undefined,
  recordTenantId: string | null | undefined,
  scope?: IndexingScope,
) {
  if (!scope) return;
  const normalizedBrand = recordBrandId ?? undefined;
  const normalizedTenant = recordTenantId ?? undefined;
  if (scope.brandId && normalizedBrand && scope.brandId !== normalizedBrand) {
    throw forbidden("Indexing scope mismatch: brand");
  }
  if (scope.tenantId && normalizedTenant && scope.tenantId !== normalizedTenant) {
    throw forbidden("Indexing scope mismatch: tenant");
  }
}

export function compactMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
