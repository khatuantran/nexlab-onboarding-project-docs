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

| ID                                                                   | Area    | Summary                                                     | Priority | Maps to                        |
| -------------------------------------------------------------------- | ------- | ----------------------------------------------------------- | -------- | ------------------------------ |
| [FR-AUTH-001](#fr-auth-001--emailpassword-auth)                      | Auth    | Email + password login/logout, session cookie               | P0       | US-001, US-002, US-003         |
| [FR-PROJ-001](#fr-proj-001--project-crud-minimal)                    | Project | Admin tạo project + liệt kê non-archived                    | P0       | US-002, US-004                 |
| [FR-PROJ-002](#fr-proj-002--project-metadata-edit--archive)          | Project | Admin rename metadata + archive soft-delete                 | P0       | US-004, US-013                 |
| [FR-FEAT-001](#fr-feat-001--feature-crud-within-project)             | Feature | Tạo / sửa / list / archive feature trong project            | P0       | US-002, US-008, US-012, US-013 |
| [FR-FEAT-002](#fr-feat-002--5-section-template)                      | Feature | Feature có template cố định 5 section                       | P0       | US-001, US-002, US-003         |
| [FR-FEAT-003](#fr-feat-003--per-section-multi-author)                | Feature | Multi-author theo từng section                              | P0       | US-002, US-003                 |
| [FR-EMBED-001](#fr-embed-001--external-link-embed)                   | Embed   | Paste Jira/Figma/GitHub URL → preview card                  | P0       | US-003                         |
| [FR-SEARCH-001](#fr-search-001--full-text-search)                    | Search  | FTS feature theo title + section content                    | P0       | US-001                         |
| [FR-SEARCH-002](#fr-search-002--multi-entity-search)                 | Search  | Search grouped: project/feature/section/author/upload       | P1       | US-005                         |
| [FR-SEARCH-003](#fr-search-003--search-filters)                      | Search  | Filter section-type / time / author / status                | P1       | US-005                         |
| [FR-SEARCH-004](#fr-search-004--query-semantics)                     | Search  | Prefix + accent-insensitive + fuzzy match semantics         | P1       | US-006                         |
| [FR-READ-001](#fr-read-001--project-landing--feature-index)          | Read    | Project landing page có feature index                       | P0       | US-001                         |
| [FR-UPLOAD-001](#fr-upload-001--image-upload-for-screenshots)        | Upload  | Upload image file → volume, trả stable URL                  | P0       | US-003                         |
| [FR-USER-001](#fr-user-001--user-list-endpoint)                      | User    | List user (read) cho author filter dropdown                 | P1       | US-005, US-007                 |
| [FR-USER-002](#fr-user-002--admin-user-lifecycle)                    | User    | Admin invite / edit role / archive / reset password         | P1       | US-007                         |
| [FR-USER-003](#fr-user-003--self-service-profile-management)         | User    | View / edit displayName / change password / avatar          | P1       | US-009, US-010                 |
| [FR-PROJ-003](#fr-proj-003--contributors-derivation)                 | Project | Derive top contributors per project/feature from edits      | P1       | US-011                         |
| [FR-LINK-001](#fr-link-001--external-repo--pr-url-linking)           | Project | Project repoUrl + Feature prUrl (nullable, click-through)   | P1       | US-013                         |
| [FR-STATS-001](#fr-stats-001--workspace-aggregate-stats)             | Stats   | Workspace stats endpoint + per-project `filledSectionCount` | P1       | US-014                         |
| [FR-PROFILE-001](#fr-profile-001--per-user-projection-stats--recent) | User    | `/me/stats` + `/me/recent-projects` projections             | P1       | US-015, US-016                 |
| [FR-ACTIVITY-001](#fr-activity-001--user-activity-feed)              | User    | `/me/activity` cursor-paginated feed of own section edits   | P1       | US-017                         |
| [FR-PROFILE-002](#fr-profile-002--per-user-skills-crud)              | User    | Per-user skills CRUD (table-backed, 7-color enum, cap 12)   | P2       | US-018                         |
| [FR-COVER-001](#fr-cover-001--cover-image-upload-profile--project)   | User    | Upload cover image cho user profile + project hero          | P2       | US-019                         |

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
- **Disabled user gate (US-007)**: user có `archived_at != NULL` không login được — `POST /auth/login` trả 403 `USER_DISABLED`. Sau khi user bị archive runtime, request kế tiếp dùng session cũ phải 401 + destroy session (middleware check `archived_at` per request).
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
- **US-013 amend (2026-05-16)**: PATCH body có thể nhận `repoUrl?: string | null` (xem FR-LINK-001). Missing key = giữ; explicit `null` = clear; string = update. Validation: regex `/^https?:\/\//` + max 500 chars.

---

## FR-FEAT-001 — Feature CRUD within project

**Statement (Event-driven + Unwanted):**

- When an authenticated user submits a feature creation request scoped to an existing project with a unique slug within that project and a human-readable title, the system shall persist the feature with all 5 sections initialized as empty drafts.
- If the target project does not exist or the user lacks access to it, then the system shall respond with HTTP 404 `PROJECT_NOT_FOUND` (không leak project tồn tại).
- When an authenticated user edits a feature's title or slug, the system shall update it and invalidate any cached feature responses for that project.
- When an authenticated user with role `admin` archives a feature, the system shall set `archived_at = NOW()` and exclude that feature from subsequent project feature listings and direct GET responses.
- If a non-admin user attempts to archive a feature, the system shall respond with HTTP 403 `FORBIDDEN`.
- If the target feature does not exist (or is already archived from a previous call) when archive is requested, the call is idempotent — 204 cho row tồn tại với `archived_at` đã set; 404 `FEATURE_NOT_FOUND` cho slug không tồn tại từ đầu.

**Rationale**: Feature là đơn vị onboarding chính. Tạo feature = tạo khung 5 section rỗng để author không bị "blank page paralysis". Archive (soft-delete) cho phép admin ẩn feature stale khỏi catalog của project mà không mất sections + uploads — mirror đầy đủ pattern FR-PROJ-002.

**Maps to**: US-002 (Lan tạo feature mới), US-008 (admin archive feature). Persona: P2 (BA/PM) cho CRUD, P3 (Hùng — admin) cho archive.

**Acceptance hints**:

- Slug unique trong cùng project, không bắt unique cross-project.
- 5 section rows tạo đồng thời trong 1 transaction (atomic).
- Edit title → feature `updated_at` refresh → landing page reorders.
- Archive là soft-delete: UPDATE `archived_at = NOW()`, không DELETE. Sections + uploads cascade-attached giữ nguyên.
- Archived feature:
  - KHÔNG xuất hiện trong `GET /projects/:slug` response `features[]`.
  - Direct URL `/projects/:slug/features/:fSlug` return 404 `FEATURE_NOT_FOUND`.
  - Search v2 (`GET /search`) phase 1 vẫn match archived feature — click qua sẽ 404, defer filter as known limitation.
- Hard delete + recovery defer v2.
- **US-012 amend (2026-05-16)**: `PATCH /api/v1/projects/:slug/features/:featureSlug` admin-only nhận `{ title?, slug? }` (≥ 1 key). Conflict slug trong project → 409 `FEATURE_SLUG_TAKEN`. Slug rename = bookmark cũ chết (no redirect v1).
- **US-013 amend (2026-05-16)**: PATCH body có thể nhận `prUrl?: string | null` (xem FR-LINK-001).

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

## FR-SEARCH-002 — Multi-entity search

**Statement (Event-driven):**

- When an authenticated user submits a non-empty search query, the system shall return matched results grouped by entity type — `projects`, `features`, `sections`, `authors`, `uploads` — with up to 5 hits per group ranked by relevance.
- The system shall return an empty array per group when no matches exist, rather than omitting the key.

**Rationale**: V1 search (FR-SEARCH-001) chỉ cover features. Khi catalog mở rộng, BA / Dev cần tìm theo tên project, theo author đã touch feature, theo nội dung section riêng (đặc biệt `user-flow` cho business flow lookup), và theo screenshot caption. Group-by-entity giúp người dùng phân biệt nhanh "đây là project" vs "đây là section" thay vì 1 list flat phẳng. Limit 5 / group v1 vì pagination per-group defer.

**Maps to**: US-005 (Search v2). Personas: P1 (Reader), P2 (BA Author), P3 (Senior Dev).

**Acceptance hints**:

- Response shape: `{ data: { projects: ProjectHit[], features: FeatureHit[], sections: SectionHit[], authors: AuthorHit[], uploads: UploadHit[] } }`. Mọi key luôn xuất hiện.
- Project hit: `{ slug, name, snippet (highlighted name+desc), featureCount, updatedAt, rank }`.
- Feature hit: keep current shape `{ projectSlug, featureSlug, title, snippet, rank }` + thêm `updatedAt`, `filledSectionCount`.
- Section hit: `{ projectSlug, featureSlug, featureTitle, sectionType, snippet (highlighted body), updatedBy?, updatedAt, rank }`. Deep-link target: `/projects/:projectSlug/features/:featureSlug#section-{sectionType}`.
- Author hit: `{ id, displayName, role, touchedFeatureCount, rank }`. Click → defer (placeholder anchor v1).
- Upload hit: `{ id, filename, caption?, projectSlug, featureSlug, featureTitle, uploadedByName?, createdAt, rank }`.
- Snippet sanitize giữ chỉ `<mark>` (DOMPurify allow-list).
- 5 entity queries chạy song song (`Promise.all`).
- Archived project → loại khỏi mọi group (FR-PROJ-002 consistency).
- Empty query / quá dài → reuse `SEARCH_QUERY_EMPTY` / `SEARCH_QUERY_TOO_LONG` (FR-SEARCH-001).

---

## FR-SEARCH-003 — Search filters

**Statement (State-driven + Event-driven):**

- While viewing search results, the user shall be able to apply filters for: section type (multi-select trong 5 enum), last-updated time window (24h / 7d / 30d / all), author (single user), and feature filled-status (`filled` / `partial` / `empty`).
- When any filter changes, the system shall return results scoped to the active filter combination, applied per-entity where relevant.

**Rationale**: BA tìm "business flow" cần narrow đến section-type `user-flow`. Dev xem ai đang viết tích cực cần lọc theo author + last 7 ngày. Reader tìm feature đã hoàn chỉnh đọc onboard nên filter status `filled`. Filter combination giảm noise khi corpus lớn.

**Maps to**: US-005. Personas: P1, P2, P3.

**Acceptance hints**:

- Query params: `sectionTypes` (CSV trong 5 enum), `authorId` (UUID), `updatedSince` (ISO date), `status` (`filled` | `partial` | `empty`). Tất cả optional.
- `sectionTypes` áp dụng vào `sections` group + filter `features` group (chỉ giữ feature có ít nhất 1 section type khớp). Không áp dụng vào `projects` / `authors` / `uploads`.
- `authorId` áp dụng vào `sections.updated_by`, `features` (qua join sections), `uploads.uploaded_by`. Không áp dụng `projects` / `authors`.
- `updatedSince` áp dụng vào tất cả entity dùng cột `updated_at` / `created_at` tương ứng.
- `status` áp dụng vào `features` + `sections` (qua filledSectionCount join). Không áp dụng `projects` / `authors` / `uploads`.
- `filled` = 5/5 sections non-empty; `partial` = 1-4; `empty` = 0.
- Invalid filter value → 400 `VALIDATION_ERROR` (Zod).
- URL state FE: chỉ serialize filter khác default (giảm độ dài URL).

---

## FR-SEARCH-004 — Query semantics

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user submits a search query of length ≥ 1, the system shall match using **prefix-token semantics** so a partial token (e.g. `"a"`) matches longer tokens that start with it (e.g. `"a3solutions"`).
- The system shall normalize Vietnamese diacritics so an unaccented query (`"dang nhap"`) matches accented content (`"Đăng nhập"`) and vice versa.
- When a query produces zero exact-prefix matches against short fields (project name, feature title, author display name, upload filename), the system shall fall back to **trigram similarity ≥ 0.3** to surface near-matches (e.g. `"ondoarding"` → `"onboarding"`).

**Rationale**: Pilot feedback 2026-04-26 — user gõ partial token mong list-as-you-type behavior. Vietnamese teams gõ không dấu nhanh hơn → query "dang nhap" cần match. Typo tolerance giảm zero-result frustration. Postgres-only stack (`unaccent` + `pg_trgm` extensions, không Meilisearch) giữ $0 infra constraint per ADR-002.

**Maps to**: US-006 (Search v2.1: prefix + accent-insensitive + fuzzy). Personas: P1, P2, P3.

**Acceptance hints**:

- Backend: `to_tsquery('simple', '<unaccented_token>:*')` per token, joined `&`. Sanitize input to alphanumerics only trước append `:*`.
- Generated tsvector columns rebuild với `immutable_unaccent()` wrapper (Postgres `unaccent` is `STABLE`, cần wrap immutable cho generated columns).
- Trigram fallback áp dụng ON: `projects.name`, `features.title`, `users.display_name`, `uploads.filename`. **Không** áp dụng vào `sections.body` (long text → trigram noise + index bloat).
- Ranking: combine `ts_rank(...)` với `similarity(...)` qua `greatest()`; tsquery hits luôn rank > trgm fallback hits ở mức tie.
- `ts_headline` vẫn dùng tsquery cùng config để highlight đúng.
- Response shape không đổi (giữ FR-SEARCH-002).
- Error codes không đổi (giữ `SEARCH_QUERY_EMPTY` / `SEARCH_QUERY_TOO_LONG`).
- Performance: target ≤ 500ms p95 unchanged (NFR-PERF-001); benchmark trong T5.

---

## FR-USER-001 — User list endpoint

**Statement (Ubiquitous):**

- The system shall expose a list endpoint that returns active users (id, displayName, role) to any authenticated user, optionally filtered by role and free-text query against `display_name`.

**Rationale**: Author filter dropdown trong Search v2 (FR-SEARCH-003) cần list user. V1 không có membership/per-project ACL (FR-PROJ-001 access model) → list public cho mọi authenticated user. Search-as-type giúp scale lên ~100 users mà không cần pagination.

**Maps to**: US-005 (author filter dropdown). Personas: indirect P1/P2/P3.

**Acceptance hints**:

- Endpoint: `GET /api/v1/users?q=<text?>&role=<admin|author?>&status=<active|archived|all?>`.
- Auth: requireAuth (any role).
- Default `status=active` filter `archived_at IS NULL`. `status=archived|all` requires admin (403 nếu không).
- Response cho author: `{ data: User[] }` với `User = { id, displayName, role }`. **Không** trả `email`, `archivedAt`, `lastLoginAt`.
- Response cho admin: `{ data: AdminUser[] }` với `AdminUser = User & { email, archivedAt, lastLoginAt }`.
- `GET /api/v1/users/:id` admin-only — trả `AdminUser` full shape; 404 nếu không tồn tại.
- `q` ILIKE `%<q>%` trên `display_name` (admin: thêm OR `email`), case-insensitive.
- `role` exact match.
- Sort `display_name` asc.
- Limit hard 100 (no pagination v1 — pilot ≤ 100 user).
- Empty result → `{ data: [] }`, không 404.

---

## FR-USER-002 — Admin user lifecycle

**Statement (Event-driven + Unwanted):**

- When an authenticated user with role `admin` submits a user invite request with a unique email, the system shall create the user with a generated 12-character temporary password and return the credential payload exactly once.
- When an admin updates a user's `displayName` or `role`, the system shall persist the change and return the updated `AdminUser` shape.
- When an admin archives or unarchives a user, the system shall toggle `archived_at`; archived users cannot login (FR-AUTH-001) and any live session is invalidated on the next request.
- When an admin triggers password reset for a target user, the system shall generate a new temporary password, replace `password_hash`, purge target user's Redis sessions, and return the new credential exactly once.
- If the actor would (a) modify their own role/status or (b) demote/disable the last remaining admin, then the system shall reject the request with 409 (`CANNOT_MODIFY_SELF` / `LAST_ADMIN_PROTECTED`).
- If the invite email already exists (case-insensitive), then the system shall respond 409 `USER_EMAIL_EXISTS`.

**Rationale**: Manual SQL invite không scale khi M3 onboard ≥ 3 dev. Admin UI mở khả năng list, invite, edit role, disable account, reset password mà không SSH. Last-admin guard tránh lockout system; self-protect tránh admin accidentally demote chính mình.

**Maps to**: US-007. Persona: P3 (Admin = senior dev trong v1).

**Acceptance hints**:

- Endpoints: `POST /api/v1/users`, `PATCH /api/v1/users/:id`, `POST /api/v1/users/:id/archive`, `POST /api/v1/users/:id/unarchive`, `POST /api/v1/users/:id/reset-password`. Tất cả admin-only (403 nếu không).
- Temp password: 12-char alphanumeric (no I/l/0/O ambiguity), bcrypt cost 12.
- Response shape: `{ data: { user: AdminUser, tempPassword: string } }` cho invite + reset; `{ data: AdminUser }` cho patch + archive + unarchive.
- Audit: `pino.info({event:"user.<verb>", actorId, targetId, ...})` mỗi mutation. Không lưu DB v1.
- Idempotent archive/unarchive: gọi lại thao tác đã thực hiện không lỗi (no-op + cùng response).

---

## FR-USER-003 — Self-service profile management

**Statement (Event-driven + Unwanted):**

- When an authenticated user fetches their own profile (`GET /api/v1/me`), the system shall return `id`, `email`, `displayName`, `role`, `avatarUrl`, `lastLoginAt`, `createdAt` from the user's own row (read by `req.session.userId`).
- When an authenticated user submits a display-name update (`PATCH /api/v1/me`), the system shall persist the new `displayName` against the session user (`req.session.userId`) only — never accept `:id` URL param so a forged path cannot escalate to another user (anti-IDOR).
- When an authenticated user submits a password change (`POST /api/v1/me/password`) with `{ oldPassword, newPassword }`, the system shall verify `oldPassword` against the stored bcrypt hash; on success persist the bcrypt hash of `newPassword`, purge all other Redis sessions for that user (current session preserved via its sid), and return 204.
- If the supplied `oldPassword` does not match, the system shall respond 401 `INVALID_CREDENTIALS` (no information leak about whether the user exists or the format of the stored hash).
- When an authenticated user uploads an avatar image (`POST /api/v1/me/avatar`, multipart `file` ≤ 2 MB, png/jpg/webp), the system shall stream the bytes through Cloudinary into folder `onboarding-portal/<env>/avatars/`, persist the returned `secure_url` on `users.avatar_url`, and return `{ data: { avatarUrl } }`. Previous avatar URL is overwritten (no Cloudinary orphan cleanup v1 — accept storage drift).
- **(US-010 amend, 2026-05-16)** When an authenticated user fetches their own profile (`GET /api/v1/me`), the system shall additionally return `phone`, `department`, `location`, `bio` (all nullable strings) from the user's row.
- **(US-010 amend, 2026-05-16)** When an authenticated user submits a profile update (`PATCH /api/v1/me`), the system shall accept optional `phone` (1-30 chars matching `/^[0-9 +\-()]{1,30}$/`), `department` (1-120 chars), `location` (1-120 chars), `bio` (0-500 chars), persist them on the user's own row, and return the refreshed `AuthUser`. Explicit `null` in the body clears the field; missing key leaves the field unchanged.

**Rationale**: Users hiện không có cách nào đổi displayName hay password (admin reset password cho người khác qua US-007 nhưng không có self-flow). Avatar gradient initials đủ pilot nhưng user request branding cá nhân. Self-service giảm load admin (mọi PW change phải qua admin reset → friction).

**Maps to**: US-009 (self-service profile baseline) + US-010 (4-field enrichment). Personas: P1 (Minh), P2 (Lan), P3 (Hùng) — universal.

**Acceptance hints**:

- All endpoints `requireAuth` only — no admin gate. Backend always trust `req.session.userId`, never URL param.
- `PATCH /api/v1/me` body: `{ displayName: string 1-120 }`. No `email` / `role` field accepted (silently stripped by Zod schema or rejected with VALIDATION_ERROR if extras).
- `POST /api/v1/me/password` body: `{ oldPassword: string 1-200, newPassword: string 8-200 }`. New password ≥ 8 chars; reuse `BCRYPT_COST = 12`.
- Session purge: extend `purgeSessionsForUser` with an `exceptSid` parameter so the user stays logged in on the device that triggered the change (matches GitHub/GitLab UX).
- Avatar upload: reuse `cloudinary.uploadImage` (CR-004 Phase 2) with `folder = "${cloudinaryFolder}/avatars"`. Magic-byte mime sniff via `file-type` (same pattern as `/uploads`). Rejected mime → 415 `UNSUPPORTED_MEDIA_TYPE`; > 2 MB → 413 `FILE_TOO_LARGE`; Cloudinary down → 502 `UPLOAD_PROVIDER_ERROR`; SDK unconfigured → 503 `UPLOADS_DISABLED`.
- Response shape after update: PATCH/password mutations may return `{ data: AuthUser }` (with refreshed avatarUrl) so FE invalidates `authKeys.me` and the header avatar updates in one round-trip.
- No audit log v1; pino `info({event:"profile.updated", userId})` per mutation is enough.
- US-010 enrichment: 4 nullable text columns added via migration `0010_users_profile_enrichment.sql` (`phone`, `department`, `location`, `bio`). Zod schema enforces optional + length + phone regex; explicit `null` clears, missing key leaves untouched (PATCH semantics).

---

## FR-PROJ-003 — Contributors derivation

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user fetches a project list (`GET /api/v1/projects`), a single project (`GET /api/v1/projects/:slug`), or a feature (`GET /api/v1/projects/:slug/features/:featureSlug`), the response shall include a `contributors[]` array of up to 5 `{ userId, displayName, avatarUrl, lastUpdatedAt }` entries, sorted by most-recent edit on that scope, derived from distinct `sections.updated_by` rows within the scope (joined to `users`).
- The system shall exclude sections belonging to archived features when computing project-scope contributors (matching the existing `features.archived_at IS NULL` filter used by `GET /projects/:slug`).
- The system shall return an empty `contributors[]` array when no `sections.updated_by` rows exist within the scope (e.g. brand-new project, feature with all-empty sections).

**Rationale**: FE surfaces (ProjectCard, ProjectHero, FeatureCard, ActivityRail) currently render hardcoded contributor initials (`["TM","NL"]`, hash-derived `CONTRIBUTOR_POOL`). v1 has no `contributors` membership table; the existing `sections.updated_by` FK to `users` is sufficient to derive real top-contributors without new schema. Top-5 limit keeps response payload bounded.

**Maps to**: US-011 (real contributors). Personas: P1 (Minh sees "who edited"), P2 (Lan), P3 (Hùng).

**Acceptance hints**:

- Per-row query for `GET /projects` (N projects) avoids N+1 via single SQL: `SELECT project_id, ARRAY_AGG(...) FROM (SELECT DISTINCT ON (project_id, user_id) ... ORDER BY project_id, user_id, updated_at DESC) sub GROUP BY project_id` or lateral join. Estimate added latency < 30 ms for typical N=10.
- AvatarStack on FE shows up to 3 avatars + "+N" overflow when `contributors.length > 3`.
- No new endpoint; existing read endpoints augment their response shape (backward-compatible additive field).
- No mutation; contributors are derived projection only. To "add a contributor" a user must edit a section.

---

## FR-LINK-001 — External repo + PR URL linking

**Statement (Event-driven + Optional + Unwanted):**

- When an authenticated user with role `admin` submits a project edit request containing `repoUrl`, the system shall persist the value (or clear it on explicit `null`) and surface it on subsequent project read responses.
- When an authenticated user with role `admin` submits a feature edit request containing `prUrl`, the system shall persist the value (or clear it on explicit `null`) and surface it on subsequent feature read responses.
- If either URL fails the format check (regex `^https?:\/\/` + max 500 chars), the system shall respond with HTTP 400 `VALIDATION_ERROR` identifying the offending field.
- Both fields are nullable; absence from PATCH body = leave untouched; explicit `null` = clear.

**Rationale**: CR-006 v4 ships "Repo" (project hero) + "Xem PR" (feature detail) buttons wired to placeholder toast. Pure URL-store (no GitHub API) gives users click-through to existing tools while keeping schema simple — 2 nullable text columns, no OAuth, no rate limits. v2 may layer GitHub API enrichment on top.

**Maps to**: US-013 (promoted from BL-001). Personas: P1 (Minh clicks Repo to read code), P2 (Lan paste PR link), P3 (Hùng admin sets URLs).

**Acceptance hints**:

- Schema: migration `0011` adds `projects.repo_url TEXT` + `features.pr_url TEXT`. Both nullable.
- Validation: accept any `http(s)` domain (user triage 2026-05-16: "Bất kỳ http(s) URL"). No allowlist.
- FE: button renders as `<a href={url} target="_blank" rel="noopener noreferrer">` when URL set; disabled `<button>` with tooltip "Chưa link repo / PR" when null. No layout shift.
- Response shape: `repoUrl` / `prUrl` appear in `ProjectResponse`, `ProjectSummary`, `FeatureResponse`, `FeatureListItem`.
- Out of scope: domain whitelist, GitHub API fetch, per-section PR links, branch/commit links.

---

## FR-STATS-001 — Workspace aggregate stats

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user fetches `GET /api/v1/workspace/stats`, the system shall return `{ projectCount, featuresDocumented, contributorsActive }` where `featuresDocumented` counts features whose 5 sections all have non-empty bodies, and `contributorsActive` counts distinct `sections.updated_by` within the last 30 days.
- The system shall exclude archived projects and archived features from all three counts.
- The system shall include a `filledSectionCount: number` on every `ProjectSummary` returned by `GET /api/v1/projects`, summing non-empty sections across that project's non-archived features.

**Rationale**: CR-006 v4 HomePage hero ships 4 hardcoded stat tiles (`Contributors=8`, `Onboard TB=2.3h`) and a "Đủ doc" filter chip wired to `featureCount > 0` placeholder. Real numbers come from `sections.updated_at` and `sections.body` — no new schema. `onboardingMedianHours` dropped per 2026-05-16 triage (no DB signal).

**Maps to**: US-014. Personas: P1/P2/P3.

**Acceptance hints**:

- 30-day active window hardcoded v1.
- No caching v1; compute on-demand (revisit when N > 100 projects).
- Hero grid renders **3 tiles** post-US-014 (4th tile dropped).
- "Đủ doc" filter chip uses `filledSectionCount === featureCount * 5 && featureCount > 0`.

---

## FR-PROFILE-001 — Per-user projection (stats + recent)

**Statement (Event-driven + Ubiquitous):**

- When an authenticated user fetches `GET /api/v1/me/stats`, the system shall return `{ projectsTouched, featuresDocumented, totalEdits, sectionsCompleted }` aggregated from rows where `sections.updated_by = sessionUserId`.
- When an authenticated user fetches `GET /api/v1/me/recent-projects?limit=N`, the system shall return projects the caller has touched, sorted by `MAX(sections.updated_at)` descending, capped at `min(N, 20)` with default 4.
- The system shall exclude archived projects and archived features from both projections.

**Rationale**: CR-006 v4 ProfilePage ships hardcoded `StatsCard` (`4 / 18 / 42 / 12`) and `RecentProjectsCard` (4 fake rows). Same data primitive as FR-PROJ-003 (US-011); inverted grouping (by project per-user instead of by project per-everyone).

**Maps to**: US-015, US-016.

**Acceptance hints**:

- `totalEdits` = count of current section rows where `updated_by = me` (no history v1; PUT overwrites).
- `featuresDocumented` requires the feature to have all 5 sections non-empty (any author), not just the caller's.
- Recent-projects row shape: `{ slug, name, lastTouchedAt, sectionsTouched }`. No `pct` v1 — that would require a join with the workspace-wide `filledSectionCount`.
- Empty-user shapes: `{0,0,0,0}` / `[]`.

---

## FR-ACTIVITY-001 — User activity feed

**Statement (Event-driven + Optional):**

- When an authenticated user fetches `GET /api/v1/me/activity?limit=N&cursor=<iso>`, the system shall return `{ items: ActivityItem[], nextCursor: string | null }` listing section edits by the caller sorted by `updated_at` descending.
- `ActivityItem` includes `{ id, sectionType, featureSlug, featureTitle, projectSlug, projectName, updatedAt, verbCode: 'updated' }`.
- The system shall paginate via cursor: clients send the `updated_at` of the last received item; the system returns items with `updated_at < cursor` up to `limit`. Default limit 20, max 50.
- The system shall exclude archived projects / archived features.

**Rationale**: ProfilePage `ActivityFeedCard` + FeatureDetail `ActivityRail`'s "Xem tất cả" both wire to a placeholder (toast / 4 fake rows). v1 only tracks current section state — `verbCode` fixed `'updated'`. Feature-scoped pagination unnecessary because each feature has ≤ 5 section rows; drawer reuses already-loaded sections instead of a new endpoint.

**Maps to**: US-017.

**Acceptance hints**:

- Cursor format: ISO 8601 UTC timestamp string.
- Items returned + 1 over-fetch trick: if rows.length > limit, pop last and set `nextCursor = popped.updatedAt`.
- Empty feed: `{ items: [], nextCursor: null }`.
- Invalid limit (`< 1` / `> 50` / non-numeric) → 400 `VALIDATION_ERROR`.

---

## FR-PROFILE-002 — Per-user skills CRUD

**Statement (Event-driven + Unwanted):**

- When an authenticated user fetches `GET /api/v1/me/skills`, the system shall return `{ data: SkillItem[] }` (`{ id, label, color, sortOrder }`) sorted by `sort_order` ascending; empty array for users with no skills.
- When an authenticated user submits `PUT /api/v1/me/skills` with `{ skills: SkillItem[] }`, the system shall replace the caller's entire skill set in a single transaction, assigning `sort_order` from the array order.
- If the request array length exceeds 12, contains duplicate labels (case-insensitive), contains an empty label, or contains a `color` outside the 7-value enum (`purple|orange|green|blue|rose|amber|primary`), the system shall respond with HTTP 400 `VALIDATION_ERROR` and not write to the database.

**Rationale**: CR-006 v4 `SkillsCard` ships 7 hardcoded chips. Free-text skills with constrained colors give users an identity surface without skill-taxonomy complexity. Separate `user_skills` table (vs JSONB) per 2026-05-16 triage prepares for future skill-search.

**Maps to**: US-018. Personas: any authenticated user.

**Acceptance hints**:

- Schema: `user_skills (id UUID PK, user_id UUID FK CASCADE, label TEXT, color TEXT, sort_order INT, created_at TIMESTAMPTZ)` + unique index `(user_id, lower(label))`.
- Color enum at Zod boundary (server) + client dropdown.
- Cap 12 enforced both client (disable Add button) and server (Zod `.max(12)`).
- Replace-all semantics: PUT with `{ skills: [] }` clears all rows for the caller. Other users' rows untouched.
- Out of scope: skill autocomplete, endorsements, cross-user view.

---

## FR-COVER-001 — Cover image upload (profile + project)

**Statement (Event-driven + Unwanted):**

- When an authenticated user uploads a cover image (`POST /api/v1/me/cover`, multipart `file` ≤ 4 MB, png/jpg/webp), the system shall stream the bytes through Cloudinary into folder `onboarding-portal/<env>/covers/users/`, persist the returned `secure_url` on `users.cover_url`, and return `{ data: { coverUrl } }`. Previous cover URL overwritten (no Cloudinary orphan cleanup v1).
- When an admin uploads a project cover (`POST /api/v1/projects/:slug/cover`, same body shape), the system shall require `requireAuth + requireAdmin`, resolve `:slug` to a project (404 `PROJECT_NOT_FOUND` if missing), upload to folder `onboarding-portal/<env>/covers/projects/`, persist on `projects.cover_url`, and return `{ data: { coverUrl } }`.
- When a non-admin (role=author) calls `POST /api/v1/projects/:slug/cover`, the system shall respond 403 `FORBIDDEN`.
- When `GET /api/v1/me`, `GET /api/v1/projects`, or `GET /api/v1/projects/:slug` succeeds, the response shall include `coverUrl: string | null` (additive field; null when never uploaded).
- If the supplied file exceeds 4 MB, the system shall respond 413 `FILE_TOO_LARGE` ("File quá lớn (max 4 MB)") without invoking Cloudinary.
- If the supplied file's magic-byte sniff is not in the {png, jpg, webp} whitelist, the system shall respond 415 `UNSUPPORTED_MEDIA_TYPE`.
- If Cloudinary returns 5xx or network error, the system shall respond 502 `UPLOAD_PROVIDER_ERROR`. If Cloudinary env vars are missing, 503 `UPLOADS_DISABLED`.

**Rationale**: ProfilePage v4.1 ships a "Đổi ảnh bìa" button wired to `placeholderToast` — last placeholder of the v4 mock audit on the personal-branding surface. ProjectHero v4 uses generic gradient — admins request per-project hero personalization. Reusing US-009 avatar Cloudinary pattern means zero new infra and an established 4xx/5xx contract; the 4 MB cap (vs avatar's 2 MB) reflects cover dimensions (~2000×860).

**Maps to**: US-019 (cover upload, profile + project). Personas: P1 (Minh — own profile), P3 (Hùng — admin projects).

**Acceptance hints**:

- Endpoint `POST /me/cover` reuses `multerSingle` pattern but with a `COVER_MAX_BYTES = 4 * 1024 * 1024` limit (separate multer instance with its own size cap).
- Endpoint `POST /projects/:slug/cover` mounts under `createProjectsRouter` with `requireAdmin` middleware (existing pattern from `PATCH /projects/:slug`).
- Cloudinary folder split: `${cloudinaryFolder}/covers/users` vs `${cloudinaryFolder}/covers/projects` — distinct subfolders for separable cost reporting.
- No new error codes introduced — reuse `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `UPLOAD_PROVIDER_ERROR`, `UPLOADS_DISABLED`, `PROJECT_NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`.
- FE overlay treatment when cover present: `bg-gradient-to-b from-black/40 to-black/60` on top of `<img>` to keep title/meta legible. `GradientHero` blobs glow preserved over the image for v4 identity.
- Out of scope v1: cropping UI, gallery presets, per-feature covers, animated covers.

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

- When an authenticated user uploads an image file (MIME type `image/png`, `image/jpeg`, or `image/webp`, size ≤ 5 MiB) scoped to an existing feature, the system shall stream the file to **Cloudinary CDN** (per [CR-004](../changes/CR-004.md)), associate the resulting `public_id` + secure URL with the feature, and respond with an absolute HTTPS URL pointing at Cloudinary.
- If the upload exceeds 5 MiB, then the system shall respond with HTTP 413 and error code `FILE_TOO_LARGE` without persisting the partial payload.
- If the upload MIME type is outside the allow-list, then the system shall respond with HTTP 415 and error code `UNSUPPORTED_MEDIA_TYPE`.

**Rationale**: `screenshots` section cần upload được để không phụ thuộc CDN/Figma ngoài. V1 lưu Docker volume (ADR-001 §2.4); CR-003 chuyển sang Fly persistent volume; CR-004 Phase 2 (this revision) chuyển sang Cloudinary CDN để bỏ volume cost ($0.26/mo) + sidestep cross-origin `<img>` cookie fragility (BUG-003 root cause) + có sẵn image transforms (resize / WebP / quality auto).

**Maps to**: US-003 (Hùng upload screenshot vào feature của Lan). Persona: P3.

**Acceptance hints**:

- **Endpoint**: `POST /api/v1/features/:id/uploads`, `multipart/form-data`, field `file`. Auth: `requireAuthor`.
- **Storage**: stream multer memory buffer through `cloudinary.uploader.upload_stream({ folder: 'onboarding-portal/<env>', public_id: <uuid> })`. No local filesystem write.
- **Response**: `{ data: { id, url, sizeBytes, mimeType, createdAt } }` where `url` = Cloudinary `secure_url` (absolute `https://res.cloudinary.com/<cloud>/image/upload/v.../<folder>/<uuid>.<ext>`).
- **DB**: `uploads` row stores `cloudinary_public_id` (string), `mime_type`, `size_bytes`, `filename` (original), `uploaded_by` FK, `feature_id` FK. Migration 0006 adds the column.
- **Read path**: **no BE route**. FE renders `<img src="<cloudinary-url>">` directly; Cloudinary CDN serves binary. The legacy `GET /api/v1/uploads/:id` route is removed (replaced by Cloudinary URL in DB).
- **Env**: `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>` set as Fly secret in prod, `apps/api/.env` in dev. SDK auto-reads this var.
- **Filename sanitize**: dùng uploadId (UUIDv4) làm Cloudinary `public_id`; original filename giữ ở DB cột `filename` cho UI hiển thị, không xuất hiện trong URL.
- **Validation**: MIME whitelist (`image/png` | `image/jpeg` | `image/webp`) + magic-byte sniff (`file-type` lib) trước khi upload Cloudinary — kể cả Cloudinary có check, BE vẫn validate để fail-fast + giữ contract với 415 error code.
- **Transforms**: response trả `secure_url` raw, không pre-bake transform. FE có thể append `f_auto,q_auto,w_<N>` segment khi render nếu cần. Defer.
- **Migration của data cũ**: KHÔNG migrate. 3 file đã ở Fly volume bị destroy trong Phase 1; markdown links tới `/api/v1/uploads/<uuid>` còn trong DB sẽ 404. Acceptable per CR-004 §Decision.

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
| SSO (Google/Azure AD)                                                 | Local email/password đủ cho internal + solo maintain | Company mandates SSO                   |
| Advanced search (fuzzy, typo tolerance)                               | Postgres FTS đủ v1                                   | Corpus > 10k hoặc p95 > 500ms          |
| Search autocomplete / saved searches / cross-project ACL              | Defer v2 (xem US-005 Scope out)                      | Pilot feedback                         |
| Server-side rate limit toàn bộ API                                    | Chỉ auth endpoint v1                                 | Traffic pattern thực tế cho thấy abuse |

---

## Open questions

### Resolved (ghi lại lịch sử quyết định)

1. **Project-level access** — ✅ Resolved 2026-04-22: **Mọi authenticated user có full read/write mọi project.** Không có membership table v1. Chỉ role `admin` được tạo project mới. Xem FR-PROJ-001.
2. **Feature slug uniqueness** — ✅ Resolved: unique per project (FR-FEAT-001).
3. **Screenshot upload** — ✅ Resolved 2026-04-22: **Upload file multipart → Docker volume** (FR-UPLOAD-001). Paste external URL vẫn được chấp nhận (markdown chuẩn), nhưng primary flow là upload.
4. **User creation flow** — ✅ Resolved 2026-04-22: Seed script tạo 1 admin (`admin@local` / `dev12345`). Admin invite user qua `POST /api/v1/users`. **Không có self-register endpoint** v1. Xem FR-AUTH-001.
5. **US-001 scope** — ✅ Resolved 2026-04-22: US-001 cover landing + search + feature detail read (1 story lớn). Xem `.specs/stories/US-001.md`.

### Still open (revisit sau pilot)

- ~~**Admin UI quản lý user**: v1 chỉ có endpoint `POST /api/v1/users` (cURL / seed). Admin UI list/disable user defer → US v2.~~ ✅ Resolved 2026-05-15: promoted thành scope qua [US-007](stories/US-007.md) (full lifecycle: list + invite + edit role + archive + reset password).

---

## Traceability

Mỗi user story (xem `.specs/stories/`) phải link ngược về ≥ 1 FR. Mỗi task (`tasks.md`) phải link về ≥ 1 US và có thể link FR nếu test verify FR trực tiếp. Ví dụ commit:

```
feat(api): seed feature with 5 sections (US-001 / FR-FEAT-002)
```
