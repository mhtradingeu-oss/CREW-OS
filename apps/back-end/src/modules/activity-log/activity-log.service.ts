
import type { Prisma } from "@prisma/client";
import { ActivityLogRepository } from "../../core/db/repositories/activity-log.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import type { EventEnvelope } from "../../core/events/event-bus.js";
import type { ActivityLogFilters, ActivityLogRecord } from "./activity-log.types.js";
import { publish } from "../../core/events/event-bus.js";


class ActivityLogService {
  // Create (record) an activity log (immutable)
  async record(event: EventEnvelope): Promise<void> {
    await ActivityLogRepository.appendActivity(event);
    await publish("activity.logged", { event });
  }

  // List activity logs with filtering
  async list(
    filters: ActivityLogFilters = {},
  ): Promise<{ data: ActivityLogRecord[]; total: number; page: number; pageSize: number }> {
    const result = await ActivityLogRepository.listActivity(filters);
    await publish("activity.retrieved", { filters });
    return result;
  }

  // Get all logs for a specific entity (immutable audit trail)
  async getByEntity(entityType: string, entityId: string): Promise<ActivityLogRecord[]> {
    return ActivityLogRepository.getActivityByEntity(entityType, entityId);
  }
}

export const activityLogService = new ActivityLogService();
