# Virtual Office / Virtual HQ (F4 → F6 polish)

This document outlines the front-end implementation of the 2D Virtual Office built for F4 and the polish added in F6.

## Routes
- `/virtual-hq` (under TenantAppLayout)
  - Uses new components: VirtualOfficeMap, MeetingRoom, AITeamBoard, AIJournal
  - Ask AI modal/drawer for quick assistant prompts

## Components
- `VirtualOfficeMap`: CSS grid 2D layout with zones (Lobby, Meeting Room, AI Team Board, Journal Area, User Desk) + hover animations, tooltip hint, responsive columns.
- `MeetingRoom`: AI participants list, meeting table/chairs visuals, live notes placeholder, agenda + action items, Start Meeting opens AI assistant, voice-mode placeholder block (IVR later), sync notes CTA.
- `AITeamBoard` + `AgentCard`: Displays AI crew (name, scope, role, status) with chat/voice/settings buttons (voice stub; integrate IVR when backend is ready).
- `AIJournal`: Notion-style timeline of insights/learnings/decisions; fetches `/ai/insights` read-only with graceful fallback.

## Data / API
- New helper in `lib/api/ai.ts`: `listAiJournal()` + `AIJournalEntry` types; uses `/ai/insights` (GET) and falls back to static entries on failure.
- No backend schema changes required; voice trigger remains stubbed (console/info) until IVR endpoint is available; voice-mode UI is safe-mode only.

## UX Notes
- Uses `ModuleScaffold` + `PageHeader` from the tenant shell.
- Ask AI action lives in header and Start Meeting; both open the assistant modal.
- Responsive grids: map + meeting room, team board + journal; KPIs beneath. Map now scales to sm/md/desktop, with hover gradient pulses.

## Next Steps / Integration Hooks
- Wire AI drawer to real orchestrator call when ready.
- Connect voice button to IVR backend once endpoint is available.
- Replace fallback journal data with live `AIInsight` responses once backend is stable.
- Optional: stream orchestrator summaries into MeetingRoom “voice mode” panel once speech-to-text is wired.
