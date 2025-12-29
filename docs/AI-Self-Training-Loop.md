# MH-OS AI Self-Training Loop

## Goals
- Enable agents to evaluate their outputs, detect gaps, and propose improvements without direct side effects.
- Maintain human-in-the-loop for schema/model changes and policy updates.

## Loop Stages
1) Observe: collect monitoring events (performance, validation failures, high-risk scopes).
2) Assess: Oversight Agent reviews failures and high-cost runs; Safety Officer checks violations.
3) Propose: agents generate improvement suggestions (prompts, schemas, contexts) with `propose` actions only.
4) Review: Governance Advisor Agent aggregates proposals and flags items needing approval.
5) Apply (manual): human reviewers accept/reject; if accepted, tasks flow into backlog or migrations.

## Signals & Metrics
- Validation failure rates per scope
- Token/cost usage vs budgetProfile
- Autonomy decisions (allow/needs_approval/deny)
- Safety events count and severity

## Safeguards
- No automatic schema or route changes; proposals only.
- High-risk scopes auto-escalate to Oversight Agent and require approval.
- Persist suggestions in AI insights for audit; do not mutate business data.

## Implementation Hooks
- Generated boot prompts instruct agents to provide deterministic JSON and escalate uncertainty.
- `recordMonitoringEvent` marks validation failures and successes for downstream review.
- Autonomy guard forces approval on high-impact domains and side-effect actions.
