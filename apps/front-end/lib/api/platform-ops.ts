import { apiFetch } from "@/lib/api/client";

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
  createdAt: string;
};

export type PlatformOpsErrorsResponse = {
  data: PlatformOpsErrorRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type PlatformOpsJobsResponse = {
  policy: string;
  lastBackupAt: string | null;
  upcomingWindow: string | null;
  jobs: Array<{
    id: string;
    name: string;
    status?: string | null;
    lastRunAt?: string | null;
    nextRunAt?: string | null;
    cronExpression?: string | null;
  }>;
};

export type PlatformOpsSecurityResponse = {
  totalUsers: number;
  adminCount: number;
  roles: Record<string, number>;
  users: Array<{
    id: string;
    email: string;
    role: string | null;
    status: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
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

export type PlatformOpsAuditRecord = {
  id: string;
  brandId?: string;
  userId?: string;
  module?: string;
  type: string;
  source?: string;
  severity?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type PlatformOpsAuditResponse = {
  data: PlatformOpsAuditRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchPlatformOpsHealth() {
  const response = await api.get<PlatformOpsHealthResponse>("/platform-ops/health");
  return response.data;
}

export async function listPlatformOpsErrors(filters: PlatformOpsErrorFilters = {}) {
  const response = await api.get<PlatformOpsErrorsResponse>("/platform-ops/errors", {
    params: filters,
  });
  return response.data;
}

export async function fetchPlatformOpsJobs(status?: string) {
  const response = await api.get<PlatformOpsJobsResponse>("/platform-ops/jobs", {
    params: { status },
  });
  return response.data;
}

export async function fetchPlatformOpsSecurity() {
  const response = await api.get<PlatformOpsSecurityResponse>("/platform-ops/security");
  return response.data;
}

export async function listPlatformOpsAudit(filters: PlatformOpsAuditFilters = {}) {
  const response = await api.get<PlatformOpsAuditResponse>("/platform-ops/audit", {
    params: filters,
  });
  return response.data;
}
