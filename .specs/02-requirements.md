# Functional & Non-functional Requirements

<!-- templates: 01-functional-requirements-template.md@0.1, 01-non-functional-requirements-template.md@0.1 -->

_Last updated: 2026-04-22 · Source of truth for MVP v1 scope. FRs drive user stories & task breakdowns._

---

## Format — EARS

Mỗi FR viết theo EARS (Easy Approach to Requirements Syntax):

| Dạng         | Template                                                  |
| ------------ | --------------------------------------------------------- |
| Ubiquitous   | `The <system> shall <response>.`                          |
| Event-driven | `When <event>, the <system> shall <response>.`            |
| State-driven | `While <state>, the <system> shall <response>.`           |
| Optional     | `Where <feature present>, the <system> shall <response>.` |
| Unwanted     | `If <trigger>, then the <system> shall <response>.`       |
| Complex      | Kết hợp các dạng trên.                                    |

Mỗi FR có:

- **ID** (`FR-<AREA>-NNN`)
- **Statement** (EARS)
- **Rationale** (1-2 câu)
- **Maps to** (US-xxx, persona)
- **Acceptance hints** (tín hiệu để viết test, không phải full acceptance criteria)

---

## FR Summary Table

| ID                                                            | Area    | Summary                                       | Priority | Maps to                |
| ------------------------------------------------------------- | ------- | --------------------------------------------- | -------- | ---------------------- |
| [FR-AUTH-001](#fr-auth-001--emailpassword-auth)               | Auth    | Email + password login/logout, session cookie | P0       | US-001, US-002, US-003 |
| [FR-PROJ-001](#fr-proj-001--project-crud-minimal)             | Project | Admin tạo project + liệt kê                   | P0       | US-002                 |
| [FR-FEAT-001](#fr-feat-001--feature-crud-within-project)      | Feature | Tạo / sửa / list feature trong project        | P0       | US-002                 |
| [FR-FEAT-002](#fr-feat-002--5-section-template)               | Feature | Feature có template cố định 5 section         | P0       | US-001, US-002, US-003 |
| [FR-FEAT-003](#fr-feat-003--per-section-multi-author)         | Feature | Multi-author theo từng section                | P0       | US-002, US-003         |
| [FR-EMBED-001](#fr-embed-001--external-link-embed)            | Embed   | Paste Jira/Figma/GitHub URL → preview card    | P0       | US-003                 |
| [FR-SEARCH-001](#fr-search-001--full-text-search)             | Search  | FTS feature theo title + section content      | P0       | US-001                 |
| [FR-READ-001](#fr-read-001--project-landing--feature-index)   | Read    | Project landing page có feature index         | P0       | US-001                 |
| [FR-UPLOAD-001](#fr-upload-001--image-upload-for-screenshots) | Upload  | Upload image file → volume, trả stable URL    | P0       | US-003                 |

Priority: **P0** = must-have v1. P1/P2 deferred sẽ list ở cuối file.

---

## FR-AUTH-001 — Email/password auth

**Statement (Event-driven + Unwanted):**

- When an authenticated user is not present and the user submits valid email and password to the login endpoint, the system shall create a server-side session in Redis and set an httpOnly cookie `sid`.
- If the submitted credentials are invalid, then the system shall respond with HTTP 401 and error code `INVALID_CREDENTIALS` without revealing whether the email exists.
- When the user invokes logout, the system shall destroy the session in Redis and clear the `sid` cookie.
- When a user with role `admin` submits a user-creation request with a unique email, the system shall create the user with a temporary password and return the credential payload once (no email send in v1).

**Rationale**: Auth là prerequisite cho mọi route còn lại. Session server-side (Redis) cho phép revoke tức thì, phù hợp internal portal. V1 **không có self-register** — giảm attack surface cho internal portal; user đầu được seed (admin), admin invite user khác.

**Maps to**: US-001 (Minh login → read), US-002 (Lan login → author), US-003 (Hùng login → author). Personas: P1, P2, P3.

**Acceptance hints**:

- Valid login → 200 + set cookie `sid`; subsequent request có `req.user`.
- Wrong password → 401 `INVALID_CREDENTIALS`.
- Wrong email → 401 `INVALID_CREDENTIALS` (không 404, để tránh user enumeration).
- Logout → 204 + cookie cleared.
- Password hash dùng bcryptjs (cost factor ≥ 10).
- **User creation**: `POST /api/v1/users` admin-only; body `{ email, displayName, role }`; response `{ data: { user, temporaryPassword } }` trả 1 lần (không store plain). Seed script tạo 1 admin (`admin@local` / `dev12345`).
- **Không có endpoint self-register**: `POST /api/v1/auth/register` không tồn tại v1.
- Session TTL default 7 ngày sliding; cookie `maxAge` refresh mỗi request authenticated.

---

## FR-PROJ-001 — Project CRUD (minimal)

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user with role `admin` submits a project creation request with a unique slug and a human-readable name, the system shall persist the project and return its canonical URL.
- The system shall expose a list endpoint that returns all non-archived projects to any authenticated user, sorted by most-recently-updated first.

**Rationale**: Project là container top-level. V1 cần create + list. Edit + archive tách ra FR-PROJ-002 (lifecycle management). **Access model**: mọi authenticated user đọc/ghi feature + section trong mọi project; chỉ `admin` mới tạo/edit/archive project. Không có membership table v1 (xem Open Q1 resolved bên dưới).

**Maps to**: US-002 (Lan cần project trước khi tạo feature). US-004 (dev/admin xem catalog). Persona: Admin (minimal, v1).

**Acceptance hints**:

- Slug unique, lowercase, kebab-case, 3-60 chars (Zod regex).
- Non-admin POST → 403 `FORBIDDEN`.
- Duplicate slug → 409 `PROJECT_SLUG_TAKEN`.
- List endpoint trả `{ data: Project[] }`; rỗng khi chưa có project (không error).
- List endpoint **loại** project có `archived_at IS NOT NULL` (soft-delete, xem FR-PROJ-002).

---

## FR-PROJ-002 — Project metadata edit + archive

**Statement (Event-driven + Unwanted):**

- When an authenticated user with role `admin` submits a project edit request (name / description) for an existing project, the system shall update the metadata and bump `updated_at`.
- When an authenticated user with role `admin` submits a project archive request, the system shall set `archived_at = NOW()` and exclude the project from subsequent list responses.
- If a non-admin user attempts either operation, the system shall respond with HTTP 403 `FORBIDDEN`.
- If the target project does not exist, the system shall respond with HTTP 404 `PROJECT_NOT_FOUND`.

**Rationale**: Project lifecycle management. Admin cần đổi name/description khi scope project clarify (VD "Pilot" → "Onboarding Pilot Q2") hoặc archive project kết thúc để clean catalog. Archive là **soft-delete** (data preserved) — recover v2, không scope v1. Slug immutable sau create để link không break.

**Maps to**: US-004 (admin manage lifecycle). Persona: Admin.

**Acceptance hints**:

- Slug **không** edit được — immutable post-create (để internal links + bookmarks không break).
- Name 1-120 chars, description 0-1000 chars (same constraints với create).
- Archive là soft-delete: UPDATE `archived_at = NOW()`, không DELETE. Features + sections giữ nguyên.
- Archived project:
  - KHÔNG xuất hiện trong `GET /projects` catalog.
  - Direct URL `/projects/:slug` return 404 `PROJECT_NOT_FOUND` (không leak tồn tại).
  - Search `GET /search` skip archived projects trong scope.
- Hard delete + recovery defer v2.

---

## FR-FEAT-001 — Feature CRUD within project

**Statement (Event-driven + Unwanted):**

- When an authenticated user submits a feature creation request scoped to an existing project with a unique slug within that project and a human-readable title, the system shall persist the feature with all 5 sections initialized as empty drafts.
- If the target project does not exist or the user lacks access to it, then the system shall respond with HTTP 404 `PROJECT_NOT_FOUND` (không leak project tồn tại).
- When an authenticated user edits a feature's title or slug, the system shall update it and invalidate any cached feature responses for that project.

**Rationale**: Feature là đơn vị onboarding chính. Tạo feature = tạo khung 5 section rỗng để author không bị "blank page paralysis".

**Maps to**: US-002 (Lan tạo feature mới). Persona: P2 (BA/PM).

**Acceptance hints**:

- Slug unique trong cùng project, không bắt unique cross-project.
- 5 section rows tạo đồng thời trong 1 transaction (atomic).
- Edit title → feature `updated_at` refresh → landing page reorders.

---

## FR-FEAT-002 — 5-section template

**Statement (Ubiquitous):**

- The system shall represent each feature with exactly 5 sections identified by the types `business`, `user-flow`, `business-rules`, `tech-notes`, `screenshots`, rendered in that fixed order on the read view.
- The system shall allow each section's body to be stored as markdown text up to 64 KiB, with `screenshots` additionally supporting embedded image references.

**Rationale**: Template cố định = consistency khi onboard. Dev mới biết chính xác tìm gì ở đâu (đọc story P1 Minh). Markdown đủ rich cho MVP, không cần WYSIWYG phức tạp.

**Maps to**: US-001 (Minh đọc 5 section), US-002 (Lan fill business), US-003 (Hùng fill tech). Personas: P1, P2, P3.

**Acceptance hints**:

- API trả sections array theo đúng thứ tự `[business, user-flow, business-rules, tech-notes, screenshots]` kể cả khi empty.
- Section type ngoài 5 enum → 400 `INVALID_SECTION_TYPE`.
- Body > 64 KiB → 413 `SECTION_TOO_LARGE`.
- Empty section render placeholder ("Chưa có nội dung") thay vì hidden — để reader thấy rõ gaps.
- `screenshots` section body là markdown chuẩn; image reference qua URL nội bộ `/uploads/:id` (xem FR-UPLOAD-001) hoặc external URL cũng được chấp nhận.

---

## FR-FEAT-003 — Per-section multi-author

**Statement (Event-driven):**

- When an authenticated user submits an update to a specific section of a feature, the system shall apply the change to that section only, record the `updated_by` user ID and `updated_at` timestamp on that section, and leave other sections of the same feature unchanged.

**Rationale**: BA viết business, Dev viết tech, cả hai cùng edit 1 feature nhưng không đè lên nhau (tương đương "field-level ownership" thô sơ, không cần locking). V1 không có role check cứng — bất kỳ authenticated user nào cũng edit được, track ai edit gì để audit.

**Maps to**: US-002 (Lan edit 3 business sections), US-003 (Hùng edit tech-notes cùng feature). Personas: P2, P3.

**Acceptance hints**:

- PUT `/api/v1/features/:id/sections/:type` chỉ update 1 row sections.
- `updated_by` = session user id; `updated_at` = server time.
- Concurrent edit 2 section khác nhau: cả 2 thành công (last-write-wins per section, không per feature).
- Concurrent edit cùng 1 section: last-write-wins (v1 không có optimistic lock — trade-off documented).

---

## FR-EMBED-001 — External link embed

**Statement (Event-driven):**

- When a user includes a URL matching the Jira, Figma, or GitHub host patterns inside any section body, the read view shall render that URL as a preview card showing the service icon, a shortened URL label, and the origin domain.
- The system shall not fetch metadata from the external service in v1; card content is derived client-side from the URL string alone.

**Rationale**: Tôn trọng tools hiện hữu (Jira/Figma/GitHub là nguồn sự thật) mà không cần 2-way sync hay oAuth setup cho MVP. Client-side detect = zero server complexity + zero rate limit issue.

**Maps to**: US-003 (Hùng paste link GitHub PR vào tech-notes). Persona: P3, indirectly P2.

**Acceptance hints**:

- Host pattern whitelist: `*.atlassian.net`, `figma.com`, `github.com` (chỉ 3 domain cho v1).
- URL khác whitelist → render plain link (không card).
- Card clickable, `target="_blank" rel="noopener noreferrer"`.
- v2 sẽ thay bằng oEmbed/OG fetch server-side — interface client nên abstract.

---

## FR-SEARCH-001 — Full-text search

**Statement (Event-driven):**

- When an authenticated user submits a non-empty search query, the system shall return up to 20 features ranked by Postgres `ts_rank` against a `tsvector` derived from feature title plus all 5 section bodies, scoped optionally by project.
- The system shall respond within 500 ms p95 for corpora up to 10,000 features.

**Rationale**: Search = hit rate của onboarding portal (Minh gõ "login" → thấy feature "Đăng nhập bằng email"). Postgres FTS đủ cho scale v1 (20-100 dev, 3-10 project). Revisit threshold: > 10k feature hoặc > 500ms p95 (xem ADR-001 §6).

**Maps to**: US-001 (Minh tìm feature theo keyword). Persona: P1.

**Acceptance hints**:

- Empty query → 400 `SEARCH_QUERY_EMPTY` (không trả full list).
- Query length > 200 chars → 400 `SEARCH_QUERY_TOO_LONG`.
- Result item: `{ featureId, projectSlug, featureSlug, title, snippet, rank }`.
- Snippet highlight dùng `ts_headline`, 160-200 chars, escape HTML.
- `tsvector` column tự update qua generated column hoặc trigger (chốt ở task).

---

## FR-READ-001 — Project landing + feature index

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user visits a project's landing URL, the system shall render the project name, description, and a list of all features in that project sorted by most-recently-updated first.
- The system shall display for each listed feature: title, slug, last-updated timestamp (relative, e.g. "2h ago"), and a visual indicator of how many of the 5 sections are non-empty.

**Rationale**: Landing page = entry point cho Minh onboard. "Updated first" giúp thấy ngay feature vừa được BA/Dev touch. Section-filled indicator cảnh báo feature "chưa hoàn chỉnh" trước khi Minh phí thời gian đọc.

**Maps to**: US-001 (Minh landing → click feature). Persona: P1.

**Acceptance hints**:

- Response time < 300ms cho project ≤ 500 feature.
- Empty project → render "Chưa có feature nào" + CTA cho author (hiện CTA kể cả Minh để đơn giản v1).
- Section-filled indicator: "3/5 sections filled" kèm dấu chấm xanh/xám.

---

## FR-UPLOAD-001 — Image upload for screenshots

**Statement (Event-driven + Unwanted):**

- When an authenticated user uploads an image file (MIME type `image/png`, `image/jpeg`, or `image/webp`, size ≤ 5 MiB) scoped to an existing feature, the system shall persist the file to the server-side upload volume, associate it with the feature, and respond with a stable URL of the form `/uploads/:id`.
- If the upload exceeds 5 MiB, then the system shall respond with HTTP 413 and error code `FILE_TOO_LARGE` without persisting the partial payload.
- If the upload MIME type is outside the allow-list, then the system shall respond with HTTP 415 and error code `UNSUPPORTED_MEDIA_TYPE`.

**Rationale**: `screenshots` section cần upload được để không phụ thuộc CDN/Figma ngoài. V1 lưu Docker volume (đã chốt ADR-001 §2.4); v2 chuyển S3-compatible. Scope file-per-upload cho đơn giản; multi-file defer.

**Maps to**: US-003 (Hùng upload screenshot vào feature của Lan). Persona: P3.

**Acceptance hints**:

- Endpoint: `POST /api/v1/features/:id/uploads`, multipart/form-data, field `file`.
- Response: `{ data: { id, url, sizeBytes, mimeType, createdAt } }`.
- File lưu tại `UPLOAD_DIR/:featureId/:uploadId.:ext` (env `UPLOAD_DIR`, default `./data/uploads`).
- Static serve qua `GET /uploads/:id` — verify file thuộc feature authenticated user access được (luôn pass v1 vì all-access).
- Filename sanitize: dùng uploadId, không giữ original filename trong URL (chỉ lưu DB metadata).
- Không resize/optimize server-side v1 — client responsibility nếu cần.

---

## Non-functional Requirements (baseline v1)

Format theo [templates/01-non-functional-requirements-template.md](../templates/01-non-functional-requirements-template.md)@0.1 — mỗi NFR 5 field: Metric / Scope / Measurement / Rationale / Verification.

### NFR-PERF-001 — Response time

- **Category**: `PERF`
- **Metric / threshold**:
  - Read endpoints (`GET /projects/:slug`, `GET /projects/:slug/features/:slug`) ≤ **300ms p95** server-side.
  - Search (`GET /search`) ≤ **500ms p95**.
  - Write endpoints (PUT/POST) ≤ **500ms p95**.
- **Scope**: `/api/v1/*` under dev load; target corpus ≤ 10k feature, ≤ 100 project.
- **Measurement method**: pino log kèm `duration_ms` aggregated; adhoc load test (VD `autocannon`) sau [M1](roadmap.md). Không CI gate v1.
- **Rationale**: Catalog read là hot path cho onboarding; user perception "instant" < 300ms; search 500ms chấp nhận được vì có loading state.
- **Verification**: [T5](stories/US-001/tasks.md#t5--read-api--search-api) (route timing), [T8](stories/US-001/tasks.md#t8--search-page--e2e-smoke--setup-validation) (manual adhoc check).

### NFR-A11Y-001 — Accessibility baseline

- **Category**: `A11Y`
- **Metric / threshold**: WCAG 2.1 **Level A** trên feature detail + project landing; Level AA là stretch goal.
- **Scope**: Web read pages (`/projects/*`). Không enforce trên admin/author pages v1.
- **Measurement method**: Manual audit checklist khi review PR; axe-core smoke test trong [T7](stories/US-001/tasks.md#t7--landing--feature-detail-pages) unit test. Không required screen-reader test v1.
- **Rationale**: Baseline usability cho keyboard user + min legal duty of care; shadcn/ui defaults đã đạt phần lớn tiêu chí (contrast, focus).
- **Verification**: T7 unit test axe + PR review checklist. Full audit pre-[M3 launch](roadmap.md).

### NFR-SEC-001 — Security baseline

- **Category**: `SEC`
- **Metric / threshold**:
  - Password hash: bcryptjs cost ≥ 10.
  - Session cookie `sid`: `httpOnly`, `sameSite=lax`, `secure=true` trong prod.
  - Zod strict parse ở mọi route boundary (body/query/params), reject unknown fields.
  - DB access 100% qua Drizzle parameterized queries — zero raw string interpolation.
  - Rate limit 10 req/min/IP trên `POST /auth/login` (Redis counter).
  - CORS chỉ allow 1 origin `VITE_APP_ORIGIN`.
  - Secrets không commit `.env*`; prod qua platform env vars.
- **Scope**: API server + Express middleware + DB layer.
- **Measurement method**: Code review + unit test (bcrypt cost, cookie attrs, Zod strict); manual security audit trước [M3](roadmap.md).
- **Rationale**: Internal portal low-risk nhưng cần bảo vệ credential stuffing + trivial XSS/SQLi; baseline phù hợp với solo maintainer.
- **Verification**: [T4](stories/US-001/tasks.md#t4--auth-endpoints--session-middleware) (auth + session + rate limit), [T2](stories/US-001/tasks.md#t2--docker-compose--api-skeleton) (env config), pre-M3 audit pass.

### NFR-DATA-001 — Backup & retention

- **Category**: `DATA`
- **Metric / threshold**:
  - Prod v1: manual `pg_dump` **weekly**, lưu off-host.
  - Retention: không auto-delete data (không có "archive" flow).
  - Upload volume backed up cùng pg_dump step.
  - Dev env: không backup; `docker compose down -v` acceptable.
- **Scope**: Prod v1 deployment only.
- **Measurement method**: Document procedure trong [SETUP.md](../docs/SETUP.md); cron log successful `pg_dump` exit code; admin manual delete qua SQL khi cần.
- **Rationale**: RTO/RPO tuần lễ chấp nhận được cho internal tool ở pilot scale; solo maintainer không có capacity automation; auto-backup defer v2.
- **Verification**: Runbook trong SETUP + cron log review (M3).

### NFR-OBS-001 — Logging & observability baseline

- **Category**: `OBS`
- **Metric / threshold**:
  - Every request log JSON có: `request_id`, `user_id` (nếu có), `method`, `path`, `status`, `duration_ms`.
  - Error log include stack trace + Zod `issues[]` khi có.
  - **Không** log password, cookie value, full email (chỉ domain khi cần debug).
- **Scope**: `apps/api` server only. Frontend: `console.*` chỉ dev mode, strip production build.
- **Measurement method**: pino JSON → stdout; unit test assert log line có required key; grep random sample log line trước release.
- **Rationale**: Debuggability cho solo maintainer; structured log ready cho metrics v2; PII minimization.
- **Verification**: [T2](stories/US-001/tasks.md#t2--docker-compose--api-skeleton) pino wiring + unit test assert log shape.

---

## Deferred / out-of-scope v1 (documented to avoid churn)

| Item                                                                  | Reason                                               | Revisit when                           |
| --------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| Role-based permissions cứng (BA chỉ edit business, Dev chỉ edit tech) | YAGNI — v1 đi theo convention + audit trail          | Team > 20 active author, có bad actor  |
| Versioning / diff / comments                                          | Complexity lớn, không critical cho onboarding        | User feedback sau pilot                |
| AI Q&A / RAG                                                          | Out of scope vision                                  | v2                                     |
| Real-time collab (y-websocket / liveblocks)                           | Complexity + infra                                   | v2+                                    |
| Native mobile                                                         | Web responsive đủ cho reader                         | v2+                                    |
| SSO (Google/Azure AD)                                                 | Local email/password đủ cho internal + solo maintain | Company mandates SSO                   |
| 2-way sync Jira/Figma/GitHub                                          | OAuth + webhook infra tốn                            | User pain > embed card                 |
| Advanced search (fuzzy, typo tolerance)                               | Postgres FTS đủ v1                                   | Corpus > 10k hoặc p95 > 500ms          |
| Server-side rate limit toàn bộ API                                    | Chỉ auth endpoint v1                                 | Traffic pattern thực tế cho thấy abuse |
| Automated backup                                                      | Manual pg_dump v1                                    | Có > 1 người maintain                  |

---

## Open questions

### Resolved (ghi lại lịch sử quyết định)

1. **Project-level access** — ✅ Resolved 2026-04-22: **Mọi authenticated user có full read/write mọi project.** Không có membership table v1. Chỉ role `admin` được tạo project mới. Xem FR-PROJ-001.
2. **Feature slug uniqueness** — ✅ Resolved: unique per project (FR-FEAT-001).
3. **Screenshot upload** — ✅ Resolved 2026-04-22: **Upload file multipart → Docker volume** (FR-UPLOAD-001). Paste external URL vẫn được chấp nhận (markdown chuẩn), nhưng primary flow là upload.
4. **User creation flow** — ✅ Resolved 2026-04-22: Seed script tạo 1 admin (`admin@local` / `dev12345`). Admin invite user qua `POST /api/v1/users`. **Không có self-register endpoint** v1. Xem FR-AUTH-001.
5. **US-001 scope** — ✅ Resolved 2026-04-22: US-001 cover landing + search + feature detail read (1 story lớn). Xem `.specs/stories/US-001.md`.

### Still open (revisit sau pilot)

- **Session TTL**: default 7d sliding; có thể chuyển fixed hoặc kéo dài sau khi đo real usage.
- **Admin UI quản lý user**: v1 chỉ có endpoint `POST /api/v1/users` (cURL / seed). Admin UI list/disable user defer → US v2.

---

## Traceability

Mỗi user story (xem `.specs/stories/`) phải link ngược về ≥ 1 FR. Mỗi task (`tasks.md`) phải link về ≥ 1 US và có thể link FR nếu test verify FR trực tiếp. Ví dụ commit:

```
feat(api): seed feature with 5 sections (US-001 / FR-FEAT-002)
```
