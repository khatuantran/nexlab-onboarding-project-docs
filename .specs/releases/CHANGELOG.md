# Release notes

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · [Keep-a-Changelog](https://keepachangelog.com/en/1.1.0/) format. BUG-001 fix._

Running log of user-facing changes. Thêm row dưới `[Unreleased]` khi commit ship feature/fix/change. Khi milestone đạt exit criteria → rename block thành `[Mx]` + release date, start new `[Unreleased]`.

Related: [roadmap.md](../roadmap.md), [traceability.md](../traceability.md).

---

## [Unreleased]

### Added

- T7 — Project + feature read endpoints + FTS search (`9af2fe1`).
- T8 — LoginPage + RequireAuth + AppHeader (`5e90753`).
- T8.5 — Design system registry + light/dark theme infra + ThemeToggle (`51802c0`).
- T9 — ProjectLandingPage (card grid) + FeatureDetailPage (sticky TOC + markdown sanitized render) (`879b15b`).
- T10 — SearchPage (`/search?q=&projectSlug=`) + AppHeader persistent SearchInput + FilterChip scope remove + sanitized `<mark>` snippet render + Playwright E2E smoke (US-001 happy path) (`5ca8e49`).

### Changed

- (nothing since M1 snapshot — see Added)

### Deprecated

- (none)

### Removed

- (none)

### Changed

- CR-001 — env layout split into per-layer files: `infra/docker/.env` (compose auto-load), `apps/api/.env.local` (via `dotenv/config`), `apps/web/.env.local` (Vite auto-load). Root `.env.example` removed; `pnpm migrate:env` helper splits legacy setups (`5b186e2`, `518bbfc`, `99a9772`, `42aee6c`, `5b1ec9d`, `bcf8512`).

### Fixed

- BUG-001 — `pnpm docker:*` scripts now load repo-root `.env.local` via `--env-file`; port / credential overrides take effect (`908c37e`). Later superseded by CR-001 layout change.
- CR-001 loader — replace no-op `import "dotenv/config"` with `apps/api/src/env.ts` that resolves `.env.local` via `import.meta.url`. Previous wiring silently fell back to shell env / config defaults; now genuinely reads the file (`cbe56ba`, test `3601fb8`).

### Changed (post-CR-001 amendment)

- CR-001 amendment — rename `apps/api/.env.local` → `apps/api/.env` (prod-style, matches Node/dotenv default). `apps/web` stays on `.env.local` (Vite convention). Code + docs + migrate script updated (`c40b763`, `271dcb8`).

### Security

- (none)

---

## [M0] — 2026-04-22 (SDD Scaffold)

### Added

- Vision, personas, requirements (9 FRs + 5 NFRs), architecture, [ADR-001](../adr/ADR-001-tech-stack.md) tech stack, glossary, 3 user stories, US-001 task breakdown (T1-T10), team conventions docs (BE + FE), traceability matrix, error codes, API surface, risks register, roadmap, testing strategy, SETUP.md, CONTRIBUTING.md, LICENSE, SECURITY.md.

---

## [M1] — in progress (target 2026-05-31)

Tracking progress T1-T10 in [roadmap.md §M1](../roadmap.md#m1--us-001-read-path--in-progress-target-2026-05-31). Current state: **T1-T8 + T8.5 ✅ done** — moves to `[Unreleased]` while M1 is open.

Partial shipped (see `[Unreleased]` above for commit hashes):

- T1 Monorepo + tooling (`10b3a04`)
- T2 Docker Compose + API skeleton (`829a51a`)
- T3 Backend infra scaffold (`d778093`)
- T4 Frontend infra scaffold (`c286860`)
- T5 DB schema + migration + seed + FTS triggers (`e94af92`)
- T6 Auth endpoints + session middleware (`0b7cd7a`)
- SDD workflow additions: UI spec gate (`55c5568`), [ADR-002](../adr/ADR-002-light-dark-theme.md) light+dark (`6e1f414`), design-system.md registry (`e576715`), login UI spec (`7b36577`), bug/CR/backlog/incident/release flow scaffold (this release).

Pending: T9 (landing + feature detail), T10 (search + E2E).

---

## Update rules

- **One entry per user-facing commit** (feat/fix/change). Internal refactors don't need entries unless behavior changes.
- **Link commit hashes** (7 chars) inline.
- **Group by type** per Keep-a-Changelog: Added / Changed / Deprecated / Removed / Fixed / Security.
- **Milestone cutover**: khi milestone exit criteria pass → rename `[Unreleased]` → `[Mx]` + date, move unfinished items to new `[Unreleased]`.
- **Breaking changes**: prefix với `⚠ BREAKING:`.
