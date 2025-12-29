/**
 * SECURITY-GOVERNANCE SERVICE — MH-OS v2
 * Spec: docs/ai/31_security-governance-os.md (MASTER_INDEX)
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import { notFound, forbidden } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { SessionPayload } from "../../core/security/jwt.js";
import {
  emitPolicyCreated,
  emitPolicyDeleted,
  emitPolicyUpdated,
  emitAiRestrictionUpdated,
  emitRoleAssigned,
  emitRoleRevoked,
} from "./security-governance.events.js";
import type {
  CreateSecurityGovernanceInput,
  ListSecurityPoliciesParams,
  RBACOverview,
  RoleRecord,
  PermissionRecord,
  AIRestrictionRecord,
  SecurityPolicyListResponse,
  SecurityPolicyRecord,
  UpdateSecurityGovernanceInput,
} from "./security-governance.types.js";
import { orchestrateAI, makeCacheKey } from "../../core/ai/orchestrator.js";
import { logExecution, recordSafetyEvent, estimateTokens } from "../../core/ai/ai-monitoring.js";
import type { AIMessage } from "../../core/ai-service/ai-client.js";

const policySelect = {
  id: true,
  name: true,
  category: true,
  status: true,
  brandId: true,
  rulesJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PolicySelect;

const roleSelect = {
  id: true,
  name: true,
  description: true,
  permissions: { select: { permission: { select: { code: true } } } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RoleSelect;

const permissionSelect = {
  id: true,
  code: true,
  description: true,
} satisfies Prisma.PermissionSelect;

const aiRestrictionSelect = {
  id: true,
  name: true,
  rulesJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIRestrictionPolicySelect;

type RequestScope = {
  userId?: string;
  brandId?: string | null;
  tenantId?: string | null;
  role?: string | null;
};

class SecurityGovernanceService {
  constructor(private readonly db = prisma) {}

  async list(
    filters: ListSecurityPoliciesParams,
    user?: SessionPayload,
  ): Promise<SecurityPolicyListResponse> {
    const scope = buildScope(user);
    const brandId = resolveBrandId(scope, filters.brandId);
    const { page = 1, pageSize = 20, category, status, search } = filters;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: Prisma.PolicyWhereInput = {};
    if (brandId) where.brandId = brandId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await this.db.$transaction([
      this.db.policy.count({ where }),
      this.db.policy.findMany({
        where,
        select: policySelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      data: records.map(mapPolicy),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string, user?: SessionPayload): Promise<SecurityPolicyRecord> {
    const scope = buildScope(user);
    const policy = await this.db.policy.findUnique({ where: { id }, select: policySelect });
    if (!policy) {
      throw notFound("Policy not found");
    }
    resolveBrandId(scope, policy.brandId ?? undefined);
    return mapPolicy(policy);
  }

  async create(
    input: CreateSecurityGovernanceInput,
    user?: SessionPayload,
  ): Promise<SecurityPolicyRecord> {
    const scope = buildScope(user);
    const brandId = resolveBrandId(scope, input.brandId ?? undefined);
    const policy = await this.db.policy.create({
      data: {
        name: input.name,
        category: input.category ?? null,
        status: input.status ?? "enabled",
        brandId: brandId ?? null,
        rulesJson: input.rulesJson ?? null,
      },
      select: policySelect,
    });

    await emitPolicyCreated({
      policyId: policy.id,
      name: policy.name,
      category: policy.category,
      status: policy.status,
      brandId: policy.brandId,
      actorUserId: scope.userId,
      changeSummary: "Policy created",
    });

    await this.recordAudit("security.policy.created", { policyId: policy.id, name: policy.name }, user);

    await this.logPolicyAiSummary({
      policyId: policy.id,
      name: policy.name,
      rulesJson: policy.rulesJson ?? undefined,
      brandId: policy.brandId,
      actorUserId: scope.userId ?? null,
    });

    return mapPolicy(policy);
  }

  async update(
    id: string,
    input: UpdateSecurityGovernanceInput,
    user?: SessionPayload,
  ): Promise<SecurityPolicyRecord> {
    const scope = buildScope(user);
    const existing = await this.db.policy.findUnique({ where: { id }, select: policySelect });
    if (!existing) {
      throw notFound("Policy not found");
    }

    resolveBrandId(scope, existing.brandId ?? undefined);
    const brandId = resolveBrandId(scope, input.brandId ?? existing.brandId ?? undefined);

    const updated = await this.db.policy.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        category: input.category ?? existing.category,
        status: input.status ?? existing.status ?? "enabled",
        brandId: brandId ?? null,
        rulesJson: input.rulesJson ?? existing.rulesJson,
      },
      select: policySelect,
    });

    await emitPolicyUpdated({
      policyId: updated.id,
      name: updated.name,
      category: updated.category,
      status: updated.status,
      brandId: updated.brandId,
      actorUserId: scope.userId,
      changeSummary: buildPolicyChangeSummary(existing, updated, input),
    });

    await this.recordAudit("security.policy.updated", { policyId: updated.id, name: updated.name }, user);

    await this.logPolicyAiSummary({
      policyId: updated.id,
      name: updated.name,
      rulesJson: updated.rulesJson ?? undefined,
      brandId: updated.brandId,
      actorUserId: scope.userId ?? null,
    });

    return mapPolicy(updated);
  }

  async remove(id: string, user?: SessionPayload) {
    const scope = buildScope(user);
    const policy = await this.db.policy.findUnique({ where: { id }, select: policySelect });
    if (!policy) {
      throw notFound("Policy not found");
    }
    resolveBrandId(scope, policy.brandId ?? undefined);

    await this.db.policy.delete({ where: { id } });

    await emitPolicyDeleted({
      policyId: policy.id,
      name: policy.name,
      category: policy.category,
      status: policy.status,
      brandId: policy.brandId,
      actorUserId: scope.userId,
      changeSummary: "Policy deleted",
    });

    await this.logPolicyAiSummary({
      policyId: policy.id,
      name: policy.name,
      rulesJson: policy.rulesJson ?? undefined,
      brandId: policy.brandId,
      actorUserId: scope.userId ?? null,
    });

    await this.recordAudit("security.policy.deleted", { policyId: policy.id, name: policy.name }, user);

    return { id };
  }

  async listRoles(): Promise<RoleRecord[]> {
    const roles = await this.db.role.findMany({ select: roleSelect, orderBy: { name: "asc" } });
    return roles.map(mapRole);
  }

  async createRole(input: { name: string; description?: string | null; permissions?: string[] }, user?: SessionPayload) {
    const role = await this.db.role.create({
      data: { name: input.name, description: input.description ?? null },
      select: roleSelect,
    });
    if (input.permissions?.length) {
      await this.setRolePermissions(role.id, input.permissions, user);
    }
    await this.recordAudit("security.role.created", { roleId: role.id, role: role.name }, user);
    return mapRole(role);
  }

  async updateRole(
    id: string,
    input: { name?: string; description?: string | null; permissions?: string[] },
    user?: SessionPayload,
  ): Promise<RoleRecord> {
    const existing = await this.db.role.findUnique({ where: { id }, select: roleSelect });
    if (!existing) throw notFound("Role not found");
    const updated = await this.db.role.update({
      where: { id },
      data: { name: input.name ?? existing.name, description: input.description ?? existing.description },
      select: roleSelect,
    });
    if (input.permissions) {
      await this.setRolePermissions(id, input.permissions, user);
    }
    await this.recordAudit("security.role.updated", { roleId: id, role: updated.name }, user);
    return mapRole(updated);
  }

  async setRolePermissions(roleId: string, permissionCodes: string[], user?: SessionPayload): Promise<RoleRecord> {
    const role = await this.db.role.findUnique({ where: { id: roleId }, select: roleSelect });
    if (!role) throw notFound("Role not found");
    const permissions = await this.db.permission.findMany({ where: { code: { in: permissionCodes } }, select: permissionSelect });
    const codeSet = new Set(permissionCodes);
    if (permissions.length !== codeSet.size) {
      throw notFound("One or more permissions are invalid");
    }
    await this.db.rolePermission.deleteMany({ where: { roleId } });
    if (permissionCodes.length) {
      await this.db.rolePermission.createMany({
        data: permissionCodes.map((code) => ({ roleId, permissionId: permissions.find((p) => p.code === code)!.id })),
        skipDuplicates: true,
      });
    }
    await this.recordAudit("security.role.permissions.updated", { roleId, permissions: permissionCodes }, user);
    return this.getRoleById(roleId);
  }

  async getRoleById(roleId: string): Promise<RoleRecord> {
    const role = await this.db.role.findUnique({ where: { id: roleId }, select: roleSelect });
    if (!role) throw notFound("Role not found");
    return mapRole(role);
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    const permissions = await this.db.permission.findMany({ select: permissionSelect, orderBy: { code: "asc" } });
    return permissions.map((p) => ({ id: p.id, code: p.code, description: p.description ?? undefined }));
  }

  async assignRoleToUser(payload: { userId: string; role: string; asPrimary?: boolean }, actor?: SessionPayload) {
    const user = await this.db.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true, rolesJson: true } });
    if (!user) throw notFound("User not found");
    const roleExists = await this.db.role.findUnique({ where: { name: payload.role }, select: { id: true } });
    if (!roleExists) throw notFound("Role does not exist");

    if (payload.asPrimary) {
      await this.db.user.update({ where: { id: user.id }, data: { role: payload.role } });
    } else {
      const current = Array.isArray(user.rolesJson) ? (user.rolesJson as string[]) : [];
      const next = Array.from(new Set([...current, payload.role]));
      await this.db.user.update({ where: { id: user.id }, data: { rolesJson: next } });
    }

    await emitRoleAssigned({ userId: user.id, role: payload.role, actorUserId: actor?.id });
    await this.recordAudit("security.role.assigned", { userId: user.id, role: payload.role, primary: payload.asPrimary }, actor);
    return { userId: user.id, role: payload.role, primary: !!payload.asPrimary };
  }

  async revokeRoleFromUser(payload: { userId: string; role: string }, actor?: SessionPayload) {
    const user = await this.db.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true, rolesJson: true } });
    if (!user) throw notFound("User not found");
    let primaryChanged = false;
    if (user.role === payload.role) {
      throw forbidden("Cannot revoke primary role; assign a replacement first.");
    }
    if (Array.isArray(user.rolesJson)) {
      const next = (user.rolesJson as string[]).filter((r) => r !== payload.role);
      await this.db.user.update({ where: { id: user.id }, data: { rolesJson: next } });
      primaryChanged = false;
    }
    await emitRoleRevoked({ userId: user.id, role: payload.role, actorUserId: actor?.id });
    await this.recordAudit("security.role.revoked", { userId: user.id, role: payload.role, primaryChanged }, actor);
    return { userId: user.id, role: payload.role };
  }

  async listAiRestrictions(): Promise<AIRestrictionRecord[]> {
    const records = await this.db.aIRestrictionPolicy.findMany({ select: aiRestrictionSelect, orderBy: { updatedAt: "desc" } });
    return records.map(mapAiRestriction);
  }

  async getAiRestriction(id: string): Promise<AIRestrictionRecord> {
    const record = await this.db.aIRestrictionPolicy.findUnique({ where: { id }, select: aiRestrictionSelect });
    if (!record) throw notFound("AI restriction not found");
    return mapAiRestriction(record);
  }

  async upsertAiRestriction(
    id: string | null,
    input: { name?: string; rulesJson?: string | null },
    actor?: SessionPayload,
  ): Promise<AIRestrictionRecord> {
    const data = {
      name: input.name ?? undefined,
      rulesJson: input.rulesJson ?? null,
    } as Prisma.AIRestrictionPolicyUncheckedCreateInput;

    let record;
    if (id) {
      record = await this.db.aIRestrictionPolicy.update({ where: { id }, data, select: aiRestrictionSelect });
    } else {
      record = await this.db.aIRestrictionPolicy.create({ data, select: aiRestrictionSelect });
    }

    await emitAiRestrictionUpdated({ id: record.id, name: record.name, actorUserId: actor?.id });
    await this.recordAudit("ai.restriction.updated", { id: record.id, name: record.name }, actor);
    return mapAiRestriction(record);
  }

  async deleteAiRestriction(id: string, actor?: SessionPayload) {
    await this.db.aIRestrictionPolicy.delete({ where: { id } });
    await emitAiRestrictionUpdated({ id, name: "deleted", actorUserId: actor?.id });
    await this.recordAudit("ai.restriction.deleted", { id }, actor);
    return { id };
  }

  async rbacOverview(): Promise<RBACOverview> {
    const [roles, permissions, policies] = await Promise.all([
      this.db.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          permissions: { select: { permission: { select: { code: true } } } },
        },
        orderBy: { name: "asc" },
      }),
      this.db.permission.findMany({ select: { code: true }, orderBy: { code: "asc" } }),
      this.db.policy.findMany({
        select: { id: true, name: true, category: true, status: true, brandId: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((row) => row.permission.code),
      })),
      permissions: permissions.map((permission) => permission.code),
      policies: policies.map((policy) => ({
        id: policy.id,
        key: policy.name,
        category: policy.category ?? undefined,
        status: policy.status ?? "enabled",
        brandId: policy.brandId ?? undefined,
      })),
    };
  }

  private async recordAudit(action: string, metadata: Record<string, unknown>, actor?: SessionPayload) {
    await this.db.auditLog.create({
      data: {
        action,
        entityType: "security",
        entityId: metadata.roleId?.toString() ?? metadata.policyId?.toString() ?? metadata.id?.toString() ?? undefined,
        metadata: JSON.stringify(metadata),
        userId: actor?.id ?? null,
      },
    });
  }

  private async logPolicyAiSummary(event: { policyId: string; name: string; rulesJson?: string | null; brandId?: string | null; actorUserId?: string | null }) {
    const safeRules = this.safeParseJson(event.rulesJson);
    const messages: AIMessage[] = [
      {
        role: "system",
        content: "You are the MH-OS security analyst. Summarize policy risk in one paragraph and list constraints.",
      },
      {
        role: "user",
        content: JSON.stringify({
          policyId: event.policyId,
          name: event.name,
          rules: safeRules,
          brandId: event.brandId,
        }),
      },
    ];
    const cacheKey = makeCacheKey("security.policy.analysis", { policyId: event.policyId });
    const aiResult = await orchestrateAI<{ summary?: string; risk?: string }>({
      key: cacheKey,
      messages,
      fallback: () => ({ summary: `Policy ${event.name} recorded.`, risk: "low" }),
    });
    const promptTokens = estimateTokens(messages);
    await logExecution({
      runId: cacheKey,
      namespace: "security.policy",
      agentName: "security-analyst",
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      status: "SUCCESS",
      promptTokens,
      totalTokens: promptTokens,
      costUsd: 0,
      promptPreview: messages.map((m) => m.content).join("\n").slice(0, 500),
      outputPreview: JSON.stringify(aiResult.result).slice(0, 300),
      brandId: event.brandId ?? undefined,
    });
    await recordSafetyEvent({
      type: "SAFETY_CONSTRAINT",
      namespace: "security.policy",
      agentName: "security-analyst",
      riskLevel: "LOW",
      decision: "ALLOW",
      detail: { cached: aiResult.cached },
      brandId: event.brandId ?? undefined,
      tenantId: undefined,
    });
  }

  private safeParseJson(value?: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

export const security_governanceService = new SecurityGovernanceService();

function mapPolicy(
  record: Prisma.PolicyGetPayload<{ select: typeof policySelect }>,
): SecurityPolicyRecord {
  return {
    id: record.id,
    key: record.name,
    category: record.category ?? undefined,
    status: record.status ?? "enabled",
    rulesJson: record.rulesJson ?? undefined,
    brandId: record.brandId ?? undefined,
    updatedAt: record.updatedAt,
  };
}

function mapRole(record: Prisma.RoleGetPayload<{ select: typeof roleSelect }>): RoleRecord {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    permissions: record.permissions.map((p) => p.permission.code),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapAiRestriction(
  record: Prisma.AIRestrictionPolicyGetPayload<{ select: typeof aiRestrictionSelect }>,
): AIRestrictionRecord {
  return {
    id: record.id,
    name: record.name,
    rulesJson: record.rulesJson ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildScope(user?: SessionPayload): RequestScope {
  return {
    userId: user?.id,
    brandId: user?.brandId,
    tenantId: user?.tenantId,
    role: user?.role,
  };
}

function resolveBrandId(scope: RequestScope, requestedBrandId?: string | null) {
  return resolveScopedBrandId(
    { brandId: scope.brandId ?? undefined, role: scope.role ?? undefined, tenantId: scope.tenantId ?? undefined },
    requestedBrandId ?? undefined,
  );
}

function buildPolicyChangeSummary(
  existing: Prisma.PolicyGetPayload<{ select: typeof policySelect }>,
  updated: Prisma.PolicyGetPayload<{ select: typeof policySelect }>,
  input: UpdateSecurityGovernanceInput,
) {
  const changes: string[] = [];
  if (input.name && input.name !== existing.name) {
    changes.push(`name: ${existing.name} -> ${input.name}`);
  }
  if (input.category && input.category !== existing.category) {
    changes.push(`category: ${existing.category ?? "none"} -> ${input.category}`);
  }
  if (input.status && input.status !== existing.status) {
    changes.push(`status: ${existing.status ?? "enabled"} -> ${input.status}`);
  }
  if (input.brandId && input.brandId !== existing.brandId) {
    changes.push(`brand: ${existing.brandId ?? "none"} -> ${input.brandId}`);
  }
  if (input.rulesJson && input.rulesJson !== existing.rulesJson) {
    changes.push("rules updated");
  }
  return changes.join("; ") || "Policy updated";
}
