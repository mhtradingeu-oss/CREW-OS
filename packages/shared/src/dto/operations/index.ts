export interface UpdateOperationsTaskInput {
  title?: string;
  status?: string;
  dueDate?: Date | null;
}
// Operations DTOs migrated from backend


export interface OperationsTaskDTO {
  id: string;
  brandId?: string;
  title: string;
  status?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogDTO {
  id: string;
  brandId?: string;
  userId?: string;
  module?: string;
  type: string;
  source?: string;
  severity?: string;
  meta?: unknown;
  createdAt: Date;
}

export interface OperationsTaskListParams {
  brandId: string;
  status?: string;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OperationsTaskListResponse {
  items: OperationsTaskDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityLogListParams {
  brandId: string;
  module?: string;
  type?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface ActivityLogListResponse {
  items: ActivityLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateOperationsTaskInput {
  brandId: string;
  title: string;
}

export interface OperationsTaskDTO {
  id: string;
  brandId?: string;
  title: string;
  status?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogDTO {
  id: string;
  brandId?: string;
  userId?: string;
  module?: string;
  type: string;
  source?: string;
  severity?: string;
  meta?: unknown;
  createdAt: Date;
}

export interface OperationsTaskListParams {
  brandId: string;
  status?: string;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OperationsTaskListResponse {
  items: OperationsTaskDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityLogListParams {
  brandId: string;
  module?: string;
  type?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface ActivityLogListResponse {
  items: ActivityLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateOperationsTaskInput {
  brandId: string;
  title: string;
}
