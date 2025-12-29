# Global AI Assistant (F6)

## What it is
- Command Palette (Ctrl/Cmd + K) and "Ask Hairo" drawer available across Tenant and SuperAdmin shells.
- Context-aware prompts based on current module (pricing, marketing, CRM, virtual office, AI governance, superadmin, workspace).
- Safe mode always on: outputs are read-only; no auto-apply. Banner shows safe-mode status.

## Entry points
- Tenant topbar: Command Palette icon + Ask Hairo button.
- SuperAdmin topbar: Palette button + Ask Hairo.
- Keyboard: Ctrl/Cmd + K toggles palette.

## Behaviors
- Command Palette: fuzzy filter of navigation + AI actions; runs navigation or pre-fills assistant.
- Assistant Drawer: textarea + contextual quick prompts; calls orchestrator helper `fetchAiInsights` (mock/deterministic fallback) and renders read-only response.
- Context detection uses pathname → module key; displayed inside drawer; prompts adjust per module.

## Safety / Modes
- Safe mode banner visible in palette + drawer; no auto-actions executed.
- Clear output button; Close buttons for dismissal; Escape closes drawer/palette.

## Client contracts
- Uses existing `lib/api/ai.ts` orchestrator helper `fetchAiInsights(payload: { brandName?: string; highlights?: string })`.
- No backend mutations. Backend needed later for richer orchestrator endpoints and cached insights.

## Extensibility
- Add module-specific commands in `GlobalAssistantProvider` commands list.
- To surface real actions, pipe responses into domain-specific drawers but keep safe-mode confirmation.
- Voice mode: keep disabled until IVR endpoint lands (see Virtual Office doc).

## Testing
- `npm run typecheck -w mh-os-admin`
- Palette hotkey works client-side only (Next.js app router).
