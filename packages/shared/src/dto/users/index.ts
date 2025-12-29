// User DTOs migrated from backend
export * from "./create-user.schema.js";
export * from "./update-user.schema.js";

export interface CreateUserInput {
  email: string;
  password: string;
  role?: string;
  status?: string;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: string;
  status?: string;
}

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface UserRoleInfo {
  name: string;
  description?: string | null;
}

export interface UserRecord {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  roleDetails?: UserRoleInfo;
}

export interface PaginatedUsers {
  items: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
}
