# Architecture Summary

*Last updated: 2026-04-22 · Source of truth for decisions: [ADR-001](adr/ADR-001-tech-stack.md)*

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

| Env | Dev | Prod (v1) | Prod (v2) |
|---|---|---|---|
| Web | Vite dev server :5173 | Static build served qua Nginx | Ingress + static bucket |
| API | `tsx watch` :3001 | Node 20 container + PM2 (hoặc systemd) | Node container trong K8s |
| DB | Docker Compose `postgres:16-alpine` | Managed Postgres (Neon/DO) | Managed hoặc in-cluster |
| Redis | Docker Compose `redis:7-alpine` | Managed Redis hoặc container | In-cluster |
| Secrets | `.env.local` (gitignored) | Platform env vars | K8s Secret (sealed/SOPS) |

Chi tiết: [ADR-001 §2.6](adr/ADR-001-tech-stack.md#26-infrastructure). Setup cục bộ: [docs/SETUP.md](../docs/SETUP.md).

---

## 5. Boundaries (what lives where)

| Concern | Lives in |
|---|---|
| Routing (URL → page) | `apps/web/src/routes/` |
| Data fetching | `apps/web/src/queries/` (TanStack Query hooks) |
| UI primitives | `apps/web/src/components/ui/` (shadcn) |
| Feature UI | `apps/web/src/features/<area>/` |
| Express routes | `apps/api/src/routes/` |
| Business logic | `apps/api/src/services/` |
| DB access | `apps/api/src/repos/` (Drizzle queries) |
| Schema | `apps/api/src/db/schema.ts` |
| Migrations | `apps/api/src/db/migrations/` |
| Zod schemas shared | `packages/shared/src/schemas/` |
| TS types shared | `packages/shared/src/types/` |

---

## 6. Cross-cutting

- **Errors**: 4xx/5xx + `{ error: { code, message, details? } }`. Codes là string stable (VD `FEATURE_NOT_FOUND`).
- **Validation**: Zod ở ranh giới API (body, query, params). FE form cũng reuse Zod.
- **Auth**: session cookie `sid`, httpOnly/sameSite=lax, secure trong prod.
- **Logging**: pino JSON → stdout. Log level qua env. Request-id correlation.
- **Tests**: Vitest (unit, FE+BE), Playwright (E2E, 1 smoke per story).

---

## 7. ADR Index

| # | Title | Status |
|---|---|---|
| [ADR-001](adr/ADR-001-tech-stack.md) | Tech Stack Decision (MVP v1) | Accepted |

*(Thêm ADR mới → thêm dòng mới + link.)*

---

## 8. Trade-offs & deferred items (quick reference)

- **K8s prod**: deferred v2. V1 chạy Docker Compose + VPS. Manifests viết dần ở `infra/k8s/`.
- **Search**: Postgres FTS đủ cho ≤ 10k feature. Revisit khi cần.
- **Image storage**: filesystem / Docker volume v1. S3-compatible v2.
- **AI Q&A**: out of scope v1.
- **Real-time collab**: out of scope.
- **SSO / fine-grained RBAC**: out of scope v1.
