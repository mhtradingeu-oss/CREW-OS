# Automation Execution (Phase 15)

This layer is the gated bridge between Phase 13 AI suggestions and deterministic state changes. It exposes a single, human-mediated endpoint:

- **`POST /api/v1/automation/execute`** — executes one approved action, records the attempt in the immutable ledger, and emits the required logs/metrics for audit and compliance.

Every request must carry an `approvalDecisionId`, the originating `suggestionId`, the `snapshotHash` that was reviewed, and a supported `action` payload. The server validates:

1. `AUTOMATION_EXECUTION_ENABLED` **feature flag** is set to `true` (fail-closed otherwise).
2. The approval decision exists and has `status === APPROVED`.
3. The stored `snapshotHash` matches the `currentSnapshotHash` supplied with the execution.
4. `approval.environment` equals `NODE_ENV`.
5. The decision has not expired or been revoked.
6. The caller holds `automation:execute` and `ai:approvals:read` permissions **and** the plan enables automation.

If any guard fails, the API returns `403`/`409` and logs `execution.guard.rejected` with the full context.

## Execution lifecycle

1. Human reviewer inspects the Phase 13 suggestion and records an `ApprovalDecision` (Phase 14).
2. The operator calls `/api/v1/automation/execute` with the IDs, guard metadata, and the approved action.
3. `AutomationExecutionGuard` verifies permissions, feature flag, snapshot, environment, and decision freshness.
4. `AutomationExecutionService` generates an `executionId`, logs `execution.start`, dispatches the deterministic action, and waits for completion.
5. On completion it writes an immutable `AutomationExecutionLedger` row capturing `executionId`, `approvalDecisionId`, `suggestionId`, `snapshotHash`, `executedBy`, `result`, `errorCode`, `actionType`, and optional payload/result JSON.
6. Publishers emit `execution.success` or `execution.failed` and update Prometheus metrics (`automation_execution_total`, `automation_execution_failed`, `automation_execution_latency`).

## Legal responsibility boundary

- Humans remain the gatekeepers: AI only proposes actions (Phase 13), and the execution endpoint refuses anything without a documented `ApprovalDecision`.
- Every execution ties back to `snapshotHash`, `suggestionId`, `approvalDecisionId`, `actorUserId`, and `environment`, so auditors can reconstruct “who signed off on what state”.
- The ledger is append-only: once an entry exists, it is never modified or deleted.
- All action executions are deterministic, idempotent (or guarded), and side-effect-free beyond the approved handler, so regulators can reason about downstream impacts.

## Incident handling

- Failures surface as `execution.failed` logs with the full `executionId`, `error`, and guard context.
- Prometheus metrics cover volume, failures, and latency; dashboards can alert when `automation_execution_failed` spikes or `automation_execution_latency` exceeds thresholds.
- Operators can inspect the ledger for an `executionId`, re-materialize the approved `snapshotHash`, and re-verify the decision trail before retrying manually (no automated retries exist).
- Each failure increments both `automation_execution_total{result="failed"}` and `automation_execution_failed`, ensuring alerts and audit trails remain aligned.

## Rollback policy

1. Identify the ledger entry (via `executionId`) and the associated `suggestionId` + `snapshotHash`.
2. Revoke or pause the linked automation rule or prevent the same suggestion from running again.
3. There are no automatic compensating actions—humans make the call, and further automations are gated until a fresh approval is issued.
