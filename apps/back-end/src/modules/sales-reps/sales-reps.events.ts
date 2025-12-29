import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  SalesActivityEventPayload,
  SalesOrderEventPayload,
  SalesPlanEventPayload,
  SalesRepsEventPayload,
} from "./sales-reps.types.js";

export enum SalesRepsEvents {
  CREATED = "sales-reps.created",
  UPDATED = "sales-reps.updated",
  DELETED = "sales-reps.deleted",
  PLAN_GENERATED = "sales.plan.generated",
  ACTIVITY_LOGGED = "sales.activity.logged",
  ORDER_CREATED = "sales.order.created",
}

export async function emitSalesRepsCreated(payload: SalesRepsEventPayload) {
  await publish(SalesRepsEvents.CREATED, payload);
}

export async function emitSalesPlanGenerated(
  payload: SalesPlanEventPayload,
  context?: EventContext,
) {
  await publish(SalesRepsEvents.PLAN_GENERATED, payload, context);
}

export async function emitSalesActivityLogged(
  payload: SalesActivityEventPayload,
  context?: EventContext,
) {
  await publish(SalesRepsEvents.ACTIVITY_LOGGED, payload, context);
}

export async function emitSalesOrderCreated(
  payload: SalesOrderEventPayload,
  context?: EventContext,
) {
  await publish(SalesRepsEvents.ORDER_CREATED, payload, context);
}
