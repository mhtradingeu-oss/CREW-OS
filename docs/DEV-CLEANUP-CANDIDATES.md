# DEV Cleanup Candidates

This file tracks outdated or duplicate folders that do not appear in the canonical structure described in `docs/MH-OS SUPERAPP – FINAL BLUEPRINT (v1.1).md` (see the monorepo layout in that doc around lines 62‑77).

| Path | Why suspicious | Recommendation |
| --- | --- | --- |
| `archive_old/` | Contains nested archives (`api_legacy_*`, another `archive_old/`, `backups/`, etc.) that look like historical snapshots from the Codex audit rather than part of the living monorepo. | Check manually before removal; likely safe to delete once nothing is needed. |
| `node_modules/` | Root-level dependency install artifacts are not part of the structured repo layout and can be regenerated from `package-lock.json`. | Safe to delete when preparing clean clones; keep ignored in version control. |

## Naming inconsistencies to fix later

- `apps/back-end/` is present instead of the canonical `apps/backend/` (the doc lists `apps/backend/` as the single backend folder, and this obfuscates the monorepo layout). No rename yet to avoid breaking imports.
- `apps/front-end/` exists instead of the expected `apps/frontend-web/` (the blueprint calls for a Next.js admin/OS dashboard under `apps/frontend-web/`).
- `packages/shared/` is the only package directory, whereas the blueprint defines discrete packages such as `ui-kit/`, `utils/`, `types/`, `auth/`, and `ai-engine/`. Keep this for now but note it conflicts with the documented package surface.
