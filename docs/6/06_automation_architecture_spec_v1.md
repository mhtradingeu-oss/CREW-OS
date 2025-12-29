06 Automation Architecture Spec v1
A) Logical ERD
1) AutomationRule

id (PK): ثابت

slug / key: اختياري (unique داخل tenant/brand)

scope: GLOBAL | TENANT | BRAND

tenantId (nullable)

brandId (nullable)

state: DRAFT | REVIEW | ACTIVE | PAUSED | ARCHIVED

currentVersionId (FK -> AutomationRuleVersion.id, nullable)

createdByUserId

approvedByUserId (nullable)

approvedAt (nullable)

lastRunAt (nullable)

lastRunStatus (nullable)

2) AutomationRuleVersion

id (PK)

ruleId (FK)

versionNumber (int)

status: DRAFT | LOCKED (LOCKED يعني immutable)

triggerEvent (string) (مثل AUTH_LOGIN_SUCCESS)

triggerType: EVENT (حاليًا) — قابل للتوسعة لاحقًا

conditionConfigJson

actionsConfigJson

hash (sha256): لمنع نسخ متكرر

createdByUserId

createdAt

القاعدة: أي Rule في ACTIVE يشير إلى Version LOCKED فقط.

3) AutomationRun

id (PK)

ruleId (FK)

ruleVersionId (FK)

eventName

eventId / requestId (nullable) (من meta)

dedupKey (sha256 unique-ish)

status: SUCCESS | FAILED | SKIPPED | TIMEOUT

startedAt / endedAt

durationMs

metaSnapshotJson (masked)

payloadSnapshotJson (masked)

4) AutomationActionRun

id (PK)

runId (FK)

actionIndex (int) (ترتيبها داخل actions array)

actionType

status: SUCCESS | FAILED | SKIPPED | TIMEOUT

startedAt / endedAt

durationMs

configSnapshotJson (masked)

resultSummaryJson (مختصر deterministic)

5) AutomationPolicyViolation

id (PK)

ruleId (FK)

ruleVersionId (FK, nullable)

severity: LOW | MEDIUM | HIGH | BLOCKER

code: string (مثل POLICY_FORBIDDEN_ACTION)

message

detailsJson

createdAt

B) State Machine Rules
Allowed edits

Editable: DRAFT, REVIEW

Immutable: ACTIVE, PAUSED, ARCHIVED

Transitions

DRAFT → REVIEW

REVIEW → DRAFT (رجوع للتعديل)

REVIEW → ACTIVE (requires approval)

ACTIVE ↔ PAUSED

ACTIVE/PAUSED → ARCHIVED (final)

Versioning rule

إذا Rule = ACTIVE أو PAUSED وتم تعديل logic:

create new RuleVersion(DRAFT)

لا تلمس النسخة القديمة

REVIEW/approve → set as currentVersionId

C) Control Plane vs Data Plane
Control Plane (Admin API)

CRUD rules

create versions

review/approve

policy validation + simulation

read runs + violations

Data Plane (Runtime)

subscribes to DomainEventBus

matches rules

evaluates conditions

executes actions

writes runs/actionRuns

ممنوع Control Plane ينفّذ Actions
ممنوع Data Plane يكتب/يعدّل Rules

D) API Routes (names only)
Rules

GET /api/v1/automation/rules

POST /api/v1/automation/rules (create rule in DRAFT)

GET /api/v1/automation/rules/:id

PATCH /api/v1/automation/rules/:id (metadata only)

POST /api/v1/automation/rules/:id/submit (DRAFT→REVIEW)

POST /api/v1/automation/rules/:id/approve (REVIEW→ACTIVE)

POST /api/v1/automation/rules/:id/pause

POST /api/v1/automation/rules/:id/resume

POST /api/v1/automation/rules/:id/archive

Versions

GET /api/v1/automation/rules/:id/versions

POST /api/v1/automation/rules/:id/versions (create DRAFT version)

GET /api/v1/automation/versions/:versionId

PATCH /api/v1/automation/versions/:versionId (only if DRAFT)

POST /api/v1/automation/versions/:versionId/submit (DRAFT→LOCKED? أو REVIEW concept)

POST /api/v1/automation/versions/:versionId/activate (sets rule.currentVersionId)

عمليًا: approve/activate تكون على Rule، لكن تشتغل على versionId الذي كان تحت REVIEW.

Runs

GET /api/v1/automation/runs

GET /api/v1/automation/runs/:id

GET /api/v1/automation/runs/:id/actions

POST /api/v1/automation/simulate (control-plane simulation)

Policy

POST /api/v1/automation/policy/validate (returns violations)

GET /api/v1/automation/violations?ruleId=...

E) Permission Matrix
Capability	SUPER_ADMIN	ADMIN	AUTOMATION_ADMIN	OPERATOR	VIEWER
Create rule/version	✅	✅	✅	❌	❌
Edit DRAFT/REVIEW	✅	✅	✅	❌	❌
Submit for review	✅	✅	✅	❌	❌
Approve to ACTIVE	✅	✅	✅(if granted)	❌	❌
Pause/Resume	✅	✅	✅	✅(optional)	❌
Archive	✅	✅	✅	❌	❌
View runs	✅	✅	✅	✅	✅
View violations	✅	✅	✅	✅	✅
Simulate	✅	✅	✅	✅	❌

ملاحظة: الأفضل “AUTOMATION_ADMIN” role مستقل بدل حشر الصلاحيات بالـ ADMIN.

F) Governance Gates
Pre-save Policy Gate

Blocks:

forbidden actionType

raw secrets in action config

triggers on sensitive events without role

invalid schema (zod)

Pre-exec Runtime Gate

Blocks:

rule not ACTIVE

tenant/brand mismatch

dedup collision (optional)

rate limit per rule/per tenant

action type not allowed in this environment (dev/prod)

G) UI Page Map

/dashboard/automations (Rules list)

/dashboard/automations/create

/dashboard/automations/[id] (Rule detail + state)

/dashboard/automations/[id]/versions

/dashboard/automations/[id]/builder (conditions/actions)

/dashboard/automations/simulate

/dashboard/automations/runs

/dashboard/automations/runs/[runId]

/dashboard/automations/violations

Implementation Order (Phase 6.1 بعدها مباشرة)

Prisma models + migration (Rule/Version/Run/ActionRun/Violation)

Services enforcing lifecycle + versioning

Policy Gate endpoints + zod schemas

Runtime Gate in executor

UI: Rules list + create + detail (بس)

Runs UI + simulate