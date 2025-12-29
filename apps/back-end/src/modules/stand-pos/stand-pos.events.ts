import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  StandKpiEventPayload,
  StandPerformanceEventPayload,
  StandStockEventPayload,
} from "./stand-pos.types.js";

export enum StandPosEvents {
  KPI_UPDATED = "stand.kpi.updated",
  PERFORMANCE_REGRESSED = "stand.performance.regressed",
  STOCK_LOW = "stand.stock.low",
  STOCKOUT_REPEATED = "stand.stockout.repeated",
}

export async function emitStandKpiUpdated(payload: StandKpiEventPayload, context?: EventContext) {
  await publish(StandPosEvents.KPI_UPDATED, payload, context);
}

export async function emitStandPerformanceRegressed(
  payload: StandPerformanceEventPayload,
  context?: EventContext,
) {
  await publish(StandPosEvents.PERFORMANCE_REGRESSED, payload, context);
}

export async function emitStandStockLow(payload: StandStockEventPayload, context?: EventContext) {
  await publish(StandPosEvents.STOCK_LOW, payload, context);
}

export async function emitStandStockoutRepeated(
  payload: StandStockEventPayload,
  context?: EventContext,
) {
  await publish(StandPosEvents.STOCKOUT_REPEATED, payload, context);
}
