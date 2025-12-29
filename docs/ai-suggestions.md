# AI Suggestions Layer (Phase 13)

## Purpose
Builds on the Phase 12 read-only snapshot foundation to offer humans deterministic, auditable advice without ever mutating state, calling automations, or issuing commands. This layer treats AI as an advisor: it points out risks, optimization opportunities, and improvement ideas while explicitly deferring the decision about what happens next to the operator.

## Output contract
Each request returns a structured payload plus the underlying Phase 12 snapshot. The payload contains:
- `version`, `declaration`, and `snapshotHash` for traceability.
- `suggestions[]`: advisory entries with `id`, `type` (`optimization` | `risk` | `warning`), `confidence` (0..1), human-readable `rationale`, data-backed `evidence`, a non-executing `suggestedAction`, and placeholder `approvalMetadata`/`auditMetadata` for future review workflows.
- `riskFlags[]`: short risk summaries that highlight database or automation coverage gaps.
- `improvementIdeas[]`: bounded ideas that explain how to enrich telemetry or align feature flags.
- `metadata`: includes `aiVersion` (`phase-13-ai-suggestions-layer`), `outputType` (`ai-suggestions.advisory.v1`), input size, and duration.

Guardrails ensure every string is checked against `AI_SUGGESTIONS_DECLARATION` plus a banned term list, so no advice becomes an execution command or hidden automation trigger.

## Differences: insights vs suggestions
| Characteristic | Insight (Phase 12) | Suggestion (Phase 13) |
| --- | --- | --- |
| Intent | Describe state, events, thresholds | Advise next steps without executing them |
| Output | Summaries, observations, warnings, optimization hints | Structured suggestions, risk flags, improvement ideas |
| Actionable? | No | No; threads include `suggestedAction` text but contain no commands |
| Human-in-loop | Yes (always) | Still required; every `suggestedAction` is a cue for manual approval |
| Auditability | Snapshot hash + metadata | Same snapshot hash + suggestion IDs + approval metadata placeholders |
| Logging | Metadata only, no text | Logs only snapshot hash, suggestion IDs, confidences, duration, AI version (never the suggestion text)

## API surface
- `GET /api/v1/ai/suggestions` (internal only)
  - Mounted under the main `/api/v1/ai` router, so it inherits `aiRateLimiter` and `advancedAutonomy` gating.
  - Requires `ai:read` and the new `ai:suggestions:read` permission.
  - Cached per brand with `AI_SUGGESTIONS_CACHE_TTL_MS` to keep responses deterministic and light.
  - Throttled by the same AI rate limiter as the broader `/api/v1/ai` surface.
  - Accepts an optional `brandId` query parameter; all payloads include the Phase 12 snapshot used to compute the advice.

## Safety guarantees
1. **Read-only**: Imports only the Phase 12 snapshot builder (`buildAIReadOnlySnapshot`). No writes, no event emission, no automations triggered.
2. **Advisory language enforcement**: Validator rejects any string containing forbidden execution terms (`execute`, `run`, `deploy`, `create`, `delete`, `command`, etc.) even in evidence or rationale.
3. **No hidden execution paths**: Suggestions include `approvalMetadata` and `auditMetadata` placeholders for future manual workflows, but no approval logic is implemented today.
4. **Deterministic output**: Heuristics derive IDs and confidences from snapshot hashes, so identical snapshots yield identical suggestions.
5. **No automation**: Textual advice avoids phrases like “do X now” or issuing commands; guard rejects those automatically.

## Configuration
| Variable | Description | Default |
| --- | --- | --- |
| `AI_SUGGESTIONS_ENABLED` | Enables the advisory layer (keep `false` until Phase 13 is ready). | `false` |
| `AI_SUGGESTIONS_TIMEOUT_MS` | Timeout for snapshot + analysis before failing closed. | `5000` |
| `AI_SUGGESTIONS_CACHE_TTL_MS` | Cache TTL for brand-scoped suggestions to keep responses consistent. | `30000` |

## Logging & audit
Production logs never capture suggestion text. Instead, each successful run logs:
- `module`: `ai-suggestions`
- `snapshotHash`
- `suggestionIds` (array of the generated IDs)
- `confidenceLevels` (array of confidences, ordered by ID)
- `durationMs`
- `aiVersion` (`phase-13-ai-suggestions-layer`)
- `correlationId` / `brandId` if provided
Failures log the same context plus the error without exposing the advisory text.

## Human-in-the-loop responsibilities
Operators must treat these suggestions as advisory only:
1. Review each `suggestedAction` manually; it does not trigger automations.
2. Use the attached `snapshotHash` when auditing or referencing the advice later.
3. Approval workflows are not yet implemented; the embedded `approvalMetadata` merely records which role will eventually be asked to sign off.
4. Because the service shares the same snapshot as Phase 12, human reviewers can correlate warnings with insights before deciding.

## Testing
- Unit tests cover guard violations, deterministic suggestion generation, and read-only enforcement (no `prisma.create` calls).
- Snapshot-only consumption is verified by mocking `prisma.activityLog.findMany`, `prisma.automationRun.findMany`, and `runDatabaseCheck`.
- Any guard violation (e.g., `suggestedAction` containing `execute`) throws before the payload is cached or returned.

## Non-goals (still future work)
- No approvals are implemented yet despite the metadata placeholders.
- No automation or state mutation happens even if suggestions reference automation health.
- Self-healing and auto-enforcement remain Phase 14+ work.
