export type ActivityLogFilters = {
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

export type ActivityLogRecord = {
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
