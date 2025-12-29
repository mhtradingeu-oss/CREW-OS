
// All domain types have been moved to @mh-os/shared. Only UI/View/Props types may remain here.

// Phase-B: Operations DTO stubs
export type ActivityLogDTO = any;
export type ActivityLogListParams = any;
export type ActivityLogListResponse = any;
export type CreateOperationsTaskInput = any;
export type OperationsTaskDTO = any;
export type OperationsTaskListParams = any;
export type OperationsTaskListResponse = any;

export interface UpdateOperationsTaskInput {
  title?: string;
  status?: string;
  dueDate?: Date | null;
}

export interface OperationsEventPayload {
  brandId?: string;
  taskId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
