# Architecture Summary

<!-- exempt: registry (no template required) · §4.1 Domain model follows templates/02-data-model-template.md pattern in aggregate form -->

_Last updated: 2026-04-22 · Source of truth for decisions: [ADR-001](adr/ADR-001-tech-stack.md)_

---

## 1. High-level topology

```
             ┌─────────────────────────────────────────┐
             │              Browser                    │
             │   apps/web  (React + Vite + Tailwind)   │
             └──────────────┬──────────────────────────┘
                            │ HTTPS (prod) / http (dev)
                            │ cookie: sid (session)
                            │
             ┌──────────────▼──────────────────────────┐
             │   apps/api   (Express + TS + Zod)       │
             │   - REST /api/v1                        │
             │   - express-session + connect-redis     │
             │   - Drizzle ORM                         │
             └──────┬──────────────────────┬───────────┘
                    │                      │
          ┌─────────▼────────┐   ┌─────────▼────────┐
          │  PostgreSQL 16   │   │    Redis 7       │
          │  - projects      │   │  - sessions      │
          │  - features      │   │  - (rate limit)  │
          │  - sections      │   │  - (future cache)│
          │  - users         │   │                  │
          │  - tsvector FTS  │   │                  │
          └──────────────────┘   └──────────────────┘

External (embed as preview card, no 2-way sync):
   Jira · Figma · GitHub
```

---

## 2. Monorepo layout

```
apps/
  web/               React + Vite + TS
  api/               Express + TS
packages/
  shared/            TS types, Zod schemas (dùng chung FE/BE)
infra/
  docker/            docker-compose.yml, Dockerfile.*
  k8s/               K8s manifests (v2 prep, not wired)
docs/                Human docs (SETUP, CONTRIBUTING)
.specs/              SDD specs (vision, requirements, stories, ADR)
```

Monorepo tool: **pnpm workspaces**. Lý do xem [ADR-001 §2.1](adr/ADR-001-tech-stack.md#21-monorepo--tooling).

---

## 3. Key data flows

### 3.1 Dev mới đọc feature (US-001 — read path)

1. Browser GET `/projects/:slug/features/:slug` → React Router route.
2. Component dùng TanStack Query gọi `GET /api/v1/projects/:slug/features/:slug`.
3. Express: Zod validate params → Drizzle query `features` + `sections` JOIN → JSON response.
4. Web render 5 section theo thứ tự cố định (`business`, `user-flow`, `business-rules`, `tech-notes`, `screenshots`).

### 3.2 BA viết section business (US-002)

1. Form với `react-hook-form + zodResolver` (Zod schema shared).
2. Submit → `PUT /api/v1/features/:id/sections/:type`.
3. Express validate → check session owner → Drizzle upsert section.
4. Client invalidate cache TanStack Query → re-fetch.

### 3.3 Auth

1. `POST /api/v1/auth/login` với email + password.
2. Express: bcrypt compare → tạo session trong Redis (key `sess:xxx`) → set cookie `sid`.
3. Request tiếp theo: middleware đọc cookie → `connect-redis` get session → attach `req.user`.

---

## 4. Environments

| Env     | Dev                                                                                                            | Prod (v1 free-tier per [CR-003](changes/CR-003.md) + [ADR-002](adr/ADR-002-deployment-platform.md)) | Prod (v2 — paid / VPS)         |
| ------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| Web     | Vite dev server :5173                                                                                          | Cloudflare Pages (`*.pages.dev`)                                                                    | Same / custom domain           |
| API     | `tsx watch` :3001                                                                                              | Fly.io shared-cpu-1x@256mb region sin (`onboarding-api.fly.dev`)                                    | Hetzner CX11 €4/mo / K8s       |
| DB      | Docker Compose `postgres:16-alpine`                                                                            | Neon Postgres 0.5GB region sin                                                                      | Aiven / Supabase Pro / managed |
| Redis   | Docker Compose `redis:7-alpine`                                                                                | Upstash Redis 10k cmd/day region ap-southeast-1                                                     | Upstash paid / DO Redis        |
| Uploads | Local FS `./data/uploads`                                                                                      | Fly persistent volume 3GB tại `/data/uploads`                                                       | Cloudflare R2 / S3             |
| Secrets | Per-layer `.env*` files — `infra/docker/.env`, `apps/api/.env`, `apps/web/.env.local` (all gitignored; CR-001) | Platform env vars (Fly secrets, Cloudflare Pages env, GitHub repo secrets)                          | K8s Secret (sealed/SOPS)       |

### 4.2 Deployment topology (v1 free-tier)

```text
                ┌──────────────────────────┐
                │  Cloudflare Pages (FE)   │
                │  React + Vite SPA bundle │
                │  https://*.pages.dev     │
                └────────────┬─────────────┘
                             │  HTTPS, CORS
                             ▼
                ┌──────────────────────────┐
                │  Fly.io (BE)  region=sin │
                │  Express :3001           │
                │  Volume → /data/uploads  │
                │  https://*.fly.dev       │
                └─────┬───────────────┬────┘
                      │               │
                      ▼               ▼
            ┌─────────────────┐  ┌──────────────────┐
            │ Neon Postgres   │  │ Upstash Redis    │
            │ 0.5GB region=sin│  │ 10k cmd/day      │
            └─────────────────┘  └──────────────────┘
```

CI/CD: GitHub Actions deploy BE to Fly on push `main` (`apps/api/**` paths); Cloudflare Pages auto-build FE on push. Migrations run via `fly.toml release_command` before traffic swap.

Chi tiết: [ADR-001 §2.6](adr/ADR-001-tech-stack.md#26-infrastructure) (dev infra), [ADR-002](adr/ADR-002-deployment-platform.md) (prod platform), [CR-003](changes/CR-003.md) (rationale). Setup cục bộ: [docs/SETUP.md](../docs/SETUP.md). Operations: `docs/RUNBOOK.md` (pending).

---

## 4.1 Domain model (ERD)

```
┌─────────────────┐
│ users           │
│─────────────────│
│ id uuid PK      │──┐ created_by, updated_by, uploaded_by
│ email unique    │  │
│ password_hash   │  │
│ display_name    │  │
│ role            │  │    enum: admin | author
│ created_at      │  │
└─────────────────┘  │
                      │
         ┌────────────┘
         │
         ▼ created_by
┌─────────────────┐
│ projects        │
│─────────────────│
│ id uuid PK      │
│ slug unique     │
│ name            │
│ description     │
│ created_by FK   │
│ created_at      │
│ updated_at      │
└─────────┬───────┘
          │ 1:N
          ▼
┌──────────────────────────┐
│ features                 │
│──────────────────────────│
│ id uuid PK               │
│ project_id FK            │
│ slug                     │
│ title                    │
│ search_vector tsvector   │   ← computed: title + sections.body (trigger)
│ created_at               │
│ updated_at               │
│ UNIQUE(project_id, slug) │
└──────────┬───────────────┘
           │ 1:5 (exactly)         ┌─ uploaded_by → users
           ▼                       │
┌─────────────────────────┐   ┌────┴──────────────────┐
│ sections                │   │ uploads               │
│─────────────────────────│   │───────────────────────│
│ id uuid PK              │   │ id uuid PK            │
│ feature_id FK           │   │ feature_id FK         │
│ type                    │   │ uploaded_by FK        │
│ body text ≤ 64 KiB      │   │ mime_type             │
│ updated_by FK (null OK) │   │ size_bytes            │
│ updated_at              │   │ created_at            │
│ UNIQUE(feature_id, type)│   └───────────────────────┘
└─────────────────────────┘          (binary lives on
   (5 rows per feature)               UPLOAD_DIR volume,
                                      not in DB)

sections.type enum: business | user-flow | business-rules | tech-notes | screenshots
```

**Invariants**:

- Mỗi `feature` luôn có đúng 5 `sections` — enforce ở service layer + seed (không DB-level CHECK để migration đơn giản).
- `sections.type` enum cố định 5 giá trị, ref [glossary.md §Section type](glossary.md).
- `features.search_vector` update qua trigger khi `features.title` hoặc `sections.body` đổi. Chi tiết SQL trigger chốt ở [US-001 T3](stories/US-001/tasks.md#t3--db-schema--migration--seed).
- `uploads` row là metadata; file nhị phân nằm ở `UPLOAD_DIR/:featureId/:uploadId.:ext` (mount Docker volume).
- Cascade delete: xoá `feature` → cascade `sections` + `uploads`. Xoá `project` → cascade `features`. Users không cascade (khi xoá user, set `updated_by`/`uploaded_by` = NULL hoặc reject). Decide cụ thể ở T3.

Migrations ở `apps/api/src/db/migrations/` — sinh bằng `drizzle-kit generate` (never hand-edit).

---

## 5. Boundaries (what lives where)

| Concern              | Lives in                                       |
| -------------------- | ---------------------------------------------- |
| Routing (URL → page) | `apps/web/src/routes/`                         |
| Data fetching        | `apps/web/src/queries/` (TanStack Query hooks) |
| UI primitives        | `apps/web/src/components/ui/` (shadcn)         |
| Feature UI           | `apps/web/src/features/<area>/`                |
| Express routes       | `apps/api/src/routes/`                         |
| Business logic       | `apps/api/src/services/`                       |
| DB access            | `apps/api/src/repos/` (Drizzle queries)        |
| Schema               | `apps/api/src/db/schema.ts`                    |
| Migrations           | `apps/api/src/db/migrations/`                  |
| Zod schemas shared   | `packages/shared/src/schemas/`                 |
| TS types shared      | `packages/shared/src/types/`                   |

---

## 6. Cross-cutting

- **Errors**: 4xx/5xx + `{ error: { code, message, details? } }`. Codes là string stable (VD `FEATURE_NOT_FOUND`).
- **Validation**: Zod ở ranh giới API (body, query, params). FE form cũng reuse Zod.
- **Auth**: session cookie `sid`, httpOnly/sameSite=lax, secure trong prod.
- **Logging**: pino JSON → stdout. Log level qua env. Request-id correlation.
- **Tests**: Vitest (unit, FE+BE), Playwright (E2E, 1 smoke per story).

---

## 7. ADR Index

| #                                    | Title                        | Status   |
| ------------------------------------ | ---------------------------- | -------- |
| [ADR-001](adr/ADR-001-tech-stack.md) | Tech Stack Decision (MVP v1) | Accepted |

_(Thêm ADR mới → thêm dòng mới + link.)_

---

## 8. Trade-offs & deferred items (quick reference)

- **K8s prod**: deferred v2. V1 chạy Docker Compose + VPS. Manifests viết dần ở `infra/k8s/`.
- **Search**: Postgres FTS đủ cho ≤ 10k feature. Revisit khi cần.
- **Image storage**: filesystem / Docker volume v1. S3-compatible v2.
- **AI Q&A**: out of scope v1.
- **Real-time collab**: out of scope.
- **SSO / fine-grained RBAC**: out of scope v1.
