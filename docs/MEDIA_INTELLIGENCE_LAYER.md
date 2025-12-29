MEDIA_INTELLIGENCE_LAYER.md

1. Purpose

The Media Intelligence Layer (MIL) defines a safe, advisory-first architecture for generating media plans and drafts (video/audio concepts, scripts, storyboards, voice specs) that are:

Brand-aware

Governed & auditable

Automation-aware (hooks only)

Execution-gated (no generation, no external API calls, no side effects in Phase 6)

MIL is a capability layer that integrates with:

AI Crew OS (advisory orchestration)

Marketing OS (campaign/content planning)

Brand OS (identity, tone, safety rules)

Automation OS (suggest-only hooks, never execute)

Learning Loop OS (future: feedback & performance signals)

2. Non-Goals (Phase 6 / 6.5)

MIL MUST NOT in Phase 6:

Generate actual video/audio files

Call external providers (Higgsfield, Runway, ElevenLabs, etc.)

Trigger automation runs, scheduling, publishing, sending, or posting

Store raw user text beyond safe hashes (same rule as AI Crew Advisory)

Introduce GPU infra or heavy runtime pipelines

MIL in Phase 6 produces “Drafts & Suggestions only”.

3. Capability Model
3.1 Capability Types

MIL introduces two core capabilities:

VIDEO_INTELLIGENCE

AUDIO_INTELLIGENCE

Each capability supports modes:

suggest (recommend concepts / plan)

draft (produce scripts / prompts / storyboards / voice specs)

execute (future, Phase 7+ only)

Allowed modes in Phase 6: suggest, draft
Forbidden in Phase 6: execute

4. System Interfaces
4.1 AI Crew Integration (Required)

MIL is invoked ONLY through AI Crew advisory flows, never directly executing.

MIL is consumed by:

AICrewService.runAdvisory() (single question)

AICrewSessionService.runSession() (multi-question composition)

MIL outputs must remain advisory-only and comply with:

Allowed actions: analyze | summarize | recommend | draft

No side effects

Read-only context builders

4.2 Automation Integration (Hooks Only)

Automation OS may emit “suggest” tasks to MIL via events, but MUST NOT execute generation.

Examples of automation actions (allowed now):

SUGGEST_VIDEO_CONCEPT

SUGGEST_AUDIO_SCRIPT

DRAFT_AD_VARIANTS

Examples forbidden now:

GENERATE_VIDEO

GENERATE_AUDIO

PUBLISH_MEDIA

SCHEDULE_POST

5. Data Flow (Advisory-Only)
User/API
  |
  v
AI Crew Advisory (runAdvisory / session)
  |
  +--> Brand Context (read-only)
  +--> Marketing Context (read-only)
  +--> Product Context (read-only)
  +--> Compliance/Safety Context (read-only)
  |
  v
MIL: Video/Audio Intelligence Draft
  |
  v
Unified Advisory Output (summary + evidence + confidence)
  |
  v
Audit Log (no raw PII / no raw question)

6. Output Contracts (Draft Schemas)
6.1 Video Intelligence Output (Draft)

Use cases:

ad concept

UGC script

product launch reel

explainer

Output schema (logical):

{
  "type": "VIDEO_INTELLIGENCE",
  "mode": "suggest|draft",
  "objective": "string",
  "targetAudience": "string",
  "platform": "instagram|tiktok|youtube|ads|website",
  "durationSec": 15,
  "format": "reel|story|short|ugc|cinematic",
  "creativeDirection": {
    "style": "string",
    "tone": "string",
    "pacing": "string",
    "camera": ["string"],
    "doNotUse": ["string"]
  },
  "script": {
    "hook": "string",
    "body": "string",
    "cta": "string",
    "onScreenText": ["string"]
  },
  "storyboard": [
    { "scene": 1, "visual": "string", "motion": "string", "voiceover": "string", "durationSec": 3 }
  ],
  "assetList": ["string"],
  "complianceNotes": ["string"],
  "risks": ["string"],
  "assumptions": ["string"],
  "providerPromptDrafts": {
    "genericTextToVideo": "string",
    "genericImageToVideo": "string",
    "genericTalkingAvatar": "string"
  }
}

6.2 Audio Intelligence Output (Draft)

Use cases:

marketing voice-over

support voice response draft (text only)

IVR script draft (no live call)

assistant persona voice spec (text only)

Output schema (logical):

{
  "type": "AUDIO_INTELLIGENCE",
  "mode": "suggest|draft",
  "objective": "string",
  "language": "en|de|ar|...",
  "voiceSpec": {
    "persona": "string",
    "tone": "string",
    "speed": "slow|medium|fast",
    "energy": "low|medium|high",
    "pronunciationNotes": ["string"]
  },
  "script": {
    "intro": "string",
    "main": "string",
    "cta": "string",
    "disclaimer": "string"
  },
  "variants": [
    { "variant": "A", "script": "string" },
    { "variant": "B", "script": "string" }
  ],
  "complianceNotes": ["string"],
  "risks": ["string"],
  "assumptions": ["string"]
}

7. Governance & Safety Rules

MIL MUST enforce:

7.1 Hard Safety Constraints

No auto-publish

No auto-send

No scheduling

No payment collection

No impersonation / voice cloning claims

No personal data usage in scripts beyond brand-safe placeholders

7.2 Brand-Scoped Output

All outputs must be constrained by:

Brand identity (tone, colors, positioning)

Allowed claims

Restricted topics

PII guard

7.3 Audit Requirements

For every MIL invocation:

log timestamp, userId, scopes, agentsUsed, questionHash, outputType, confidence

NEVER log raw question text

NEVER log customer PII

8. RBAC & Permissions
8.1 Advisory Permissions

ai.crew.advisory (preferred)

fallback ai.read

8.2 Capability Permissions (future-ready)

ai.capability.media.read

ai.capability.video.draft

ai.capability.audio.draft

Phase 6: map to ai.crew.advisory only.

9. Event Hooks (Suggest-Only)

MIL can be requested by events (read-only suggestion actions). Example events:

CampaignCreated

ProductLaunched

LowROASDetected

TrendDetected

SupportTicketSpikeDetected

Allowed automation actions:

SUGGEST_VIDEO_CONCEPT

DRAFT_VIDEO_SCRIPT

SUGGEST_AUDIO_VOICEOVER

DRAFT_IVR_SCRIPT

Each results in:

A new advisory output (stored as suggestion record in future)

No execution calls

10. Execution Gates (Phase 7+)

MIL defines explicit gates that must remain disabled until Phase 7:

10.1 Gate Conditions

To enable execute:

Typecheck ✅

Tests ✅

Governance policy engine fully wired ✅

Automation lifecycle complete ✅

Human approval workflow enabled ✅

Provider adapter sandbox tested ✅

Budget limits & incident response ready ✅

10.2 Gate Interfaces (future)

ExecutionGate.canExecute(capability, userRole, riskScore, budgetProfile): boolean

ExecutionGate.requireHumanApproval(...)

11. Provider Adapter Architecture (Future-Only)

Providers are integrated via adapters (no direct calls from MIL logic).

Example adapters:

HiggsfieldAdapter (if API exists)

RunwayAdapter

ElevenLabsAdapter

OpenAI_TTS_Adapter

Each adapter must:

support dry-run validation

enforce usage limits

emit audit events

never run unless execute gate is open

12. Testing Strategy
12.1 Phase 6 Tests (Required Now)

Deterministic outputs formatting

No forbidden actions in output

Context builder tolerance

Audit log does not include raw question

RBAC enforcement on all endpoints

12.2 Phase 7 Tests (Future)

Adapter contract tests (mock providers)

Execution gate tests

Human approval required tests

Budget enforcement tests

13. Implementation Plan (Design → Build)
Phase 6.5 (Now)

Keep MIL as spec + schema contracts

Add capability identifiers into manifest (optional)

Ensure AI Crew agents can draft MIL outputs safely

Phase 7.1

Implement MediaDraftService (still no execution)

Persist drafts to DB (optional, with policy)

Phase 7.2+

Add provider adapters

Enable execute behind gates + approvals

14. Success Criteria

MIL is “ready” at Phase 6 when:

AI Crew can produce consistent video/audio drafts

Outputs are brand-safe, compliant, and explainable

No execution paths exist

Audit is clean and privacy-safe

Automation only requests suggestions (no execute)