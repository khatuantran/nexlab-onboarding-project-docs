# Production Dockerfile for the API service.
# Used by Fly.io (CR-003 / ADR-002) — ~200 MB image on node:20-alpine.
#
# We run via tsx at runtime instead of tsc-compiled output because the
# shared workspace package (`@onboarding/shared`) exports source TS
# directly. tsx 4.x has near-instant startup overhead so the trade-off
# is acceptable for pilot scale.

# ─── Stage 1: install workspace deps ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

# Copy only the lock + manifest files first so this layer caches when
# only source changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable

# Volume mountpoint expected by Fly.io for persistent uploads.
RUN mkdir -p /data/uploads && chown -R node:node /data

# Hoisted node_modules from the deps stage (pnpm symlinks resolve from
# both the workspace root and per-package locations).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Source. shared package loads via tsx at runtime so we keep its src.
COPY --chown=node:node pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY --chown=node:node apps/api ./apps/api
COPY --chown=node:node packages/shared ./packages/shared

USER node

ENV NODE_ENV=production \
    API_PORT=3001 \
    UPLOAD_DIR=/data/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget --quiet --spider http://localhost:3001/api/v1/health || exit 1

# Run from apps/api so Node's --import resolves `tsx` from
# apps/api/node_modules/tsx (pnpm symlinks devDeps per-package, not at
# the workspace root). Also resolves `@onboarding/shared` via the
# workspace symlink at apps/api/node_modules/@onboarding/shared.
WORKDIR /app/apps/api

# tsx loader keeps shared/src/*.ts importable at runtime without a
# separate compile step.
CMD ["node", "--import", "tsx", "src/index.ts"]
