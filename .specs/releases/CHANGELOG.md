# Release notes

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · [Keep-a-Changelog](https://keepachangelog.com/en/1.1.0/) format. M1 closed._

Running log of user-facing changes. Thêm row dưới `[Unreleased]` khi commit ship feature/fix/change. Khi milestone đạt exit criteria → rename block thành `[Mx]` + release date, start new `[Unreleased]`.

Related: [roadmap.md](../roadmap.md), [traceability.md](../traceability.md).

---

## [Unreleased]

### Added

- Shared Zod schemas for US-002 create flows: `createProjectRequestSchema`, `createFeatureRequestSchema`, `updateSectionRequestSchema` (US-002 / T1).
- `POST /api/v1/projects` endpoint: admin-only create với 201/409 `PROJECT_SLUG_TAKEN`/400/403 branches (US-002 / T2).
- `POST /api/v1/projects/:slug/features` endpoint: author+ create feature + 5-section atomic init; 201/404/409/401/400 branches (US-002 / T3).
- `CreateProjectDialog` FE: admin-gated dialog trong AppHeader, Radix Dialog + RHF + Zod, auto-derive slug với diacritic strip, 409 inline error, navigate sau 201 (US-002 / T4).
- `PUT /api/v1/features/:featureId/sections/:type` endpoint: 64 KiB byte limit → 413 `SECTION_TOO_LARGE`, feature.updated_at bump, sibling sections stable (US-002 / T5).
- `CreateFeatureDialog` FE: author-gated trigger trên ProjectLandingPage, Radix Dialog + RHF + Zod, slug auto-derive từ tiêu đề, 409 inline error, navigate sau 201 (US-002 / T6).

### Changed

- (none)

### Deprecated

- (none)

### Removed

- (none)

### Fixed

- (none)

### Security

- (none)

---

## [M1] — 2026-04-23 (US-001 Read Path)

US-001 implementation complete — 10/10 tasks + T8.5 mid-milestone design-system addition + SDD workflow extensions (bug/CR/backlog/incident/release scaffolds).

### Added

- T1 — Monorepo bootstrap + tooling (pnpm workspaces, ESLint, Prettier, Vitest, husky) (`10b3a04`).
- T2 — Docker Compose infra + API skeleton + `/health` endpoint (`829a51a`).
- T3 — Backend infrastructure scaffold: Express + Zod boundary validation + error handler + pino logging + Redis client + Drizzle config (`d778093`).
- T4 — Frontend infrastructure scaffold: React + Vite + Tailwind + TanStack Query + react-router + ErrorBoundary (`c286860`).
- T5 — DB schema + Drizzle migrations + seed data (1 admin, 1 author, Demo Project, Login feature with 5 sections) + FTS triggers (`e94af92`).
- T6 — Auth endpoints (`/auth/login`, `/logout`, `/me`) + session middleware (Redis store) + rate limit (`0b7cd7a`).
- T7 — Project + feature read endpoints + FTS search endpoint (`9af2fe1`).
- T8 — LoginPage + RequireAuth guard + AppHeader (`5e90753`).
- T8.5 — Design system registry (12 tokens, typography, icons, components) + light/dark theme infra + ThemeToggle (`51802c0`).
- T9 — ProjectLandingPage (card grid) + FeatureDetailPage (sticky TOC + markdown sanitized render) (`879b15b`).
- T10 — SearchPage (`/search?q=&projectSlug=`) + AppHeader persistent SearchInput + FilterChip scope remove + sanitized `<mark>` snippet render + Playwright E2E smoke (US-001 happy path) (`5ca8e49`).
- SDD workflow extensions: UI spec gate, [ADR-002](../adr/ADR-002-light-dark-theme.md) light+dark theme, design-system.md registry, per-screen UI specs (login, project-landing, feature-detail, search), bug/CR/backlog/incident/release folder scaffold + templates.

### Changed

- CR-001 — env layout split into per-layer files: `infra/docker/.env` (compose auto-load), `apps/api/.env` (via `dotenv` with absolute path anchor), `apps/web/.env.local` (Vite auto-load). Root `.env.example` removed; `pnpm migrate:env` helper splits legacy setups (`5b186e2`, `518bbfc`, `99a9772`, `42aee6c`, `5b1ec9d`, `bcf8512`, `c40b763`, `271dcb8`).

### Fixed

- BUG-001 — `pnpm docker:*` scripts loaded repo-root `.env.local` via `--env-file` so port/credential overrides took effect (`908c37e`). Later superseded by CR-001 layout change which uses compose auto-load.
- CR-001 loader — replaced no-op `import "dotenv/config"` with `apps/api/src/env.ts` that resolves `apps/api/.env` via `import.meta.url`. Previous wiring silently fell back to shell env / config defaults (`cbe56ba`, test `3601fb8`).

---

## [M0] — 2026-04-22 (SDD Scaffold)

### Added

- Vision, personas, requirements (9 FRs + 5 NFRs), architecture, [ADR-001](../adr/ADR-001-tech-stack.md) tech stack, glossary, 3 user stories, US-001 task breakdown (T1-T10), team conventions docs (BE + FE), traceability matrix, error codes, API surface, risks register, roadmap, testing strategy, SETUP.md, CONTRIBUTING.md, LICENSE, SECURITY.md.

---

## Update rules

- **One entry per user-facing commit** (feat/fix/change). Internal refactors don't need entries unless behavior changes.
- **Link commit hashes** (7 chars) inline.
- **Group by type** per Keep-a-Changelog: Added / Changed / Deprecated / Removed / Fixed / Security.
- **Milestone cutover**: khi milestone exit criteria pass → rename `[Unreleased]` → `[Mx]` + date, move unfinished items to new `[Unreleased]`.
- **Breaking changes**: prefix với `⚠ BREAKING:`.
