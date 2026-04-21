# Functional & Non-functional Requirements

*Last updated: 2026-04-22 · Source of truth for MVP v1 scope. FRs drive user stories & task breakdowns.*

---

## Format — EARS

Mỗi FR viết theo EARS (Easy Approach to Requirements Syntax):

| Dạng | Template |
|---|---|
| Ubiquitous | `The <system> shall <response>.` |
| Event-driven | `When <event>, the <system> shall <response>.` |
| State-driven | `While <state>, the <system> shall <response>.` |
| Optional | `Where <feature present>, the <system> shall <response>.` |
| Unwanted | `If <trigger>, then the <system> shall <response>.` |
| Complex | Kết hợp các dạng trên. |

Mỗi FR có:
- **ID** (`FR-<AREA>-NNN`)
- **Statement** (EARS)
- **Rationale** (1-2 câu)
- **Maps to** (US-xxx, persona)
- **Acceptance hints** (tín hiệu để viết test, không phải full acceptance criteria)

---

## FR Summary Table

| ID | Area | Summary | Priority | Maps to |
|---|---|---|---|---|
| [FR-AUTH-001](#fr-auth-001--emailpassword-auth) | Auth | Email + password login/logout, session cookie | P0 | US-001, US-002, US-003 |
| [FR-PROJ-001](#fr-proj-001--project-crud-minimal) | Project | Admin tạo project + liệt kê | P0 | US-002 |
| [FR-FEAT-001](#fr-feat-001--feature-crud-within-project) | Feature | Tạo / sửa / list feature trong project | P0 | US-002 |
| [FR-FEAT-002](#fr-feat-002--5-section-template) | Feature | Feature có template cố định 5 section | P0 | US-001, US-002, US-003 |
| [FR-FEAT-003](#fr-feat-003--per-section-multi-author) | Feature | Multi-author theo từng section | P0 | US-002, US-003 |
| [FR-EMBED-001](#fr-embed-001--external-link-embed) | Embed | Paste Jira/Figma/GitHub URL → preview card | P0 | US-003 |
| [FR-SEARCH-001](#fr-search-001--full-text-search) | Search | FTS feature theo title + section content | P0 | US-001 |
| [FR-READ-001](#fr-read-001--project-landing--feature-index) | Read | Project landing page có feature index | P0 | US-001 |

Priority: **P0** = must-have v1. P1/P2 deferred sẽ list ở cuối file.

---

## FR-AUTH-001 — Email/password auth

**Statement (Event-driven + Unwanted):**
- When an authenticated user is not present and the user submits valid email and password to the login endpoint, the system shall create a server-side session in Redis and set an httpOnly cookie `sid`.
- If the submitted credentials are invalid, then the system shall respond with HTTP 401 and error code `INVALID_CREDENTIALS` without revealing whether the email exists.
- When the user invokes logout, the system shall destroy the session in Redis and clear the `sid` cookie.

**Rationale**: Auth là prerequisite cho mọi route còn lại. Session server-side (Redis) cho phép revoke tức thì, phù hợp internal portal.

**Maps to**: US-001 (Minh login → read), US-002 (Lan login → author), US-003 (Hùng login → author). Personas: P1, P2, P3.

**Acceptance hints**:
- Valid login → 200 + set cookie `sid`; subsequent request có `req.user`.
- Wrong password → 401 `INVALID_CREDENTIALS`.
- Wrong email → 401 `INVALID_CREDENTIALS` (không 404, để tránh user enumeration).
- Logout → 204 + cookie cleared.
- Password hash dùng bcryptjs (cost factor ≥ 10).

---

## FR-PROJ-001 — Project CRUD (minimal)

**Statement (Event-driven + Ubiquitous):**
- When an authenticated user with role `admin` submits a project creation request with a unique slug and a human-readable name, the system shall persist the project and return its canonical URL.
- The system shall expose a list endpoint that returns all projects the authenticated user can access, sorted by most-recently-updated first.

**Rationale**: Project là container top-level. V1 chỉ cần create + list (không edit/archive); tất cả user đều read được mọi project (no fine-grained permissions v1 — xem glossary).

**Maps to**: US-002 (Lan cần project trước khi tạo feature). Persona: Admin (minimal, v1).

**Acceptance hints**:
- Slug unique, lowercase, kebab-case, 3-60 chars (Zod regex).
- Non-admin POST → 403 `FORBIDDEN`.
- Duplicate slug → 409 `PROJECT_SLUG_TAKEN`.
- List endpoint trả `{ data: Project[] }`; rỗng khi chưa có project (không error).

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

## Non-functional Requirements (baseline v1)

### NFR-PERF-001 — Response time

- Read endpoints (feature detail, project landing) ≤ **300ms p95** server-side cho corpus v1 scale (≤ 10k feature, ≤ 100 project).
- Search ≤ **500ms p95** (xem FR-SEARCH-001).
- Write endpoints ≤ **500ms p95**.

Đo: pino log kèm `duration_ms`; target check bằng load test nhỏ cuối Bước 6 (không CI gate v1).

### NFR-A11Y-001 — Accessibility baseline

- WCAG 2.1 **Level A** cho mọi page read (feature detail + project landing). AA là stretch goal.
- Keyboard navigation cho toàn bộ link + form (không trap focus).
- Form có label liên kết `for`/`id`; error message có `aria-live="polite"`.
- Color contrast text ≥ 4.5:1 (kiểm qua shadcn/ui defaults — đã đạt).

v1 không bắt buộc screen reader test, nhưng không được break (không dùng `div` thay vì `button`, etc.).

### NFR-SEC-001 — Security baseline

- Password hash: bcryptjs cost ≥ 10.
- Session cookie: `httpOnly`, `sameSite=lax`, `secure=true` trong prod.
- Input validation: Zod ở mọi route boundary (body, query, params) — reject unknown fields (strict mode).
- SQL injection: chỉ dùng Drizzle parameterized queries — **không** string interpolation.
- Secrets: không commit `.env*`; production qua platform env vars / K8s Secret.
- Rate limit: **deferred** v1 (xem open questions) nhưng endpoint `/auth/login` có basic rate limit 10 req/min/IP qua Redis để chặn credential stuffing.
- CORS: chỉ cho phép origin `VITE_APP_ORIGIN` (1 origin cho v1).

### NFR-DATA-001 — Backup & retention

- Dev: không backup. `docker compose down -v` acceptable.
- Prod v1: **manual `pg_dump` weekly**, lưu off-host (document trong SETUP). User accountable.
- Retention: không xoá data tự động v1 (không có "archive" flow). Admin xoá manual qua SQL nếu cần.
- File uploads (screenshots): lưu Docker volume v1, back up cùng pg_dump step.

### NFR-OBS-001 — Logging & observability baseline

- pino JSON → stdout cho API.
- Mỗi request log: `request_id`, `user_id` (nếu có), `method`, `path`, `status`, `duration_ms`.
- Error log include stack trace + Zod issues khi có.
- Không log password, cookie value, full email (chỉ domain part khi cần debug).
- v2: structured metrics + dashboard (deferred).

---

## Deferred / out-of-scope v1 (documented to avoid churn)

| Item | Reason | Revisit when |
|---|---|---|
| Role-based permissions cứng (BA chỉ edit business, Dev chỉ edit tech) | YAGNI — v1 đi theo convention + audit trail | Team > 20 active author, có bad actor |
| Versioning / diff / comments | Complexity lớn, không critical cho onboarding | User feedback sau pilot |
| AI Q&A / RAG | Out of scope vision | v2 |
| Real-time collab (y-websocket / liveblocks) | Complexity + infra | v2+ |
| Native mobile | Web responsive đủ cho reader | v2+ |
| SSO (Google/Azure AD) | Local email/password đủ cho internal + solo maintain | Company mandates SSO |
| 2-way sync Jira/Figma/GitHub | OAuth + webhook infra tốn | User pain > embed card |
| Advanced search (fuzzy, typo tolerance) | Postgres FTS đủ v1 | Corpus > 10k hoặc p95 > 500ms |
| Server-side rate limit toàn bộ API | Chỉ auth endpoint v1 | Traffic pattern thực tế cho thấy abuse |
| Automated backup | Manual pg_dump v1 | Có > 1 người maintain |

---

## Open questions (sẽ giải quyết ở US spec hoặc task)

1. **Project-level access** — v1 mọi authenticated user đọc/ghi mọi project, hay project có members? → **Decide in US-002**. Default v1: tất cả authenticated user full access.
2. **Feature slug uniqueness** — unique per project (hiện tại) hay unique global? → Chốt per-project (FR-FEAT-001 đã nêu).
3. **Screenshot upload** — client upload trực tiếp multipart hay paste image URL từ chỗ khác? → **Decide in US-003 or later task**. MVP khả năng chọn paste URL trước (đơn giản hơn).
4. **Session TTL** — 7 ngày sliding, 30 ngày absolute, hay fixed? → Default 7d sliding, revisit sau pilot.

---

## Traceability

Mỗi user story (xem `.specs/stories/`) phải link ngược về ≥ 1 FR. Mỗi task (`tasks.md`) phải link về ≥ 1 US và có thể link FR nếu test verify FR trực tiếp. Ví dụ commit:

```
feat(api): seed feature with 5 sections (US-001 / FR-FEAT-002)
```
