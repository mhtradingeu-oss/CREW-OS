import { forbidden } from "../http/errors.js";

export type MultiTenantScope = {
  brandId?: string | null;
  role?: string | null;
  tenantId?: string | null;
};

const SUPER_ADMIN_ROLES = new Set(["SUPER_ADMIN"]);

function canBypassBrand(role?: string | null) {
  return !!role && SUPER_ADMIN_ROLES.has(role);
}

export function resolveScopedBrandId(
  scope: MultiTenantScope,
  requestedBrandId?: string,
): string | undefined {
  const userBrandId = scope.brandId ?? undefined;
  if (userBrandId) {
    if (requestedBrandId && requestedBrandId !== userBrandId) {
      throw forbidden("Cannot access a brand outside your assignment");
    }
    return userBrandId;
  }

  if (requestedBrandId) {
    if (!canBypassBrand(scope.role)) {
      throw forbidden("Cannot access a brand outside your assignment");
    }
    return requestedBrandId;
  }

  if (canBypassBrand(scope.role)) {
    return undefined;
  }

  return undefined;
}
