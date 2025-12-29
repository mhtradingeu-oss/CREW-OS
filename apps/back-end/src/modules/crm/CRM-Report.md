# CRM Module Report

## Overview
- Leads CRUD now surfaces `LeadRecord` with nullable brand, company, score, and deal counts so the pipeline UI can show fuller context (`crm.service.ts`).
- Added `/crm/:id/ai/score` to orchestrate `crmScorePrompt` via `orchestrateAI`, with caching keyed on lead identity and intent; fallbacks keep the panel responsive even if the provider is unavailable.
- Documented endpoints and AI scoring flows in `crm.http`, covering list/create/update/delete and strategy scoring so Thunder Client scripts can validate the CRM surface.

## Models & DTOs
- `Lead` (`prisma/schema.prisma:431-473`) links to `Person`, optional `Company`, and `Deal` records; `LeadRecord` now includes `companyName`, `score`, and `_count.deals` so the UI can show who owns the lead, how many deals exist, and the latest AI score.
- `CreateLeadInput`/`UpdateLeadInput` mirror the validated request schemas (`crm.validators.ts`), ensuring `brandId`, `email`, and `intent` fields remain optional but normalized.
- AI scoring lives in `CrmScoreResult` (`crm.ai.types.ts:1-4`), returning `score`, `probability`, `reasons`, and `nextAction`.

## AI scoring pipeline
- `/crm/:id/ai/score` loads the lead’s `Person` data, builds a name string, and passes it to `crmServiceAI.scoreLead`, which generates a JSON response via the `crmScorePrompt`.
- The prompt is cached using `makeCacheKey("crm-ai", payload)` so repeated scoring attempts reuse recent advice unless the intent changes.
- A fallback score (55, 40% probability) keeps scoring available when AI is offline, while the next action suggestion helps sales reps follow up quickly.
- Front-end panels can call this endpoint via `useLeadAI(leadId)` and refresh using `refetch`, showing the most recent score/reasons along with the AI-recommended next action.

## Gaps & next steps
- There is no notes/deals CRUD in this module; consider wiring `LeadActivity`, `Deal`, or `CRMTask` endpoints before surfacing them in the UI.
- Consider persisting score history (`LeadScoreHistory`) when AI scoring is triggered so the CRM report matches the logged advice provided by the AI Brain.
