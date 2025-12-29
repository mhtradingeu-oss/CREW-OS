# Dev Environment Cleanup

Use this guide and the accompanying `scripts/cleanup-local-artifacts.sh` helper when you want to refresh the local workspace without touching source files, env settings, migrations, or documentation.

## When to use
- You are about to switch branches or pull a large change and want to discard generated artifacts.
- The repo size feels bloated locally after many installs or builds.
- Something behaves oddly and you want to ensure caches/build outputs are rebuilt from a fresh state.

## How to run
1. Make the cleanup script executable (only required once):
   ```bash
   chmod +x scripts/cleanup-local-artifacts.sh
   ```
2. Execute the cleanup helper:
   ```bash
   ./scripts/cleanup-local-artifacts.sh
   ```

The script prompts for confirmation before deleting anything, operates only inside the `MH-OS-Superapp` repository, and removes only the following build/cache artifacts:
- `.turbo/`, `.next/`, `dist/`, `build/`, `.cache/`, `coverage/`
- `node_modules/` folders under `apps/` and `packages/`

It is non-destructive: no `.env` files, migrations, docs, or other source files are touched.

## VSCode & Continue workspace cleanup
- In VSCode: keep only the `MH-OS-Superapp` folder open as the workspace root and remove other projects so Continue sees a single workspace.
- In Continue: confirm it loads `.continue/config.yml` from this repo and that the active workspace points to the MH-OS-Superapp folder.
- These manual steps keep the IDE/agent context clean when switching tasks or debugging issues.

## Cleaning up
- To tear down services and remove volumes:
  ```bash
  docker compose down --volumes
  ```

This setup keeps the backend + database workflow simple: rebuild the image, ensure Postgres is online, run migrations, and then restart the backend. The frontend stays optional so backend work can continue independently.

## See also
- `docs/DEV-SETUP-CHECKLIST.md` for a start-to-finish onboarding checklist.
- `docs/DEV-DOCKER-SETUP.md` for the Compose commands referenced above.
- `docs/DEV-CONTINUE-SETUP.md` for how the Markdown agents and rules work.
