# Phase C — Automation & Event Orchestration (Design Doc)

## 1. Scope
Phase C delivers the safe execution layer for MH-OS SUPERAPP:
- A canonical Domain Event Bus
- Automation Rule lifecycle (Rule → Version → Approval → Active)
- Trigger → Conditions → Governance Gates → Actions execution
- Explainability + Audit (why/what/who) for every run
- AI-assisted recommendations (non-binding) guarded by governance

## 2. Non-Goals (Hard Boundaries)
- No autonomous AI execution
- No automation execution without governance approvals
- No side-effects outside the Automation Engine
- No schema-less events
- No “hidden” execution paths bypassing audit logs

## 3. Event Taxonomy
### 3.1 Domain Events (facts)
Examples:
- user.created
- user.role.changed
- product.created
- product.price.updated
- order.created
- order.paid
- inventory.low
- crm.lead.created
- automation.rule.approved

### 3.2 System Events (telemetry)
- automation.run.started
- automation.run.completed
- automation.run.failed
- ai.recommendation.generated
- governance.approval.requested

## 4. Event Bus Architecture
Responsibilities:
- Validate event schema
- Publish to subscribers
- Persist immutable event log
- Provide at-least-once delivery with idempotent handling

Guarantees:
- At-least-once delivery
- Idempotent handlers
- Ordered per aggregate key where needed

## 5. Automation Model
Core entities:
- AutomationRule
- AutomationRuleVersion
- AutomationTrigger
- AutomationCondition
- AutomationAction
- AutomationRun

Lifecycle:
Draft → Submitted → Approved → Active → (Paused | Archived)

Hard rule:
- No Active without Approved

## 6. Canonical Execution Flow
Event Emitted
→ Rule Matcher
→ Condition Evaluator
→ Governance Gate
→ Action Executor
→ Audit Log + Explainability

## 7. Governance Model
Approval types:
- Manual (human)
- Policy-based
- AI-advised (non-binding)

Gates:
- Role-based approval
- Risk threshold checks
- Environment rules (prod vs staging)

## 8. AI Boundaries (Red Line)
- AI suggests, never executes
- AI output is a Recommendation object
- Any Action requires:
  - a Rule Version
  - governance approval
  - an auditable execution intent

## 9. Explainability & Audit (Mandatory)
Every run must record:
- why it ran (trigger + rule version)
- who approved
- which conditions passed/failed
- what actions executed
- decision path + outcome

## 10. Failure Modes & Rollback
Failure handling:
- bounded retries
- dead-letter routing
- manual intervention hooks

Rollback:
- disable rule version
- revert actions if possible
- keep audit immutable

## 11. Deliverables
- Event bus integrated
- Automation engine fully wired
- Governance endpoints/UI supported
- Explainability + audit APIs
- No silent execution
- No hidden AI behavior
x
