# Onboarding Doc Portal

Portal nội bộ giúp **dev mới (FE/BE/Fullstack) onboard vào các dự án của công ty mà không cần mentor 1-1**, thông qua **Feature Catalog** chuẩn hóa cho từng project.

## Trạng thái

✅ **M2 closed 2026-04-24** — US-002 + US-003 + US-004 all shipped. M1 complete (US-001 ✅). Nexlab design system adopted (ADR-003). 5/5 Playwright E2E green (US-001 + US-002 + US-003 + US-004 + US-005). 24 shared + 117 api + 127 web unit tests zero regression.

✅ **US-005 Search v2 shipped 2026-04-25** — multi-entity grouped search (projects + features + sections + authors + uploads) with section-type / author / time / status filters. FR-SEARCH-002, FR-SEARCH-003, FR-USER-001 all green.

✅ **US-006 Search v2.1 shipped 2026-05-01** — prefix matching (`q=a` → `A3Solutions`), Vietnamese-accent-insensitive (`dang nhap` ↔ `Đăng nhập`), and trigram fuzzy fallback (`ondoarding` → `onboarding`). Postgres-only via `unaccent` + `pg_trgm` extensions; zero infra cost. FR-SEARCH-004 green; 144/144 api + 24 shared + 128 web + e2e tests green.

✅ **BUG-003 fixed + deployed 2026-05-14** — uploaded images now render in production. FE rewrites relative `/api/v1/uploads/:id` to absolute API origin in markdown; BE serves the binary publicly (UUIDv4 as token, matches FR-PROJ-001 v1 access model). Tests: 132/132 web + 144/144 api green. Shipped to prod via manual `fly deploy --image` (commit `db94afc`).

🟡 **CR-004 Phase 1 shipped 2026-05-14** — Fly `uploads_volume` destroyed to stop $0.26/mo line. Upload route writes to ephemeral container fs (files vanish on machine restart) until Phase 2 wires Cloudinary CDN. Pre-existing 3 volume files (2.7 MB) lost per CR-004 §Decision (none ever rendered on prod per BUG-003).

✅ **CR-004 Phase 2 deployed 2026-05-14** — Upload route streams to Cloudinary CDN via `cloudinary.uploader.upload_stream`; response returns absolute `https://res.cloudinary.com/...` URL. Read route `GET /uploads/:id` removed (now falls through to JSON 404 handler). `CLOUDINARY_URL` Fly secret set; `fly deploy --local-only` released image to fresh machines. 147/147 api tests + 132 web + 24 shared green; smoke verified live.

## Vấn đề đang giải quyết

- Dự án business phức tạp, tài liệu rải rác hoặc không có.
- Dev mới mất nhiều thời gian để hiểu tính năng vì không có nguồn trung tâm, không có template chuẩn.
- BA/PM và senior dev đều bận → mentoring 1-1 không scale.

## Hướng giải quyết (MVP v1)

**Feature Catalog theo project** — mỗi feature có template 5 section cố định:

1. Mô tả nghiệp vụ (`business`)
2. User flow (`user-flow`)
3. Business rules (`business-rules`)
4. Tech notes (`tech-notes`)
5. Screenshots (`screenshots`)

BA/PM viết phần business; dev bổ sung phần tech. Dev mới đọc để hiểu feature trước khi đụng code.

## Phương pháp

**Spec-Driven Development (SDD).** Mọi spec nằm trong [.specs/](.specs/). Xem [CLAUDE.md](CLAUDE.md) để biết quy tắc làm việc với AI; [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) cho human contributor.

## Tech stack

Full decision: [ADR-001](.specs/adr/ADR-001-tech-stack.md). Summary:

- **FE**: React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + TanStack Query
- **BE**: Express 4 + TypeScript + Zod + Drizzle ORM + pino
- **DB**: PostgreSQL 16 (tsvector FTS), Redis 7 (session store)
- **Infra**: Docker Compose (dev + v1 prod on VPS), K8s (deferred v2)
- **Test**: Vitest + @testing-library/react + Supertest + Playwright

## Cấu trúc thư mục

```text
.specs/          Specs (vision, personas, requirements, stories, ADRs, traceability, risks, roadmap)
docs/            Human docs (SETUP, CONTRIBUTING, TESTING)
apps/            (implementation phase) apps/web (React) + apps/api (Express)
packages/        (implementation phase) packages/shared (shared types + Zod)
infra/           (implementation phase) Docker Compose, K8s manifests
```

## Chạy dự án

Sau T1-T4, đã chạy được:

```bash
nvm use                  # picks up .nvmrc → Node 20
corepack enable          # one-time, activates pnpm 9.15
pnpm install
pnpm smoke               # lint + typecheck + 14 tests (5 web + 9 api)

pnpm docker:up           # start postgres:16 + redis:7 (T2)
pnpm dev                 # API :3001 + Web :5173 parallel (T2 + T4)
curl localhost:3001/api/v1/health       # → {status,db,redis,version}
open http://localhost:5173              # → "Onboarding Portal" placeholder
```

Full setup (DB migrate / seed / dev servers / E2E) ở [docs/SETUP.md](docs/SETUP.md) — các mục `🟡` sẽ chuyển `✅` khi task tương ứng xong.

## Tài liệu chính

**Specs (source of truth)**:

- [Vision](.specs/00-vision.md) — tại sao xây, phục vụ ai, goals/non-goals
- [Personas](.specs/01-personas.md) — user profile chi tiết (Minh / Lan / Hùng)
- [Requirements](.specs/02-requirements.md) — 9 FRs (EARS) + 5 NFRs
- [Architecture](.specs/03-architecture.md) — topology, data flow, ERD
- [Glossary](.specs/glossary.md) — thuật ngữ nội bộ
- [ADR-001](.specs/adr/ADR-001-tech-stack.md) — tech stack decision
- [Roadmap](.specs/roadmap.md) — milestone plan
- [Traceability](.specs/traceability.md) — FR ↔ US ↔ Task matrix
- [Error codes](.specs/error-codes.md) — registry
- [API surface](.specs/api-surface.md) — endpoint catalog
- [Risks](.specs/risks.md) — register

**Stories**:

- [US-001 — Dev reads & search feature catalog](.specs/stories/US-001.md) + [tasks](.specs/stories/US-001/tasks.md)
- [US-002 — BA creates project + feature with business sections](.specs/stories/US-002.md) + [tasks](.specs/stories/US-002/tasks.md) — **Done** (8/8 ✅, 2026-04-23)
- [US-003 — Dev adds tech-notes + screenshots](.specs/stories/US-003.md) + [tasks](.specs/stories/US-003/tasks.md) — **Done** (7/7 ✅, 2026-04-24)
- [US-004 — Project catalog + admin lifecycle](.specs/stories/US-004.md) + [tasks](.specs/stories/US-004/tasks.md) — **Done** (8/8 ✅, 2026-04-24)
- [US-005 — Search v2 multi-entity + filters](.specs/stories/US-005.md) + [tasks](.specs/stories/US-005/tasks.md) — **Done** (10/10 ✅, 2026-04-25)
- [US-006 — Search v2.1 prefix + accent-insensitive + fuzzy](.specs/stories/US-006.md) + [tasks](.specs/stories/US-006/tasks.md) — **Done** (5/5 ✅, 2026-05-01)

**Operational**:

- [SETUP](docs/SETUP.md) — local setup (target state)
- [CONTRIBUTING](docs/CONTRIBUTING.md) — branch, commit, PR flow
- [TESTING](docs/TESTING.md) — test strategy
- [CLAUDE.md](CLAUDE.md) — SDD rules for AI
- [SECURITY.md](SECURITY.md) — security posture
- [LICENSE](LICENSE) — proprietary, all rights reserved
