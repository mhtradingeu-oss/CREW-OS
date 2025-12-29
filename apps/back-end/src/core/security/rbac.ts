import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../http/http-types.js";
import type { SessionPayload } from "./jwt.js";
import { authenticateRequest } from "./auth-middleware.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { forbidden, unauthorized } from "../http/errors.js";
import { logger } from "../logger.js";

export type { AuthenticatedRequest } from "../http/http-types.js";
export { authenticateRequest };

export function hasRole(user: SessionPayload | undefined, roles: string[]) {
  if (!user) return false;
  return roles.includes(user.role);
}

const permissionCache = new Map<string, string[]>();
const permissionAliasMap = new Map<string, string>([
  ["support:manage", "support:update"],
]);

function normalizePermissionCode(code: string) {
  if (!code) return code;
  const sanitized = code.includes(".") ? code.replace(/\./g, ":") : code;
  return permissionAliasMap.get(sanitized) ?? sanitized;
}

export async function getPermissionsForRole(roleName: string): Promise<string[]> {
  if (!roleName) return [];
  const cached = permissionCache.get(roleName);
  if (cached) {
    return cached;
  }
  const entries = await prisma.rolePermission.findMany({
    where: { role: { name: roleName } },
    select: { permission: { select: { code: true } } },
  });
  const codes = entries.map((row) => normalizePermissionCode(row.permission.code));
  const uniqueCodes = Array.from(new Set(codes));
  permissionCache.set(roleName, uniqueCodes);
  return uniqueCodes;
}

async function resolvePermissionsForRoles(roles: string[]): Promise<string[]> {
  const uniqueRoles = Array.from(new Set(roles.filter(Boolean)));
  if (!uniqueRoles.length) {
    return [];
  }
  const permissions = new Set<string>();
  for (const role of uniqueRoles) {
    const rolePermissions = await getPermissionsForRole(role);
    rolePermissions.forEach((permission) => permissions.add(permission));
  }
  return Array.from(permissions);
}

export async function resolvePermissionsForRoleSet(
  baseRole: string,
  rawRoles: Prisma.JsonValue | null,
): Promise<string[]> {
  const aggregatedRoles = new Set<string>();
  if (baseRole) {
    aggregatedRoles.add(baseRole);
  }
  for (const role of parseRoleList(rawRoles)) {
    aggregatedRoles.add(role);
  }
  if (!aggregatedRoles.size) {
    return [];
  }
  return resolvePermissionsForRoles(Array.from(aggregatedRoles));
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, rolesJson: true },
  });
  if (!user) return [];
  return resolvePermissionsForRoleSet(user.role, user.rolesJson);
}

type PolicyContext = {
  userId: string;
  role?: string;
  brandId?: string;
  tenantId?: string;
};

export async function evaluatePermissionPolicies(
  permissions: string[],
  context: PolicyContext,
): Promise<boolean> {
  if (!permissions.length) {
    return true;
  }
  const relevantPolicies = await prisma.policy.findMany({
    where: { name: { in: permissions } },
    select: { id: true, rulesJson: true },
  });
  if (!relevantPolicies.length) {
    return true;
  }
  for (const policy of relevantPolicies) {
    const rules = parsePolicyRules(policy.rulesJson);
    for (const rule of rules) {
      if (!matchesRule(rule, context)) {
        return false;
      }
    }
  }
  return true;
}

export function requirePermission(permission: string | string[]) {
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return next(unauthorized());
      }
      // SUPER_ADMIN has explicit bypass for RBAC checks; all other roles require explicit permissions.
      if (req.user.role === "SUPER_ADMIN") {
        logger.info(
          `[rbac] SUPER_ADMIN bypass for ${req.user.id ?? "unknown"} on ${req.method} ${req.originalUrl}`,
        );
        return next();
      }
      const userPermissions = await getUserPermissions(req.user.id);
      const normalizedPermissions = requiredPermissions.map(normalizePermissionCode);
      const hasAnyPermission = normalizedPermissions.some(
        (perm) => userPermissions.includes(perm) || userPermissions.includes("*"),
      );
      if (!hasAnyPermission) {
        return next(forbidden());
      }
      const policyAllowed = await evaluatePermissionPolicies(normalizedPermissions, {
        userId: req.user.id,
        role: req.user.role,
        brandId: req.user.brandId,
        tenantId: req.user.tenantId,
      });
      if (!policyAllowed) {
        return next(forbidden());
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function parseRoleList(value: Prisma.JsonValue | null): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((role) => typeof role === "string") as string[];
      }
    } catch {
      return [];
    }
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((role): role is string => typeof role === "string");
  }
  return [];
}

function parsePolicyRules(payload?: string | null): ParsedPolicyRule[] {
  if (!payload) return [];
  try {
    const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) {
    return parsed.map(normalizePolicyRule).filter((rule): rule is ParsedPolicyRule => Boolean(rule));
  }
    return [normalizePolicyRule(parsed)].filter((rule): rule is ParsedPolicyRule => Boolean(rule));
  } catch {
    return [];
  }
}

type ParsedPolicyRule = {
  allowRoles?: string[];
  denyRoles?: string[];
  allowBrands?: string[];
  denyBrands?: string[];
  allowTenants?: string[];
  denyTenants?: string[];
};

function normalizePolicyRule(value: unknown): ParsedPolicyRule | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const rule = value as ParsedPolicyRule;
  return {
    allowRoles: Array.isArray(rule.allowRoles) ? rule.allowRoles.filter(Boolean) : undefined,
    denyRoles: Array.isArray(rule.denyRoles) ? rule.denyRoles.filter(Boolean) : undefined,
    allowBrands: Array.isArray(rule.allowBrands) ? rule.allowBrands.filter(Boolean) : undefined,
    denyBrands: Array.isArray(rule.denyBrands) ? rule.denyBrands.filter(Boolean) : undefined,
    allowTenants: Array.isArray(rule.allowTenants) ? rule.allowTenants.filter(Boolean) : undefined,
    denyTenants: Array.isArray(rule.denyTenants) ? rule.denyTenants.filter(Boolean) : undefined,
  };
}

function matchesRule(rule: ParsedPolicyRule, context: PolicyContext): boolean {
  if (rule.denyRoles && context.role && rule.denyRoles.includes(context.role)) {
    return false;
  }
  if (rule.denyBrands && context.brandId && rule.denyBrands.includes(context.brandId)) {
    return false;
  }
  if (rule.denyTenants && context.tenantId && rule.denyTenants.includes(context.tenantId)) {
    return false;
  }
  if (rule.allowRoles && (!context.role || !rule.allowRoles.includes(context.role))) {
    return false;
  }
  if (rule.allowBrands && context.brandId && !rule.allowBrands.includes(context.brandId)) {
    return false;
  }
  if (rule.allowTenants && context.tenantId && !rule.allowTenants.includes(context.tenantId)) {
    return false;
  }
  return true;
}
