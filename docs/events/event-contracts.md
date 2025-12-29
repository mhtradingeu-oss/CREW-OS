# Event Contracts Governance

## Naming Rules
- Use dot-separated, lowercase, kebab-case for each segment (e.g., `knowledgebase.document.summarized`).
- No spaces, no uppercase, no underscores.
- Prefix with domain/module (e.g., `crm.lead.created`).
- Be descriptive and stable; avoid abbreviations unless standard.

## Canonical Event List
- The canonical list of event names is maintained in:
  - `apps/back-end/src/core/events/dev-audit/canonical-events.ts`
- Only events in this list are considered official contracts.

## Alias Policy
- Aliases are only allowed for backward compatibility and are defined in `EVENT_ALIASES` in `event-bus.ts`.
- Never use aliases as canonical names; always prefer the canonical event name in new code.
- Aliases must not be used for new events or as a workaround for naming mistakes.

## Change Procedure
- **Additive only:** New events may be added, but existing event names must never be renamed or removed.
- To add a new event:
  1. Add it to the canonical list.
  2. Document its purpose and payload.
- To alias an event (for legacy support):
  1. Add the alias to `EVENT_ALIASES` in `event-bus.ts`.
  2. Never remove or rename existing events.

## CI/QA
- A dev-only audit tool and script (`event:audit`) is available to detect unknown or aliased events.
- Unknown events should be reviewed and resolved before merging changes.
