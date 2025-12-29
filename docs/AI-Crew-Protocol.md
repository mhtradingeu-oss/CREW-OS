# MH-OS AI Crew Protocol

## Agent Hierarchy
- Executive Oversight: Oversight Agent (escalation, approvals)
- Governance Line: Governance Advisor Agent, Safety Officer Agent
- Domain Leads: pricing, marketing, crm, inventory, finance, operations, knowledge, support
- Specialists: media, influencer, notification, voice, hr trainer

## Canonical Scopes & Responsibilities
- Pricing/Finance/Operations: high-risk, operator-level actions require approval
- Marketing/CRM/Sales: advisory by default, drafts only
- Governance/Oversight/Safety: read-only, policy checks, escalation
- Knowledge/Support/Notification/Voice: summarize, draft; never auto-send

## Capabilities & Allowed Actions
- Default allowed actions: analyze, summarize, recommend, draft
- Side-effectful actions (apply/update/send/execute) are blocked unless explicitly approved per agent and scope
- Each agent defines allowedActions and restrictedDomains in the manifest

## Risk Scores & Autonomy Levels
- Risk scoring: LOW<25, MEDIUM 25-50, HIGH>50
- Autonomy: viewer (read-only), advisor (draft), operator (executes with guardrails); operator in high-risk scopes defaults to approval

## Safety Rules
- Enforce RBAC and brand/tenant isolation
- Apply prompt firewall + banned actions + safety constraints before LLM calls
- High-risk scopes trigger oversight logging and human-in-loop

## Validation & Fallback
- Validate output shape per scope; on failure, trigger oversight and fallback summaries
- Cache-safe defaults for pricing/finance/ops; always return deterministic JSON

## Budgets & Token Guardrails
- Per-agent budgetProfile in manifest; enforce manifest + DB budgets before run
- Alert at 80% of limits; block beyond limits

## Continual Learning & Monitoring
- Record monitoring events (performance, safety) per runId
- Capture autonomy decisions and approvals for audit
- Use Oversight Agent to review high-risk runs daily
