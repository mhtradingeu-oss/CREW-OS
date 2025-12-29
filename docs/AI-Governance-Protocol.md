# MH-OS AI Governance Protocol

## Governance Objectives
- Enforce policy compliance, RBAC, and brand/tenant isolation across all AI runs.
- Require approvals for high-impact actions and high-risk scopes.
- Maintain auditable logs for safety, budgets, and autonomy decisions.

## Controls
- Prompt Firewall: regex/string rules, block or sanitize; log safety events.
- Safety Constraints: scope-based restrictions from DB; block restricted domains.
- Banned Actions: per-action codes; block and log.
- Autonomy Guard: viewer/advisor/operator decisions; force approval on high-risk scopes.
- Budget Guard: manifest budgetProfile + DB budgets; alert at 80%, block on exceed.
- Oversight Hooks: recordSafetyEvent on validation failures and high-risk runs; Oversight Agent reviews.

## Escalation Paths
- Risk-triggered oversight when scope in pricing/finance/operations/support/media/social/influencer/notification.
- Pending approval state saved in autonomy decision; Oversight Agent summarizes daily.
- Governance Advisor Agent recommends required approvals and captures rationale.

## Audit & Monitoring
- Monitoring events stored via aIMonitoringEvent: category PERFORMANCE_METRIC for successes/failures.
- Safety events stored via aISafetyEvent: PROMPT_FIREWALL, SAFETY_CONSTRAINT, BANNED_ACTION, OVERSIGHT.
- Insights persisted with autonomy context for later review.

## Change Management
- New agents must declare scope, allowedActions, budgetProfile, safetyRules, and bootPrompt.
- High-risk changes (models, budgets, scopes) require human approval before deploy.
