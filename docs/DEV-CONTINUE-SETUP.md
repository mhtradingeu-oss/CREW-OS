# Dev Continue Setup

This repository uses Continue's Markdown prompt-agent mode. The `.continue/config.yml` file defines the models, prompts directory, rules directory, and workspace root. Each Markdown prompt inside `.continue/prompts/` becomes a dedicated agent (Architect, Backend Coder, Frontend Engineer, etc.), and each file under `.continue/rules/` defines workflow constraints that apply across those agents.

## Architecture
- `models` in `.continue/config.yml` list the permitted OpenAI models (`gpt-4.1` and `gpt-4.1-mini`), all sharing the `${OPENAI_API_KEY}`.
- `prompts.directory` points to `./.continue/prompts` where each Markdown file starts with a title, role, model, purpose, context (with links to `/docs/MH-OS SUPERAPP – FINAL BLUEPRINT (v1.1).md`, `/docs/MASTER_OS_ARCHITECTURE_FINAL.md`, `/docs/35_folder-structure-master.md`, and `/docs/os/*`), and an `[END OF PROMPT]` sentinel.
- `rules.directory` points to `./.continue/rules` where each rule file contains sections like Purpose, Absolute Rules, and Workflow notes without deprecated YAML syntax.
- `workspace.root` is `"."`, so Continue treats the MH-OS-Superapp folder as the single workspace root.

## How prompts and rules work
- When you invoke an agent (e.g., the Architect), Continue uses the Markdown prompt as the system behavior. The prompt explains the agent’s role, references canonical docs, and supplies instructions. Always read the referenced docs before modifying or recommending anything.
- Rules apply on top of prompts; they clarify expectations (e.g., the Backend Dev Protocol enforces the READ → PLAN → IMPLEMENT pipeline).
- The prompts and rules are static files you can edit; changes take effect the next time Continue runs.

## Switching agents
1. Open the Command Palette (or the Continue sidebar) and select the agent you want (e.g., “MH-OS Architect Agent”).
2. Tell it what to do, referencing the current sprint or doc sections.
3. If the task scope changes, switch to the appropriate agent (Planner for breaking down work, Backend Coder for implementation, etc.).

## IMPORTANT
Always open VSCode from the `MH-OS-Superapp` folder only. Continue must detect a single workspace root to resolve doc references and avoid fragmented state.

## See also
- `docs/DEV-SETUP-CHECKLIST.md` for step-by-step onboarding tasks.
- `docs/DEV-ENVIRONMENT-CLEANUP.md` for workspace cleanup best practices.
- `docs/DEV-DOCKER-SETUP.md` for Docker Compose commands that support the agent workflows.
