# Roadmap

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · Owner: @khatuantran11_

Roadmap này mô tả milestone + target date. **Không phải kế hoạch chi tiết** (đó là story/task). Khi estimate lệch > 1 tuần → update, không âm thầm trượt.

---

## Milestones

### M0 — SDD Scaffold ✅ _(2026-04-22, done)_

- Vision, personas, requirements (9 FRs + 5 NFRs), architecture, ADR-001, glossary, 3 user stories (US-001/002/003), US-001 task breakdown, team docs, traceability, error codes, API surface, risks, roadmap, testing strategy.
- Commit range: `4fb4d27`..(current).
- **Exit criteria**: repo đầy đủ spec artifact, 0 blocker cho start T1, SETUP.md document hoàn chỉnh.

### M1 — US-001 Read path ✅ _(closed 2026-04-23, ahead of 2026-05-31 target)_

Implement US-001 qua 10 task (T1-T10 + T8.5). **Progress: 10/10 done.**

| Task                                                                                                             | Status        | Commit    |
| ---------------------------------------------------------------------------------------------------------------- | ------------- | --------- |
| [T1 Monorepo bootstrap](stories/US-001/tasks.md#t1--monorepo-bootstrap--tooling)                                 | ✅ 2026-04-22 | `10b3a04` |
| [T2 Docker + API skeleton](stories/US-001/tasks.md#t2--docker-compose--api-skeleton)                             | ✅ 2026-04-23 | `829a51a` |
| [T3 Backend infra scaffold (senior BE)](stories/US-001/tasks.md#t3--backend-infrastructure-scaffold-senior-be)   | ✅ 2026-04-23 | `d778093` |
| [T4 Frontend infra scaffold (senior FE)](stories/US-001/tasks.md#t4--frontend-infrastructure-scaffold-senior-fe) | ✅ 2026-04-23 | `c286860` |
| [T5 DB schema + seed](stories/US-001/tasks.md#t5--db-schema--migration--seed)                                    | ✅ 2026-04-23 | `e94af92` |
| [T6 Auth endpoints](stories/US-001/tasks.md#t6--auth-endpoints--session-middleware)                              | ✅ 2026-04-23 | `0b7cd7a` |
| [T7 Read + search API](stories/US-001/tasks.md#t7--read-api--search-api)                                         | ✅ 2026-04-23 | `9af2fe1` |
| [T8 Login page + auth guard](stories/US-001/tasks.md#t8--login-page--auth-guard)                                 | ✅ 2026-04-23 | `5e90753` |
| T8.5 Design system + light/dark theme infra (added mid-M1)                                                       | ✅ 2026-04-23 | `51802c0` |
| [T9 Landing + feature detail](stories/US-001/tasks.md#t9--landing--feature-detail-pages)                         | ✅ 2026-04-23 | `879b15b` |
| [T10 Search + E2E](stories/US-001/tasks.md#t10--search-page--e2e-smoke--setup-validation)                        | ✅ 2026-04-23 | `5ca8e49` |

- **Deliverable**:
  - Docker Compose infra chạy (postgres + redis).
  - Monorepo + lint/test/typecheck gates xanh.
  - Auth login/logout, session Redis.
  - DB schema + migration + seed (1 admin, 1 author, 1 project, 1 feature 5-section).
  - API: `/health`, `/auth/*`, `/projects`, `/projects/:slug`, `/projects/:slug/features/:slug`, `/search`.
  - Web: login page, project landing, feature detail, search page.
  - Playwright smoke E2E cover toàn bộ AC.
- **Exit criteria**: chạy lại [SETUP.md](../docs/SETUP.md) từ fresh clone end-to-end pass 3 smoke checkpoint; tất cả AC của [US-001](stories/US-001.md) có automated test.
- **Effort**: ~34h (tasks estimate, solo + TDD; +8h so với 26h ban đầu vì thêm T3-BE + T4-FE infra scaffold).

### M2 — US-002 + US-003 Author path ✅ _(closed 2026-04-24, ahead of target 2026-06-30)_

Implement US-002 rồi US-003.

- **Deliverable**:
  - Admin tạo project qua UI (US-002).
  - BA tạo feature + edit 3 business sections (US-002).
  - Admin invite user qua `POST /users` (endpoint thôi, UI defer).
  - Tech author edit `tech-notes` + embed card Jira/Figma/GitHub (US-003).
  - Upload ảnh multipart + render inline (US-003).
  - Feature edit page reuse cho cả 2 story.
- **Exit criteria**: 1 project pilot có ≥ 3 feature do BA+Dev author end-to-end (không cần dev mới đọc vội — đó là M3).
- **Effort**: ~20h story-level, ~40h task-level expected.
- **Progress** (US-002, 8 tasks):
  - [T1](stories/US-002/tasks.md#t1--db-role-column--shared-schemas) shared schemas + role column verify — ✅ `e218c8e` (2026-04-23).
  - [T2](stories/US-002/tasks.md#t2--project-create-api--admin-gate) POST /projects API + admin gate — ✅ `23f6c91` (2026-04-23).
  - [T3](stories/US-002/tasks.md#t3--feature-create-api--5-section-init) POST /projects/:slug/features + 5-section atomic init — ✅ `4869a68` (2026-04-23).
  - [T4](stories/US-002/tasks.md#t4--createprojectdialog-fe) CreateProjectDialog FE với admin gate — ✅ `956b959` (2026-04-23).
  - [T5](stories/US-002/tasks.md#t5--section-put-api--413-validation) PUT /features/:id/sections/:type + 64 KiB byte limit — ✅ `ddfb9ab` (2026-04-23).
  - [T6](stories/US-002/tasks.md#t6--createfeaturedialog-fe) CreateFeatureDialog FE với author gate — ✅ `522889c` (2026-04-23).
  - [T7](stories/US-002/tasks.md#t7--sectioneditor-fe--edit-in-place-integration) SectionEditor FE + edit-in-place — ✅ `03c83ba` (2026-04-23).
  - [T8](stories/US-002/tasks.md#t8--e2e-smoke--progress-sync-release-tag) Playwright E2E smoke (happy path create→feature→edit→persist) — ✅ `a482ecd` (2026-04-23). **US-002 Done**.
- **Progress** (US-003, 7 tasks, in progress):
  - [T1](stories/US-003/tasks.md#t1--uploads-migration--shared-schemas) uploads table migration + shared schemas + file-type dep — ✅ `b285b99` (2026-04-24).
  - [T2](stories/US-003/tasks.md#t2--post-uploads-endpoint) POST /features/:id/uploads endpoint (multer + magic-byte sniff) — ✅ `b082416` (2026-04-24).
  - [T3](stories/US-003/tasks.md#t3--get-uploads-id-static-serve) GET /uploads/:id session-protected static serve — ✅ `4690b8e` (2026-04-24); auth gate dropped [BUG-003 `db94afc`](bugs/BUG-003.md) (2026-05-14); **route deleted entirely [CR-004 Phase 2 `7eb3617`](changes/CR-004.md)** (2026-05-14) — Cloudinary CDN serves binaries.
  - [T4](stories/US-003/tasks.md#t4--embed-parser--embedcard-component) embed parser + EmbedCard HTML post-process — ✅ `a262cf3` (2026-04-24).
  - [T5](stories/US-003/tasks.md#t5--sectioneditor-upload-toolbar) SectionEditor upload toolbar + useUpload + cursor insert — ✅ `f75f75a` (2026-04-24).
  - [T6](stories/US-003/tasks.md#t6--section-editable-gate--ownership) Enable 5-section edit + per-section ownership UI — ✅ `dd1c213` (2026-04-24).
  - [T7](stories/US-003/tasks.md#t7--e2e-smoke--progress-sync) Playwright E2E smoke + story close-out — ✅ `c6c57fc` (2026-04-24). **US-003 Done**.
- **M2 closed**: US-002 + US-003 + US-004 all ✅; exit criteria met (1 project pilot với ≥ 3 feature end-to-end covered by E2E).
- **Added mid-milestone + shipped**: [US-004](stories/US-004.md) — project catalog `/` + admin lifecycle (edit + archive). **Done 2026-04-24**, 8/8 tasks + 3 E2E green. Progress:
  - [T1](stories/US-004/tasks.md#t1--schema-migration--shared-schemas) schema migration `archived_at` + shared schemas — ✅ `e9898c7` (2026-04-24).
  - [T2](stories/US-004/tasks.md#t2--get-projects-list-api-loại-archived) GET /projects list API (non-archived, featureCount) — ✅ `2939f56` (2026-04-24).
  - [T3](stories/US-004/tasks.md#t3--project-patch--archive-apis) PATCH + archive endpoints (admin-only, idempotent archive, GET filter) — ✅ `3ae766f` (2026-04-24).
  - [T4](stories/US-004/tasks.md#t4--dropdownmenu-primitive-fe-scaffold) DropdownMenu primitive FE scaffold (`@radix-ui/react-dropdown-menu` wrapper) — ✅ `54b276c` (2026-04-24).
  - [T5](stories/US-004/tasks.md#t5--homepage-catalog-fe) HomePage catalog FE (ProjectRow + 4 states + admin empty CTA) — ✅ `6981c07` (2026-04-24).
  - [T6](stories/US-004/tasks.md#t6--editprojectdialog-fe) EditProjectDialog FE + useUpdateProject (controlled dialog, slug readonly, sonner) — ✅ `c2d7988` (2026-04-24).
  - [T7](stories/US-004/tasks.md#t7--projectactionsmenu-fe--archive-wire) ProjectActionsMenu FE + archive wire (⋯ overflow, useArchiveProject, redirect `/`) — ✅ `904e9c8` (2026-04-24).
  - [T8](stories/US-004/tasks.md#t8--e2e-smoke--progress-sync) Playwright E2E smoke (catalog → edit → archive → redirect) — ✅ `a9282d6` (2026-04-24). **US-004 Done**.

### Post-M2 enhancement — US-007 Admin user lifecycle ✅ _(2026-05-15)_

Promoted M4 candidate "Admin UI quản lý user" thành shipped scope. Full lifecycle: list + filter + invite + edit role + disable/enable + reset password. 7 task. FR-USER-002 mới + FR-AUTH-001 + FR-USER-001 amend.

- [T1](stories/US-007/tasks.md#t1--migration--shared-schemas) Migration `0007_users_lifecycle.sql` + shared schemas — ✅ `b4e8a92`.
- [T2](stories/US-007/tasks.md#t2--get-users-list-extend--get-usersid) GET /users admin shape + GET /users/:id — ✅ `c0c4ede` + `4ea187b`.
- [T3](stories/US-007/tasks.md#t3--post-users-invite--temp-password) POST /users invite + temp password — ✅ `818287e`.
- [T4](stories/US-007/tasks.md#t4--patch-usersid--archive--login-gate) PATCH + archive/unarchive + login gate (USER_DISABLED) + session middleware kick — ✅ `d6af653` + `ae6787d`.
- [T5](stories/US-007/tasks.md#t5--reset-password-endpoint--session-invalidate) Reset password + Redis session purge — ✅ `f4b1af0`.
- [T6](stories/US-007/tasks.md#t6--admin-users-fe-page) FE /admin/users page + 3 dialogs + 5 mutations + AppHeader link — ✅ `da67d63`.
- [T7](stories/US-007/tasks.md#t7--e2e--progress-sync) Playwright `e2e/us-007.spec.ts` + progress sync — ✅ this commit.

**Tests**: 177/177 API + 24 shared + 132 web unit + 2 new E2E scenarios.

### Post-M2 enhancement — US-009 Self-service profile ✅ _(2026-05-15)_

Mọi user tự quản lý hồ sơ: edit displayName, đổi password (other sessions purged), upload avatar Cloudinary. FR-USER-003 mới. 6 task, ~7-9h. Reuse `cloudinary.uploadImage` (CR-004) + `purgeSessionsForUser` (US-007).

- [T1](stories/US-009/tasks.md#t1--migration--shared-schemas) Migration `0009_users_avatar_url.sql` + AuthUser shape extend — ✅ `477a410`.
- [T2](stories/US-009/tasks.md#t2--get--patch-me) GET + PATCH /me (session-userId scoped, no :id URL) — ✅ `477a410`.
- [T3](stories/US-009/tasks.md#t3--password--avatar-endpoints) POST /me/password + POST /me/avatar (bcrypt + purgeSessionsForUserExcept + Cloudinary) — ✅ `477a410`.
- [T4](stories/US-009/tasks.md#t4--mutation-hooks--avatar-component) 4 mutation hooks + Avatar imageUrl prop + lg size — ✅ `ef3b59a`.
- [T5](stories/US-009/tasks.md#t5--profilepage--usermenu-wire) ProfilePage 3 section + UserMenu Hồ sơ enabled — ✅ `ef3b59a`.
- [T6](stories/US-009/tasks.md#t6--e2e--progress-sync) Playwright `e2e/us-009.spec.ts` + progress sync — ✅ this commit.

**Tests**: 203/203 API + 24 shared + 154 web unit + 1 new E2E.

### Post-M2 enhancement — US-008 Admin feature archive ✅ _(2026-05-15)_

Mirror project archive (US-004) cho từng feature trong project. FR-FEAT-001 amend (+3 EARS statements: admin archive, 403 non-admin, idempotent). 6 task, ~5h. Reuse 80% pattern từ US-004.

- [T1](stories/US-008/tasks.md#t1--migration--schema) Migration `0008_features_archived_at.sql` + Drizzle schema — ✅ `02edde1`.
- [T2](stories/US-008/tasks.md#t2--repo--listfeatures-filter) featureRepo.archive + listFeatures filter + findByProjectAndSlug filter — ✅ `02edde1`.
- [T3](stories/US-008/tasks.md#t3--archive-route) POST /projects/:slug/features/:fSlug/archive (admin) — ✅ `02edde1`.
- [T4](stories/US-008/tasks.md#t4--mutation-hook) useArchiveFeature mutation hook — ✅ `a03c345`.
- [T5](stories/US-008/tasks.md#t5--fe-component-wire) FeatureActionsMenu + FeatureCard admin overlay (hide chevron per BUG-004) — ✅ `a03c345`.
- [T6](stories/US-008/tasks.md#t6--e2e--progress-sync) Playwright `e2e/us-008.spec.ts` + progress sync — ✅ this commit.

**Tests**: 184/184 API + 24 shared + 142 web unit + 1 new E2E.

### Post-M2 enhancement — US-005 Search v2 ✅ _(2026-04-25)_

Multi-entity grouped search + filters (project + feature + section + author + upload caption + section-type / author / time / status filters). 10 task / 7 commit.

- [T1](stories/US-005/tasks.md#t1--db-migration-tsvector-projects--uploads) tsvector + GIN cho projects + uploads + caption col — ✅ `d570bd1`.
- [T2 + T3](stories/US-005/tasks.md#t2--searchrepo-multi-entity-rewrite) searchRepo `searchAll` + shared SearchResultsV2 — ✅ `3de57a5`.
- [T4](stories/US-005/tasks.md#t4--search-route-v2-with-filters) route v2 + FE useSearch atomic flip — ✅ `2da1d2e`.
- [T5](stories/US-005/tasks.md#t5--get-users-endpoint--user-list-repo) `GET /users` + userRepo.listUsers — ✅ `df8d877`.
- [T6 + T7 + T8 + T9](stories/US-005/tasks.md#t6--frontend-query-hooks-usesearch-v2--useusers) FilterBar + 4 sub-filters + 5 entity cards + grouped SearchPage — ✅ `a9fbf86`.
- [T10](stories/US-005/tasks.md#t10--tests--e2e--progress-sync) Playwright us-005 + progress sync — ✅ this commit.

### Post-M2 phase — Real-data backfill (mock replacement) 🟡 _(2026-05-16, Sprint 1 ✅ shipped)_

CR-006 v4 UI redesign shipped many surfaces with hardcoded placeholder data because no BE existed yet. Audit (2026-05-16) cataloged 13 mock surfaces; specs landed in `4e5d652` + `ba44036`. Execution sequenced into 5 phases — Phase 1 + 2 are the immediate path; Phase 3-5 are deferred candidates for M3 (pre-pilot) or M4 (post-pilot).

**Spec coverage (13/13)** — see [.specs/stories/US-010.md](stories/US-010.md) + [US-011.md](stories/US-011.md) + [.specs/backlog/](backlog/) BL-001..BL-011.

#### Phase 1 — P0 (build now) — ~8-11h total — ✅ shipped 2026-05-16

Replace the most visible, highest-impact mocks. No dependencies.

- [US-010](stories/US-010.md) Profile enrichment (phone / department / location / bio) — ~3-4h. ✅ shipped `a8b559c..07a32a2`. Migration `0010` + extend PATCH /me + ProfilePage `PersonalInfoCard` + `EditProfileDialog`. Replaces 3 hardcoded `InfoRow` strings.
- [US-011](stories/US-011.md) Real contributors derivation — ~5-7h. ✅ shipped `5816bf8..d436207`. New FR-PROJ-003. Aggregation from `sections.updated_by`; no schema change. Replaces hardcoded contributors on ProjectCard / ProjectHero / FeatureCard + drops ActivityRail `STATIC_PADDING`.

**Outcome**: ProfilePage `PersonalInfoCard` truthful; all contributor avatars across the app are real. **5 of 13 mock surfaces cleared.**

#### Phase 1.5 — Paperwork drift cleanup — ✅ shipped 2026-05-16 (`b41a370`)

US-001 status flipped `Draft` → `Done`. 5 stale traceability rows (FR-AUTH-001 / FR-FEAT-002 / FR-FEAT-003 / FR-EMBED-001 / FR-READ-001 / FR-UPLOAD-001) flipped 🟡 → ✅. NFR-PERF-001 + NFR-A11Y-001 spot-check baseline recorded (re-audit at M3 pilot).

#### Phase 2 — P0 deferred (build after EditFeatureDialog ships) — ~5-7h

- [BL-001](backlog/BL-001.md) Project repo URL + Feature PR URL — needs `EditFeatureDialog` scoped first (no exists today). Schema: 2 nullable text columns. Replaces 2 `placeholderToast` buttons ("Repo" + "Xem PR") with real `<a href target="_blank">`.

#### Phase 3 — P1 batch (after US-011 lands; shared aggregation pattern) — ~15-18h total

This batch reuses the SQL aggregation infrastructure from US-011. Best built together so a single repo-pattern refactor covers all 4.

- [BL-011](backlog/BL-011.md) Workspace stats + `filledSectionCount` (HomePage hero tiles real) — ~4h.
- [BL-003](backlog/BL-003.md) Profile stats aggregation (4-tile card real) — ~3h.
- [BL-004](backlog/BL-004.md) Recent projects card — ~3h.
- [BL-005](backlog/BL-005.md) Activity feed (Profile feed + ActivityRail "Xem tất cả") — ~5-6h.

**Expected outcome**: HomePage hero, full Profile page, and ActivityRail expand are all truthful. Drops 4 more mock surfaces.

#### Phase 4 — P2 nice-to-have (isolated, schedule when capacity allows) — ~17-21h total

- [BL-006](backlog/BL-006.md) Cover image upload (profile + project) — ~3-4h (US-009 avatar pattern).
- [BL-007](backlog/BL-007.md) Watch / follow project + feature — ~5h (`watchers` table + 2 toggle endpoints). Foundational for BL-008.
- [BL-002](backlog/BL-002.md) Profile skills CRUD — ~4-5h (after US-010 ship).
- [BL-010](backlog/BL-010.md) ProjectTabs Activity / Members / Settings panels — ~6-8h (depends BL-005 + US-011, mostly composition).

#### Phase 5 — P3 large features (defer to M4 post-pilot) — ~25-30h total

- [BL-008](backlog/BL-008.md) Notification system + NotificationBell — ~12-16h (table + 4 endpoints + polling FE). Needs BL-007 watchers first.
- [BL-009](backlog/BL-009.md) AdminSettings real wiring — ~10-15h (split into 4-5 sub-stories per panel).

#### Dependency graph (high-level)

```text
US-010 ──────┐
US-011 ──────┼─→ Phase 3 (BL-003/004/005/011 share aggregation infra)
             ├─→ BL-010 Members tab
             └─→ BL-002 (after US-010 sets PATCH /me pattern)

BL-001 ─→ EditFeatureDialog (prereq, scope in BL-001)

BL-007 ─→ BL-008 (watchers define notification audience)
BL-005 ─→ BL-008 (activity events feed notification payload)
         └─→ BL-010 (Activity tab reuses /activity endpoint)

BL-009 — standalone, 4-5 sub-stories independent
BL-006 — standalone (US-009 avatar pattern is the template)
```

#### Triage decisions (user, 2026-05-16)

- Build top 1-2 P0 now; backlog the rest.
- P0 priorities: profile fields ✓, contributors ✓, repo/PR (deferred to Phase 2).
- Phase 3-5 to be re-triaged after Phase 1 + 2 ship, with user signal on which P1 to promote first.

---

### M3 — Pilot launch 🟡 _(target 2026-07-31, free-tier path per [CR-003](changes/CR-003.md) + [ADR-002](adr/ADR-002-deployment-platform.md))_

Deploy lên free-tier managed stack ($0/tháng), pilot với ≥ 1 project thật.

- **Deliverable**:
  - **FE**: Cloudflare Pages auto-build từ `main` → `https://<project>.pages.dev`.
  - **BE**: Fly.io shared-cpu-1x@256mb region sin → `https://onboarding-api-cool-waterfall-8568.fly.dev`. (Persistent volume removed [CR-004 Phase 1 `dbbf195`](changes/CR-004.md), 2026-05-14 — image storage moved to Cloudinary CDN in Phase 2.)
  - **Postgres**: Neon free tier 0.5GB region sin (full Postgres 16, plpgsql + tsvector).
  - **Redis**: Upstash free tier 10k cmd/day region ap-southeast-1 (session store + rate limit).
  - **CI/CD**: GitHub Actions cho BE (`flyctl deploy --remote-only` on push main). Cloudflare Pages auto-build cho FE.
  - **Hardening**: API Dockerfile multi-stage, Neon SSL pooler, Upstash TLS, CORS strict allowlist, cookie secure, db:migrate:prod via `fly.toml release_command`.
  - **Backup**: Neon PITR free 7 days + manual `fly ssh -C "pg_dump"` weekly (defer cron đến v2).
  - **Operations**: `docs/RUNBOOK.md` cover deploy / rollback / logs / restart / secret rotate.
  - Pilot project có ≥ 10 feature với 5 section filled bởi BA+Dev thật.
  - ≥ 3 dev mới onboard qua portal, survey feedback week 2.
- **Exit criteria**: success metric trong [Vision §7](00-vision.md#7-success-metric-placeholder--sẽ-chốt-ở-m3-pilot-launch) được đo + chốt; không vượt free quota nào.
- **Blocker nếu**: bugs P0 từ M1/M2 → fix trước launch; free tier policy đổi unfavorably → fallback Hetzner CX11 €4/mo (xem ADR-002 §6).

### M4 — Post-pilot iteration 🟡 _(target 2026-09-30+)_

Dựa feedback pilot, ưu tiên fix pain points cao nhất. Không commit scope sớm — sẽ viết US mới sau pilot retro.

Candidate items được drop ngày 2026-05-16 (post-CR-006 v4 mock audit triage); sẽ refill sau pilot retro.

---

## v2 backlog (deferred — không trong MVP)

Xem tổng hợp trong [02-requirements.md §Deferred](02-requirements.md#deferred--out-of-scope-v1-documented-to-avoid-churn). Key items:

- SSO (Google/Azure AD).
- K8s production deploy (xem [ADR-001 §2.6](adr/ADR-001-tech-stack.md#26-infrastructure)).
- Advanced search (Meilisearch / Elasticsearch) nếu corpus > 10k feature.
- S3-compatible file storage (nếu upload volume > pilot scale).

---

## Update cadence

- **Weekly** (solo, self-check): review milestone progress, flag slip > 3 ngày.
- **End of milestone**: update status ✅/❌, write lessons-learned 1 đoạn ở cuối milestone section.
- **Mỗi PR lớn**: nếu đổi scope milestone, update roadmap trong cùng commit.
