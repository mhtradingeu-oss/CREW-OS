# syntax=docker/dockerfile:1.5

ARG NEXT_PUBLIC_API_URL="http://localhost:41000/api/v1"

###############################################
# 1) deps — install workspace dependencies
###############################################
FROM node:20-bullseye-slim AS deps
ARG NEXT_PUBLIC_API_URL
WORKDIR /app

RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set progress false

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# root manifests
COPY package.json package-lock.json tsconfig.base.json turbo.json ./

# shared
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/

# frontend manifests
COPY apps/front-end/package.json ./apps/front-end/
COPY apps/front-end/tsconfig.json ./apps/front-end/
COPY apps/front-end/next.config.mjs ./apps/front-end/
COPY apps/front-end/postcss.config.cjs ./apps/front-end/
COPY apps/front-end/tailwind.config.cjs ./apps/front-end/

# install once for monorepo
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --progress=false


###############################################
# 2) builder — build shared then frontend
###############################################
FROM node:20-bullseye-slim AS builder
ARG NEXT_PUBLIC_API_URL
WORKDIR /app

ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app /app

# copy full repo
COPY . .

# build shared first
RUN npm run build --workspace=@mh-os/shared

# validate shared built
RUN test -d "/app/packages/shared/dist" \
    || (echo '❌ Shared build missing inside Docker runtime' && exit 1)

# build frontend
RUN npm run build --workspace=mh-os-admin

# prune dev deps for runtime
RUN npm prune --omit=dev


###############################################
# 3) runtime — clean lightweight image
###############################################
FROM node:20-bullseye-slim AS runner
ARG NEXT_PUBLIC_API_URL
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PATH="/app/node_modules/.bin:$PATH"
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/shared /app/packages/shared
COPY --from=builder /app/apps/front-end /app/apps/front-end

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=mh-os-admin"]
