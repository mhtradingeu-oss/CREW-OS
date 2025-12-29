# Dev Setup Checklist

1. **Prerequisites**
   1. Install Node.js ≥ 20.0.0 (see `package.json` engines).
   2. Ensure npm ≥ 10.1.0 (the repo uses the npm workspace protocol).
   3. Install Docker + Docker Compose (or Docker Desktop with Compose support).
   4. Install Git.

2. **Clone & open**
   1. `git clone <repo-url>` (use your fork or upstream) and `cd MH-OS-Superapp`.
   2. Open the **MH-OS-Superapp** folder in VSCode as a single-root workspace (no multi-root setup).

3. **Install dependencies**
   1. At the repo root: `npm install`.
   2. Inside `apps/back-end`: `npm install`.
   3. Inside `apps/front-end`: `npm install`.

4. **Environment files**
   1. Copy `cp .env.sample .env` (if `.env` does not already exist) and adjust infra values such as ports or Postgres credentials used by Docker.
   2. Copy `cp apps/back-end/.env.example apps/back-end/.env` and set `DATABASE_URL`, `JWT_SECRET`, and admin credentials for your local backend runs (defaults point to the Postgres container via `localhost`).

5. **Docker & database**
   1. Follow `docs/DEV-DOCKER-SETUP.md` for full details.
   2. Run `docker compose up -d db`.
   3. Run `docker compose up -d backend`.
   4. Optionally: `docker compose up -d frontend`.

6. **Prisma migration**
   1. `docker compose exec backend npx prisma db push` (or `npm run prisma migrate dev` if you prefer named migrations).

7. **Basic health checks**
   1. `curl http://localhost:${BACKEND_PORT:-4000}/health` or open the backend URL in a browser.
   2. Optionally open the frontend at `http://localhost:${FRONTEND_PORT:-3000}`.

8. **Continue**
   1. Read `docs/DEV-CONTINUE-SETUP.md` to understand the Markdown agent prompts and rules.
   2. Use Continue from inside the MH-OS-Superapp root so it detects a single workspace.

## See also
- `docs/DEV-DOCKER-SETUP.md` for Docker Compose commands.
- `docs/DEV-ENVIRONMENT-CLEANUP.md` for cleaning local artifacts and workspace hygiene.
- `docs/DEV-CONTINUE-SETUP.md` for agent/rule usage.
