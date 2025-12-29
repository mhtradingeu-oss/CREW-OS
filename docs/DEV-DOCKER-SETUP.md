# Dev Docker Setup

This document explains how to launch the backend + database baseline for MH-OS SUPERAPP using Docker Compose.

## Prerequisites
1. Install Docker & Docker Compose (or Docker Desktop with Compose support).
2. From the repo root (`MH-OS-Superapp`), copy the template files:
   ```bash
   cp .env.sample .env
   cp apps/back-end/.env.example apps/back-end/.env
   ```
   Use `.env` for infrastructure defaults (ports, Postgres credentials injected into Docker) and keep application secrets + `DATABASE_URL` in `apps/back-end/.env`.

## Step-by-step commands
1. Build the images:
   ```bash
   docker compose build
   ```
2. Start the database service first so migrations can connect:
   ```bash
   docker compose up db
   ```
3. Once Postgres is ready, start the backend (this also depends on Redis):
   ```bash
   docker compose up backend
   ```
4. Optionally, start the frontend service in a separate terminal:
   ```bash
   docker compose up frontend
   ```
5. To keep services running in the background, add `--detach` (e.g., `docker compose up backend --detach`).

## Database migrations
- Run migrations or push the schema from inside the backend container:
  ```bash
  docker compose run backend npm run prisma migrate dev -- --name init
  ```
  or, if you prefer, `npm run prisma db push`.
- Repeat the command whenever your schema changes.

## Troubleshooting
- **PostgreSQL connection errors**: Confirm `.env` contains the `POSTGRES_*` values used by Docker and that `apps/back-end/.env` references matching credentials (or update both files together).
- **Port conflicts**: The backend binds to `${BACKEND_PORT:-4000}` and the frontend to `${FRONTEND_PORT:-3000}`; stop other services or adjust the port values in `.env`.
- **Missing env values inside containers**: Confirm you copied `.env.sample` to `.env` and that Docker Compose is run from the monorepo root.

## Cleaning up
- To tear down all services and remove volumes:
  ```bash
  docker compose down --volumes
  ```

This setup keeps the backend + database workflow simple: build the image, ensure Postgres is online, run migrations, and then start the backend server. The frontend stays optional so backend work can proceed independently.

## See also
- `docs/DEV-SETUP-CHECKLIST.md` for the full onboarding checklist.
- `docs/DEV-ENVIRONMENT-CLEANUP.md` for wiping caches and maintaining VSCode/Continue hygiene.
- `docs/DEV-CONTINUE-SETUP.md` for Markdown agents and rules guidance.
