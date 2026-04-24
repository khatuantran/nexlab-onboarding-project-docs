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

### M2 — US-002 + US-003 Author path 🟡 _(target 2026-06-30, US-002 ✅ / US-003 pending)_

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
- **Next in M2**: US-003 (tech author + embed + upload) → flip M2 status ✅ khi US-003 ship.
- **Added mid-milestone**: [US-004](stories/US-004.md) — project catalog `/` + admin lifecycle (edit + archive). Ready với 8-task breakdown + 3 UI specs + FR-PROJ-002. Progress:
  - [T1](stories/US-004/tasks.md#t1--schema-migration--shared-schemas) schema migration `archived_at` + shared schemas — ✅ `e9898c7` (2026-04-24).
  - [T2](stories/US-004/tasks.md#t2--get-projects-list-api-loại-archived) GET /projects list API (non-archived, featureCount) — ✅ `2939f56` (2026-04-24).

### M3 — Pilot launch 🟡 _(target 2026-07-31)_

Deploy lên VPS + pilot với 1 project thật.

- **Deliverable**:
  - VPS (DO Droplet / Hetzner) chạy Docker Compose prod config.
  - Nginx reverse proxy + Let's Encrypt cert.
  - Managed Postgres + Redis (hoặc self-host).
  - Manual `pg_dump` cron weekly (NFR-DATA-001).
  - Pilot project có ≥ 10 feature với 5 section filled bởi BA+Dev thật.
  - ≥ 3 dev mới onboard qua portal, survey feedback week 2.
- **Exit criteria**: success metric trong [Vision §7](00-vision.md#7-success-metric-placeholder--sẽ-chốt-ở-m3-pilot-launch) được đo + chốt.
- **Blocker nếu**: bugs P0 từ M1/M2 → fix trước launch.

### M4 — Post-pilot iteration 🟡 _(target 2026-09-30+)_

Dựa feedback pilot, ưu tiên fix pain points cao nhất. Không commit scope sớm — sẽ viết US mới sau pilot retro.

Candidate items (có thể):

- Admin UI quản lý user (list, disable, reset password).
- Role-based permissions cứng (nếu pilot thấy cần).
- Search filter per-project / per-section.
- Markdown editor upgrade (WYSIWYG, image drag-drop).
- Draft/publish state cho section.

---

## v2 backlog (deferred — không trong MVP)

Xem tổng hợp trong [02-requirements.md §Deferred](02-requirements.md#deferred--out-of-scope-v1-documented-to-avoid-churn). Key items:

- AI Q&A / RAG trên catalog.
- Real-time collab editing.
- Versioning / diff / comment / approval workflow.
- SSO (Google/Azure AD).
- 2-way sync Jira / Figma / GitHub.
- Native mobile app.
- K8s production deploy (xem [ADR-001 §2.6](adr/ADR-001-tech-stack.md#26-infrastructure)).
- Advanced search (Meilisearch / Elasticsearch) nếu corpus > 10k feature.
- S3-compatible file storage (nếu upload volume > pilot scale).

---

## Update cadence

- **Weekly** (solo, self-check): review milestone progress, flag slip > 3 ngày.
- **End of milestone**: update status ✅/❌, write lessons-learned 1 đoạn ở cuối milestone section.
- **Mỗi PR lớn**: nếu đổi scope milestone, update roadmap trong cùng commit.
