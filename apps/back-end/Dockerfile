# syntax=docker/dockerfile:1.5

###############################################
# 1) deps — install workspace dependencies
###############################################
FROM node:20-bullseye-slim AS deps
WORKDIR /app

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set progress false

COPY package.json package-lock.json tsconfig.base.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/back-end/package.json ./apps/back-end/
COPY apps/back-end/tsconfig.json ./apps/back-end/
COPY apps/back-end/prisma ./apps/back-end/prisma/

RUN --mount=type=cache,target=/root/.npm \
  npm ci --legacy-peer-deps --no-audit --progress=false


###############################################
# 2) builder — build shared then backend
###############################################
FROM node:20-bullseye-slim AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"

COPY --from=deps /app /app
COPY . .

RUN npm run build --workspace=@mh-os/shared
RUN test -d "/app/packages/shared/dist" \
  || (echo '❌ @mh-os/shared build missing inside Docker image' && exit 1)

RUN npm run build --workspace=mh-os-superapp-backend

RUN npm prune --omit=dev


###############################################
# 3) runner — production runtime
###############################################
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/back-end/dist ./apps/back-end/dist
COPY --from=builder /app/apps/back-end/prisma ./apps/back-end/prisma

EXPOSE 4000

CMD ["node", "apps/back-end/dist/server.js"]
