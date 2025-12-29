# How to run CI steps locally

To run the same checks as the CI pipeline on your machine:

1. Install dependencies:
   npm ci

2. Typecheck all workspaces:
   npx turbo run typecheck

3. Run all tests (unit + contract):
   npx turbo run test

4. Build all packages:
   npx turbo run build

- All commands are workspace-aware via TurboRepo and npm workspaces.
- No runtime or business logic is changed by the CI pipeline addition.
