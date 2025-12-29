// Lightweight CI check for event contract violations (warn mode)
process.env.NODE_ENV = process.env.NODE_ENV || "development";
import { auditReport } from "../src/core/events/dev-audit/event-audit-util";

const report = auditReport();
if (!report) {
  console.log("[event-contracts] No events captured. Run your tests/app first.");
  process.exit(0);
}

if (report.unknown.length) {
  console.warn("[event-contracts] WARNING: Unknown events detected (not in canonical list):");
  report.unknown.forEach(e => console.warn(`  - ${e}`));
  process.exitCode = 0; // Warn only (set to 1 to enforce)
} else {
  console.log("[event-contracts] All emitted events are canonical.");
}
