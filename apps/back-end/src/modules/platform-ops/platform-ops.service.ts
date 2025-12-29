import type { Prisma } from "@prisma/client";
import { PlatformOpsRepository } from "../../core/db/repositories/platform-ops.repository.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { resolvePermissionsForRoleSet } from "../../core/security/rbac.js";
import { resolvePlanContext } from "../../core/plans-resolver.js";
import { planDefinitions } from "../../core/plans.js";
import { activityLogService } from "../activity-log/activity-log.service.js";
import {
  emitUserRoleAssigned,
  emitUserRoleRemoved,
} from "./platform-ops.events.js";
import type {
  PlatformOpsAuditFilters,
  PlatformOpsAuditResponse,
  PlatformOpsErrorFilters,
  PlatformOpsErrorRecord,
  PlatformOpsHealthResponse,
  PlatformOpsJobRecord,
  PlatformOpsJobsResponse,
  PlatformOpsSecurityResponse,
  PlatformOpsUserRecord,
  RoleAssignmentInput,
  SuperAdminUserFilters,
  SuperAdminUserListResponse,
  SuperAdminUserRecord,
  TenantOverviewResponse,
  PlanFeaturesMatrixResponse,
  PlanContextResponse,
} from "./platform-ops.types.js";

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  rolesJson: true,
  tenantId: true,
  brandId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

class PlatformOpsService {
  constructor(private readonly repo = PlatformOpsRepository) {}

  async getHealth(): Promise<PlatformOpsHealthResponse> {
    const checkedAt = new Date().toISOString();
    const dbStart = Date.now();
    await this.repo.healthCheck();
    const latencyMs = Date.now() - dbStart;

    return {
      api: {
        status: "ok",
        checkedAt,
        info: process.env.NODE_ENV === "production" ? "Production API" : "Development API",
      },
      db: {
        status: "connected",
        latencyMs,
      },
      queues: [
        { name: "Default queue", status: "OK", note: "Workers responsive" },
        { name: "Pricing autos", status: "Stubbed", note: "Queue instrumented in Phase 5" },
      ],
    };
  }

  async listErrors(
    filters: PlatformOpsErrorFilters,
  ): Promise<{ data: PlatformOpsErrorRecord[]; total: number; page: number; pageSize: number }> {
    const result = await activityLogService.list({
      module: filters.module,
      type: filters.type,
      severity: filters.severity,
      from: filters.from,
      to: filters.to,
      page: filters.page,
      pageSize: filters.pageSize,
    });

    return {
      data: result.data.map((record) => {
        const message = this.extractMessage(record.meta) ?? record.type;
        return {
          id: record.id,
          module: record.module,
          type: record.type,
          severity: record.severity,
          source: record.source,
          message,
          meta: record.meta,
          createdAt: record.createdAt,
        };
      }),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async listJobs(status?: string): Promise<PlatformOpsJobsResponse> {
    const where: Prisma.ScheduledJobWhereInput = {};
    if (status) where.status = status;
    const jobs = await this.repo.listJobs(where);

    const lastBackup =
      jobs.find((job) => job.name.toLowerCase().includes("backup"))?.lastRunAt ??
      jobs[0]?.lastRunAt ??
      null;
    const upcomingWindow = jobs.find((job) => job.nextRunAt)?.nextRunAt ?? null;

    return {
      policy: "Daily backups + hourly automations",
      lastBackupAt: lastBackup,
      upcomingWindow,
      jobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        lastRunAt: job.lastRunAt,
        nextRunAt: job.nextRunAt,
        cronExpression: job.cronExpression,
      })),
    };
  }

  async listSecurity(): Promise<PlatformOpsSecurityResponse> {
    const users = await this.repo.listUsers();

    const roles: Record<string, number> = {};
    users.forEach((user) => {
      const key = user.role ?? "UNASSIGNED";
      roles[key] = (roles[key] ?? 0) + 1;
    });

    const adminCount = users.filter(
      (user) => user.role === "SUPER_ADMIN" || user.role === "ADMIN",
    ).length;

    return {
      totalUsers: users.length,
      adminCount,
      roles,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }

  async listAudit(filters: PlatformOpsAuditFilters): Promise<PlatformOpsAuditResponse> {
    const result = await activityLogService.list({
      brandId: filters.brandId,
      module: filters.module,
      userId: filters.userId,
      type: filters.type,
      severity: filters.severity,
      from: filters.from,
      to: filters.to,
      page: filters.page,
      pageSize: filters.pageSize,
    });

    return {
      data: result.data.map((record) => ({
        id: record.id,
        brandId: record.brandId,
        userId: record.userId,
        module: record.module,
        type: record.type,
        severity: record.severity,
        source: record.source,
        meta: record.meta,
        createdAt: record.createdAt,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getTenantOverview(): Promise<TenantOverviewResponse> {
    const tenants = await this.repo.listTenants();

    const brandIds = Array.from(
      new Set(tenants.flatMap((tenant) => tenant.brands.map((brand) => brand.id))),
    );
    const brandMetrics = brandIds.length ? await this.repo.listBrandMetrics(brandIds) : [];

    const revenueByBrand = brandIds.length ? await this.repo.groupRevenueByBrand(brandIds) : [];

    const revenueMap = new Map<string, number>();
    revenueByBrand.forEach((entry) => {
      if (entry.brandId) {
        revenueMap.set(entry.brandId, Number(entry._sum.amount ?? 0));
      }
    });

    const brandMap = new Map(
      brandMetrics.map((brand) => [
        brand.id,
        {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          totalUsers: brand._count.users,
          totalProducts: brand._count.products,
          totalRevenue: revenueMap.get(brand.id),
        },
      ]),
    );

    return {
      generatedAt: new Date().toISOString(),
      data: tenants.map((tenant) => ({
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status ?? undefined,
        planKey: tenant.plan?.key,
        brandCount: tenant._count.brands,
        userCount: tenant._count.users,
        brands: tenant.brands.map((brand) => {
          const metrics = brandMap.get(brand.id);
          return {
            brandId: brand.id,
            name: metrics?.name ?? brand.name,
            slug: metrics?.slug ?? brand.slug,
            status: undefined,
            totalUsers: metrics?.totalUsers,
            totalProducts: metrics?.totalProducts,
            totalRevenue: metrics?.totalRevenue,
          };
        }),
      })),
    };
  }

  async listUsersWithRBAC(
    filters: SuperAdminUserFilters,
  ): Promise<SuperAdminUserListResponse> {
    const { search, role, status, brandId, tenantId, page = 1, pageSize = 20 } = filters;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (brandId) where.brandId = brandId;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
        { status: { contains: search, mode: "insensitive" } },
      ];
    }

    const { total, users } = await this.repo.listUsersWithRBAC(where, skip, take);

    const data = await Promise.all(users.map((user) => this.buildUserRBACRecord(user)));

    return {
      data,
      total,
      page,
      pageSize: take,
    };
  }

  async assignRoleToUser(
    userId: string,
    input: RoleAssignmentInput,
    actorUserId?: string,
  ): Promise<SuperAdminUserRecord> {
    const role = await this.resolveRole(input);
    if (!role) {
      throw notFound("Role not found");
    }

    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw notFound("User not found");
    }

    const extraRoles = parseRolesJson(user.rolesJson);
    const aggregatedRoles = aggregateRoles(user.role, extraRoles);
    const shouldPromote = input.makePrimary || user.role === "USER";

    if (!shouldPromote && aggregatedRoles.includes(role.name)) {
      return this.buildUserRBACRecord(user);
    }

    let nextPrimaryRole = user.role;
    let nextExtraRoles = [...extraRoles];

    if (shouldPromote) {
      nextPrimaryRole = role.name;
      nextExtraRoles = nextExtraRoles.filter((r) => r !== role.name);
    } else if (!aggregatedRoles.includes(role.name)) {
      nextExtraRoles.push(role.name);
    }

    const updated = await this.repo.updateUserRole(user.id, nextPrimaryRole, normalizeRolesJson(nextExtraRoles, nextPrimaryRole));

    await emitUserRoleAssigned({
      actorUserId,
      targetUserId: updated.id,
      roleId: role.id,
      roleName: role.name,
      brandId: updated.brandId,
      tenantId: updated.tenantId,
    });

    return this.buildUserRBACRecord(updated);
  }

  async getPlanContext(tenantId?: string | null, brandId?: string | null) {
    return resolvePlanContext({ tenantId, brandId });
  }

  async getPlanFeatures(planContext?: PlanContextResponse): Promise<PlanFeaturesMatrixResponse> {
    const current = planContext ?? (await resolvePlanContext({ tenantId: undefined, brandId: undefined }));
    return {
      current,
      plans: Object.values(planDefinitions),
    };
  }

  async removeRoleFromUser(
    userId: string,
    input: RoleAssignmentInput,
    actorUserId?: string,
  ): Promise<SuperAdminUserRecord> {
    const role = await this.resolveRole(input);
    if (!role) {
      throw notFound("Role not found");
    }

    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw notFound("User not found");
    }

    const extraRoles = parseRolesJson(user.rolesJson);
    const aggregatedRoles = aggregateRoles(user.role, extraRoles);
    if (!aggregatedRoles.includes(role.name)) {
      return this.buildUserRBACRecord(user);
    }

    let nextPrimaryRole = user.role;
    let nextExtraRoles = extraRoles.filter((r) => r !== role.name);

    if (user.role === role.name) {
      if (role.name === "SUPER_ADMIN") {
        await this.ensureAnotherSuperAdmin(user.id);
      }
      nextPrimaryRole = nextExtraRoles[0] ?? "USER";
      nextExtraRoles = nextExtraRoles.filter((r) => r !== nextPrimaryRole);
    }

    const updated = await this.repo.updateUserRole(user.id, nextPrimaryRole, normalizeRolesJson(nextExtraRoles, nextPrimaryRole));

    await emitUserRoleRemoved({
      actorUserId,
      targetUserId: updated.id,
      roleId: role.id,
      roleName: role.name,
      brandId: updated.brandId,
      tenantId: updated.tenantId,
    });

    return this.buildUserRBACRecord(updated);
  }

  private extractMessage(meta?: Record<string, unknown>) {
    if (!meta) return undefined;
    const payload = meta.payload;
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const candidate = (payload as Record<string, unknown>).message;
      if (typeof candidate === "string") return candidate;
    }
    return undefined;
  }

  private async resolveRole(input: RoleAssignmentInput) {
    if (input.roleId) {
      return this.repo.findRoleById(input.roleId);
    }
    if (input.roleName) {
      return this.repo.findRoleByName(input.roleName);
    }
    return null;
  }

  private async buildUserRBACRecord(
    user: Prisma.UserGetPayload<{ select: typeof userSelect }>,
  ): Promise<SuperAdminUserRecord> {
    const extraRoles = parseRolesJson(user.rolesJson);
    const permissions = await resolvePermissionsForRoleSet(
      user.role,
      normalizeRolesJson(extraRoles, user.role) as Prisma.JsonValue,
    );
    return {
      id: user.id,
      email: user.email,
      name: user.email,
      role: user.role,
      roles: aggregateRoles(user.role, extraRoles),
      status: user.status,
      permissions,
      tenantId: user.tenantId,
      brandId: user.brandId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async ensureAnotherSuperAdmin(excludeUserId: string) {
    const remaining = await this.repo.countSuperAdmins(excludeUserId);
    if (remaining === 0) {
      throw badRequest("Cannot remove the last SUPER_ADMIN");
    }
  }
}

export const platformOpsService = new PlatformOpsService();

function parseRolesJson(value: Prisma.JsonValue | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((role): role is string => typeof role === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((role): role is string => typeof role === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function aggregateRoles(primary: string, extras: string[]): string[] {
  const roles = new Set<string>();
  if (primary) roles.add(primary);
  extras.filter(Boolean).forEach((role) => roles.add(role));
  return Array.from(roles);
}

function normalizeRolesJson(extras: string[], primary: string): Prisma.InputJsonValue {
  const deduped = extras.filter(Boolean).filter((role) => role !== primary);
  return Array.from(new Set(deduped));
}
