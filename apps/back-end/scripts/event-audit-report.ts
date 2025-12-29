// Dev-only CLI: Event Audit Report
process.env.NODE_ENV = process.env.NODE_ENV || "development";
import { printAuditReport } from "../src/core/events/dev-audit/event-audit-util";

// Minimal app boot or targeted event emission for audit
// Example: import and call a few publish() calls here, or run a test
// For demo, just print the report (in real use, run your app/tests first)

printAuditReport();

// To use: run this script after running your app/tests in dev mode
