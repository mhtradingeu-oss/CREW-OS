// Dev-only event audit utility. No prod impact.
import { CANONICAL_EVENTS } from "./canonical-events.js";
import { EVENT_ALIASES } from "../event-bus.js";

const isDev = process.env.NODE_ENV !== "production";

// In-memory event capture (dev only)
const eventCounts: Record<string, number> = {};
const capturedEvents: string[] = [];

export function auditCaptureEvent(eventName: string) {
  if (!isDev) return;
  eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
  capturedEvents.push(eventName);
}

export function auditReport() {
  if (!isDev) return;
  const sorted = Object.keys(eventCounts).sort();
  const unknown = sorted.filter(e => !CANONICAL_EVENTS.includes(e));
  const aliasSet = new Set(Object.values(EVENT_ALIASES).flat());
  const potentialAliases = sorted.filter(e => aliasSet.has(e));
  return {
    events: sorted.map(e => ({ name: e, count: eventCounts[e] })),
    unknown,
    potentialAliases,
  };
}

export function printAuditReport() {
  const report = auditReport();
  if (!report) return;
  console.log("\n=== Event Audit Report ===");
  console.log("Emitted events:");
  report.events.forEach(e => console.log(`  ${e.name}: ${e.count}`));
  if (report.unknown.length) {
    console.log("\nUnknown events:");
    report.unknown.forEach(e => console.log(`  ${e}`));
  }
  if (report.potentialAliases.length) {
    console.log("\nPotential alias events:");
    report.potentialAliases.forEach(e => console.log(`  ${e}`));
  }
  console.log("==========================\n");
}
