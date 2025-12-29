import { subscribeToAll } from "../../core/events/event-bus.js";
import { logger } from "../../core/logger.js";
import { automationService } from "./automation.service.js";

let registered = false;

export function registerAutomationEventHandlers() {
  if (registered) return;
  subscribeToAll(async (event) => {
    try {
      await automationService.handleEvent(event);
    } catch (err) {
      logger.error("[automation] failed to handle event", {
        event: event.name,
        error: err,
      });
    }
  });
  registered = true;
}
