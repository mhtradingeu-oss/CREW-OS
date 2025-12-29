export interface CreateSecurityGovernanceInput {
  name: string;
  category?: string | null;
  rulesJson?: string | null;
  status?: string;
  brandId?: string | null;
}

export interface UpdateSecurityGovernanceInput extends Partial<CreateSecurityGovernanceInput> {}

export interface SecurityGovernanceEventPayload {
  policyId: string;
  name: string;
  category?: string | null;
  status?: string;
  brandId?: string | null;
  actorUserId?: string;
  changeSummary?: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionRecord {
  id: string;
  code: string;
  description?: string | null;
}

export interface AIRestrictionRecord {
  id: string;
  name: string;
  rulesJson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSecurityPoliciesParams {
  brandId?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SecurityPolicyRecord {
  id: string;
  key: string;
  category?: string | null;
  status: string;
  rulesJson?: string | null;
  brandId?: string | null;
  updatedAt: Date;
}

export interface SecurityPolicyListResponse {
  data: SecurityPolicyRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RBACOverview {
  roles: Array<{
    id: string;
    name: string;
    description?: string | null;
    permissions: string[];
  }>;
  permissions: string[];
  policies: Array<{
    id: string;
    key: string;
    category?: string | null;
    status: string;
    brandId?: string | null;
  }>;
}
