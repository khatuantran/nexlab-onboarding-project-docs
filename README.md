# Onboarding Doc Portal

Portal nội bộ giúp **dev mới (FE/BE/Fullstack) onboard vào các dự án của công ty mà không cần mentor 1-1**, thông qua **Feature Catalog** chuẩn hóa cho từng project.

## Trạng thái

🚧 **Pre-MVP — Implementation phase (M1).** Progress: **T8.5/10 done** — LoginPage + RequireAuth + AppHeader + **light/dark theme infra** (ThemeToggle, CSS var tokens, system listener). UX spec gate + design-system registry added to SDD workflow. Next: [T9 — Project landing + feature detail pages](.specs/stories/US-001/tasks.md#t9--landing--feature-detail-pages).

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
- [US-002 — BA creates project + feature with business sections](.specs/stories/US-002.md)
- [US-003 — Dev adds tech-notes + screenshots](.specs/stories/US-003.md)

**Operational**:

- [SETUP](docs/SETUP.md) — local setup (target state)
- [CONTRIBUTING](docs/CONTRIBUTING.md) — branch, commit, PR flow
- [TESTING](docs/TESTING.md) — test strategy
- [CLAUDE.md](CLAUDE.md) — SDD rules for AI
- [SECURITY.md](SECURITY.md) — security posture
- [LICENSE](LICENSE) — proprietary, all rights reserved
