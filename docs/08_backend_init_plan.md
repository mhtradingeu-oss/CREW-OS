# Back-end Init Plan

The core plan is captured in `archive_old/archive_old/08_backend_init_plan.md`. The current repository maintains a Node.js + TypeScript + Prisma backend inside `apps/back-end` with modular OS services, so any future initialization work should reuse that document.

## Local Docker environment
- The backend service loads `apps/back-end/.env` for local runs. Copy `apps/back-end/.env.example` to `apps/back-end/.env` and update `DATABASE_URL`, `JWT_SECRET`, and other values before you start Docker Compose.
- When Docker Compose runs the backend, it reads both `.env` (infra defaults) and `apps/back-end/.env` (application secrets). `DATABASE_URL` is overridden inside the compose file to point at the `db` service, while the rest of the backend secrets come from `apps/back-end/.env`.
- Refer to `docs/DEV-DOCKER-SETUP.md` for the exact commands (build, start services, run migrations) needed after the initial setup.
