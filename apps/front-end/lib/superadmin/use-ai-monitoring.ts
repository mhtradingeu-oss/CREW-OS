import { useMemo } from "react";
import { aiExecutions, errors, fallbacks, type AiExecution, type ErrorRecord, type FallbackRecord } from "./mock-data.ts";

export type MonitoringFilters = {
  status?: "success" | "fallback" | "error";
  tenant?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 10;

export function useAiMonitoringData(filters: MonitoringFilters): {
  executions: AiExecution[];
  totalExecutions: number;
  totalPages: number;
  fallbacks: FallbackRecord[];
  errors: ErrorRecord[];
} {
  const { status, tenant, page = 1, pageSize = DEFAULT_PAGE_SIZE } = filters;

  const filteredExecutions = useMemo(() => {
    return aiExecutions.filter((run) => {
      const matchesStatus = status ? run.status === status : true;
      const matchesTenant = tenant ? run.tenant === tenant : true;
      return matchesStatus && matchesTenant;
    });
  }, [status, tenant]);

  const totalExecutions = filteredExecutions.length;
  const pagedExecutions = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredExecutions.slice(start, end);
  }, [filteredExecutions, page, pageSize]);

  const filteredFallbacks = useMemo<FallbackRecord[]>(() => {
    return fallbacks.filter((fb) => (tenant ? fb.tenant === tenant : true));
  }, [tenant]);

  const filteredErrors = useMemo<ErrorRecord[]>(() => {
    return errors.filter((err) => (tenant ? err.tenant === tenant : true));
  }, [tenant]);

  return {
    executions: pagedExecutions,
    totalExecutions,
    totalPages: Math.max(1, Math.ceil(totalExecutions / pageSize)),
    fallbacks: filteredFallbacks,
    errors: filteredErrors,
  };
}
