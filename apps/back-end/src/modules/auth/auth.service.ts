import { badRequest, unauthorized } from "../../core/http/errors.js";
import { hashPassword, verifyPassword } from "../../core/security/password.js";
import { prisma } from "../../core/prisma.js";
import { signToken, type SessionPayload } from "../../core/security/jwt.js";
import { getPlanDefinition } from "../../core/plans.js";
import { resolvePermissionsForRoleSet } from "../../core/security/rbac.js";
import {
  emitAuthPasswordResetRequested,
  emitAuthSessionCreated,
  emitAuthSessionRefreshed,
} from "./auth.events.js";
import type { AuthSessionResponse, PlanFeatures, PlanTier } from "@mh-os/shared";
import type { Prisma } from "@prisma/client";

export type AuthInput = { email: string; password: string };
export type AuthSessionResult = { session: AuthSessionResponse; jwt: string };

const DEFAULT_PLAN_KEY = "free" as const;
const DEFAULT_PERSONA = "RETAILER_DEALER" as const;

const planSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  featuresJson: true,
} satisfies Prisma.PlanSelect;

const tenantSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  defaultBrandId: true,
  plan: { select: planSelect },
} satisfies Prisma.TenantSelect;

const brandInfoSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
} satisfies Prisma.BrandSelect;

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  tenantId: true,
  brandId: true,
  rolesJson: true,
  createdAt: true,
  updatedAt: true,
  tenant: { select: tenantSelect },
  brand: { select: brandInfoSelect },
} satisfies Prisma.UserSelect;

const loginSelect = {
  ...userSelect,
  password: true,
} satisfies Prisma.UserSelect & { password: true };

async function buildSession(userId: string): Promise<AuthSessionResult | null> {
  const record = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!record) {
    return null;
  }

  const permissions = await resolvePermissionsForRoleSet(record.role, record.rolesJson);
  const roles = resolveRoles(record.rolesJson, record.role);
  const payload: SessionPayload = {
    id: record.id,
    role: record.role,
    tenantId: record.tenantId ?? undefined,
    brandId: record.brandId ?? undefined,
  };
  const tenantInfo = record.tenant ? mapTenant(record.tenant) : null;
  const planInfo = buildPlanInfo(record.tenant?.plan);
  const brandsAvailable = await fetchTenantBrands(record.tenantId);

  const session: AuthSessionResponse = {
    user: {
      id: record.id,
      email: record.email,
      role: record.role,
      name: record.email,
      status: record.status,
      permissions,
      roles,
      tenantId: record.tenantId ?? undefined,
      brandId: record.brandId ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    tenant: tenantInfo,
    brand: record.brand ? mapBrandInfo(record.brand) : null,
    plan: planInfo,
    brandsAvailable,
  };

  return {
    jwt: signToken(payload),
    session,
  };
}

async function register(input: AuthInput): Promise<AuthSessionResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    // Generic error, do not reveal if email exists
    throw unauthorized("Invalid credentials");
  }

  const passwordHash = await hashPassword(input.password);
  const plan = await prisma.plan.findUnique({ where: { key: DEFAULT_PLAN_KEY }, select: { id: true, key: true } });
  if (!plan) {
    throw badRequest("Default plan not configured");
  }

  const tenantSlug = buildSlug(input.email.split("@")[0] ?? "tenant");
  const brandSlug = `${tenantSlug}-brand`;

  const tenant = await prisma.tenant.create({
    data: {
      slug: tenantSlug,
      name: tenantSlug,
      status: "ACTIVE",
      planId: plan.id,
    },
    select: { id: true },
  });

  const brand = await prisma.brand.create({
    data: {
      slug: brandSlug,
      name: "Default Brand",
      tenantId: tenant.id,
    },
    select: { id: true },
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { defaultBrandId: brand.id },
  });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash,
      role: "COMPANY_ADMIN",
      status: "ACTIVE",
      tenantId: tenant.id,
      brandId: brand.id,
      rolesJson: ["COMPANY_ADMIN"],
    },
    select: { id: true },
  });

  await prisma.tenantOnboardingProfile.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      persona: DEFAULT_PERSONA,
      selectedPlanKey: DEFAULT_PLAN_KEY,
      status: "in_progress",
    },
  });

  const sessionResult = await buildSession(user.id);
  if (!sessionResult) {
    throw unauthorized("Unable to build session");
  }
  await emitAuthSessionCreated(
    buildAuthEventPayload(sessionResult.session.user),
    buildAuthEventContext(sessionResult.session.user),
  );
  return sessionResult;
}

async function login(input: AuthInput): Promise<AuthSessionResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: loginSelect,
  });

  // Always generic error
  if (!user || !user.password) {
    throw unauthorized("Invalid credentials");
  }

  const isValid = await verifyPassword(input.password, user.password);
  if (!isValid) {
    throw unauthorized("Invalid credentials");
  }

  const sessionResult = await buildSession(user.id);
  if (!sessionResult) {
    throw unauthorized("Invalid credentials");
  }
  await emitAuthSessionCreated(
    buildAuthEventPayload(sessionResult.session.user),
    buildAuthEventContext(sessionResult.session.user),
  );
  return sessionResult;
}

async function me(userId: string): Promise<AuthSessionResult | null> {
  const sessionResult = await buildSession(userId);
  if (sessionResult) {
    await emitAuthSessionRefreshed(
      buildAuthEventPayload(sessionResult.session.user),
      buildAuthEventContext(sessionResult.session.user),
    );
  }
  return sessionResult;
}

async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      brandId: true,
    },
  });

  if (user) {
    await emitAuthPasswordResetRequested(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
        brandId: user.brandId ?? undefined,
      },
      {
        actorUserId: user.id,
        brandId: user.brandId ?? undefined,
        source: "api",
      },
    );
  }
  // Always return success, never reveal user existence
}

function resolveRoles(rawRoles: Prisma.JsonValue | null, baseRole: string): string[] {
  const parsed =
    typeof rawRoles === "string"
      ? (() => {
          try {
            const value = JSON.parse(rawRoles);
            return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
          } catch {
            return [];
          }
        })()
      : Array.isArray(rawRoles)
      ? rawRoles.filter((item): item is string => typeof item === "string")
      : [];
  const allRoles = new Set<string>(parsed);
  allRoles.add(baseRole);
  return Array.from(allRoles);
}

function mapTenant(tenant: Prisma.TenantGetPayload<{ select: typeof tenantSelect }>): AuthSessionResponse["tenant"] {
  const plan = buildPlanInfo(tenant.plan);
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    planKey: plan.key,
    defaultBrandId: tenant.defaultBrandId ?? undefined,
  };
}

function mapBrandInfo(brand: Prisma.BrandGetPayload<{ select: typeof brandInfoSelect }>) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? undefined,
  };
}

function buildPlanInfo(plan?: Prisma.PlanGetPayload<{ select: typeof planSelect }> | null): AuthSessionResponse["plan"] {
  const definition = getPlanDefinition(plan?.key);
  // Only allow valid PlanTier values
  const validTiers: PlanTier[] = ["free", "starter", "pro", "enterprise"];
  const tier = validTiers.includes(definition.key as PlanTier)
    ? (definition.key as PlanTier)
    : "free";
  // Ensure featuresJson is a string or null
  let featuresRaw: string | null | undefined = null;
  if (typeof plan?.featuresJson === "string") {
    featuresRaw = plan.featuresJson;
  } else if (plan?.featuresJson != null) {
    featuresRaw = JSON.stringify(plan.featuresJson);
  }
  return {
    key: tier,
    name: plan?.name ?? definition.name,
    description: plan?.description ?? definition.description,
    features: parsePlanFeatures(featuresRaw, definition.features),
  };
}

function parsePlanFeatures(
  raw: string | Prisma.JsonValue | null | undefined,
  defaults: PlanFeatures
): PlanFeatures {
  if (!raw) return defaults;

  let parsed: Partial<PlanFeatures>;
  try {
    const rawString = typeof raw === "string" ? raw : JSON.stringify(raw);
    parsed = JSON.parse(rawString) as Partial<PlanFeatures>;
  } catch {
    return defaults;
  }

  return { ...defaults, ...parsed };
}

function buildSlug(input: string): string {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug = normalized.slice(0, 48) || "tenant";
  return slug;
}


async function fetchTenantBrands(tenantId?: string | null) {
  if (!tenantId) {
    return [];
  }
  const brands = await prisma.brand.findMany({
    where: { tenantId },
    select: brandInfoSelect,
    orderBy: { name: "asc" },
  });
  return brands.map(mapBrandInfo);
}

export const authService = { register, login, me, requestPasswordReset };

function buildAuthEventPayload(user: AuthSessionResponse["user"]) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    brandId: user.brandId,
  };
}

function buildAuthEventContext(user: AuthSessionResponse["user"]) {
  return {
    actorUserId: user.id,
    brandId: user.brandId,
    source: "api",
  };
}
