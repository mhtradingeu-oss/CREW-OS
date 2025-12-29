import type { PlanDefinition, PlanFeatureSet, PlanKey } from "../../core/plans.js";
export type PlatformOpsHealthResponse = {
  api: {
    status: string;
    checkedAt: string;
    info?: string;
  };
  db: {
    status: string;
    latencyMs: number;
  };
  queues: Array<{
    name: string;
    status: string;
    note?: string;
  }>;
};

export type PlatformOpsErrorFilters = {
  module?: string;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PlatformOpsErrorRecord = {
  id: string;
  module?: string;
  type: string;
  severity?: string;
  source?: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
};

export type PlatformOpsJobsResponse = {
  policy: string;
  lastBackupAt: Date | null;
  upcomingWindow: Date | null;
  jobs: PlatformOpsJobRecord[];
};

export type PlatformOpsJobRecord = {
  id: string;
  name: string;
  status?: string | null;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  cronExpression?: string | null;
};

export type PlatformOpsSecurityResponse = {
  totalUsers: number;
  adminCount: number;
  roles: Record<string, number>;
  users: PlatformOpsUserRecord[];
};

export type PlatformOpsUserRecord = {
  id: string;
  email: string;
  role: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformOpsAuditFilters = {
  brandId?: string;
  module?: string;
  userId?: string;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PlatformOpsAuditResponse = {
  data: PlatformOpsAuditRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type PlatformOpsAuditRecord = {
  id: string;
  brandId?: string;
  userId?: string;
  module?: string;
  type: string;
  source?: string;
  severity?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
};

export type TenantBrandOverview = {
  brandId: string;
  name: string;
  slug: string;
  status?: string;
  totalUsers?: number;
  totalProducts?: number;
  totalRevenue?: number;
};

export type TenantOverviewRecord = {
  tenantId: string;
  name: string;
  slug: string;
  status?: string;
  planKey?: string;
  brandCount: number;
  userCount: number;
  brands: TenantBrandOverview[];
};

export type TenantOverviewResponse = {
  generatedAt: string;
  data: TenantOverviewRecord[];
};

export type SuperAdminUserFilters = {
  search?: string;
  role?: string;
  status?: string;
  brandId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
};

export type SuperAdminUserRecord = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  roles: string[];
  status: string;
  permissions: string[];
  tenantId?: string | null;
  brandId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SuperAdminUserListResponse = {
  data: SuperAdminUserRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type RoleAssignmentInput = {
  roleId?: string;
  roleName?: string;
  makePrimary?: boolean;
};

export type PlanContextResponse = {
  planKey: PlanKey;
  planName: string;
  features: PlanFeatureSet;
  tenantId?: string | null;
  brandId?: string | null;
  source: "database" | "default";
};

export type PlanFeaturesMatrixResponse = {
  current: PlanContextResponse;
  plans: PlanDefinition[];
};
