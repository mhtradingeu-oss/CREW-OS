import { subscribeToAll } from "../../core/events/event-bus.js";
import { logger } from "../../core/logger.js";
import { activityLogService } from "./activity-log.service.js";

export function registerActivityLogSubscriber() {
  subscribeToAll(async (event) => {
    try {
      if (!event.name.startsWith("activity.")) {
        return;
      }
      await activityLogService.record(event);
    } catch (err) {
      logger.error("[activity-log] Failed to record event", {
        event: event.name,
        error: err,
      });
    }
  });
}
