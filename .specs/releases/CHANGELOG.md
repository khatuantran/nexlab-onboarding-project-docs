# Release notes

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-24 · [Keep-a-Changelog](https://keepachangelog.com/en/1.1.0/) format. M1 closed · M2 closed (US-002 + US-003 + US-004 shipped)._

Running log of user-facing changes. Thêm row dưới `[Unreleased]` khi commit ship feature/fix/change. Khi milestone đạt exit criteria → rename block thành `[Mx]` + release date, start new `[Unreleased]`.

Related: [roadmap.md](../roadmap.md), [traceability.md](../traceability.md).

---

## [Unreleased]

### Added

- **Admin user lifecycle — `/admin/users` page + 7 endpoints** ([US-007](../stories/US-007.md), 2026-05-15) — Admin nay có UI quản lý user mà không phải SSH DB. Trang `/admin/users` (admin gate FE + BE) hiển thị bảng user với filter `q` (ILIKE displayName + email), `role` (admin/author), `status` (active/archived/all). Action menu mỗi row: Sửa user, Reset mật khẩu, Disable/Enable. Header bổ sung link "Quản lý user" cho admin role.
  - **Migration `0007_users_lifecycle.sql`**: thêm `archived_at` (soft-delete / disable) + `last_login_at` (informational) cùng partial GIN index over active rows.
  - **Backend**: 7 endpoint mới — `GET /users` (extend với admin shape `{email, archivedAt, lastLoginAt}` cho admin caller, status filter), `GET /users/:id`, `POST /users` (invite + temp password 12-char), `PATCH /users/:id`, `POST /users/:id/archive`, `POST /users/:id/unarchive`, `POST /users/:id/reset-password`. Guard `wouldOrphanAdmins` + `CANNOT_MODIFY_SELF` chống lockout. Login route reject archived users với 403 `USER_DISABLED`; `touchLastLogin` fire-and-forget. `requireAuth` middleware destroy session khi user bị archive mid-session. Reset password scan Redis `sess:*` purge target's sessions.
  - **FE**: `pages/AdminUsersPage`, `components/users/{UsersTable, InviteUserDialog, EditUserDialog, UserActionsMenu, TempPasswordModal, UserStatusBadge}`, `queries/users.ts` thêm `useAdminUsers` + 5 admin mutations. Temp password reveal modal shared invite + reset flows (single-show + copy button + warning).
  - **Errors**: `USER_NOT_FOUND` 404, `USER_EMAIL_EXISTS` 409, `USER_DISABLED` 403, `CANNOT_MODIFY_SELF` 409, `LAST_ADMIN_PROTECTED` 409 (registry + Vietnamese copy).
  - **Spec artifacts**: FR-USER-002 mới + FR-USER-001 amend (admin field gating) + FR-AUTH-001 amend (USER_DISABLED login gate); [US-007](../stories/US-007.md) + [tasks.md](../stories/US-007/tasks.md) 7 task; traceability G5 row; api-surface Users section rewrite; error-codes 5 row mới.
  - **Tests**: 23 new api integration cases (list-admin, create, update, reset-password, users-lifecycle DB) + new `e2e/us-007.spec.ts`. **177/177 API + 24 shared + 132 web** unit tests xanh. E2E chạy local + CI manual.
  - Commits: `e662e50` (spec) → `b4e8a92` (T1) → `c0c4ede` (T2) → `4ea187b` (T2 web copy) → `818287e` (T3) → `d6af653` + `ae6787d` (T4) → `f4b1af0` (T5) → `da67d63` (T6) → this commit (T7 e2e + sync).

### Changed

- **Image storage migrated to Cloudinary CDN** ([CR-004](../changes/CR-004.md) Phase 2, 2026-05-14) — `POST /api/v1/features/:id/uploads` no longer writes to disk. The route streams the multer memory buffer through `cloudinary.uploader.upload_stream({ public_id: "onboarding-portal/<env>/<uuid>" })` and stores the returned `public_id` on the new `uploads.cloudinary_public_id` column (migration `0006`). Response `data.url` is now an absolute `https://res.cloudinary.com/...` URL that the FE renders directly via `<img src>` — sanitizer at [apps/web/src/lib/markdown.ts](../../apps/web/src/lib/markdown.ts) was already https-aware, so zero FE code change shipped. Two new error codes (`UPLOADS_DISABLED` 503 / `UPLOAD_PROVIDER_ERROR` 502) cover the new failure modes when `CLOUDINARY_URL` is missing or Cloudinary itself rejects. `GET /api/v1/uploads/:id` route + `createUploadsReadRouter` deleted entirely — Cloudinary's CDN serves binaries. apps/api Dockerfile no longer pre-creates `/data/uploads`. Tests: 9 cases for the new POST contract (happy path + 503 + 502 + traversal-safe public_id), 3 cases for the Cloudinary factory; full 147 api + 132 web + 24 shared green. Deployed to prod 2026-05-14 after `CLOUDINARY_URL` Fly secret set (`fly deploy --local-only`). Smoke: `GET /api/v1/uploads/<id>` now returns 404 application/json via global handler (route deleted), confirming the new Cloudinary-only contract. Commits: `966d1cc` (spec amend) → `b789e1e` (migration 0006) → `6046800` (SDK + factory + env) → `7eb3617` (route rewrite + read route deletion) → `e67816b` + `8e4a9c5` (progress sync + doc sweep) → this commit (deploy marker flip).

### Removed

- **Fly `uploads_volume` (1 GB SIN) destroyed** ([CR-004](../changes/CR-004.md) Phase 1, 2026-05-14) — stops the $0.26/month volume line. Upload route now writes to the container's ephemeral filesystem (Dockerfile still `mkdir -p /data/uploads`); files survive only until the next machine restart. 3 pre-existing volume files (2.7 MB total) lost — per BUG-003 none of them ever rendered on prod, so production data loss is nil. Phase 2 of CR-004 moves storage to Cloudinary CDN; until then, treat upload feature as "best-effort" on prod. Commits: `1f7d24d` (spec) → `fe28c04` (fly.toml drop `[[mounts]]`) → out-of-band `fly volumes destroy vol_vly2yydkd99pkxm4` → this commit (progress sync).

### Fixed

- **Uploaded images render broken in production** ([BUG-003](../bugs/BUG-003.md), 2026-05-14) — Pilot prod (Netlify FE + Fly BE per [CR-003](../changes/CR-003.md)) returned broken-image icons for every markdown body that embedded `![alt](/api/v1/uploads/:id)`. Two-layer cause: (1) relative URL resolved against the Netlify origin → SPA fallback `index.html` instead of binary; (2) `GET /uploads/:id` required `requireAuth`, which cross-origin `<img>` requests cannot reliably satisfy (third-party cookie blocked in Safari + post-2026 Chrome). **Fix**: FE rewrites `/api/v1/uploads/:id` and legacy `/uploads/:id` img src to absolute `${VITE_API_BASE_URL origin}/api/v1/uploads/:id` at sanitize-hook time (zero markdown migration — handles existing DB rows); BE drops `requireAuth` on the read route, falling back to UUIDv4 (~122 bits) as the unguessable token (matches FR-PROJ-001 v1 access model). MIME whitelist + path-traversal guard remain. FR-UPLOAD-001 acceptance hint amended to document public-read contract. Tests: 4 new green (1 BE + 3 FE) — full 144 api + 132 web + 24 shared green. Commits: `ba0645f` (spec) → `0c3b753` (failing tests) → `db94afc` (fix) → this commit (progress sync).

### Changed

- **Search v2.1 — prefix + accent-insensitive + fuzzy matching** ([US-006](../stories/US-006.md), 2026-05-01) — Catalog search now matches by **token prefix** (`q=a` hits `A3Solutions`, `q=đăn` hits `Đăng nhập`), strips **Vietnamese diacritics** transparently (`q=dang nhap` ↔ `Đăng nhập`), and falls back to **trigram fuzzy match** when the user typo's a short field (`q=ondoarding` still finds `onboarding`). Postgres-only (`unaccent` + `pg_trgm` extensions + `simple_unaccent` text-search config); zero new infra cost per [ADR-002](../adr/ADR-002-deployment-platform.md). Response shape unchanged — fully backward-compatible with US-005 callers; no FE change required.
  - **Migration `0005_search_unaccent_trgm.sql`**: enable `unaccent` + `pg_trgm`, define `immutable_unaccent` wrapper (built-in unaccent is `STABLE`; need `IMMUTABLE` for functional indexes), define `simple_unaccent` text-search config (`COPY = pg_catalog.simple` with mapping `WITH unaccent, simple` so highlighting + tsquery both auto-strip diacritics), rebuild the 3 `*_search_vector` trigger functions to wrap content with `immutable_unaccent` + backfill, add 4 trigram GIN indexes (`projects.name`, `features.title`, `users.display_name`, `uploads.filename`).
  - **Backend**: new helper `apps/api/src/repos/search/buildTsQuery.ts` sanitizes input to Unicode letter/digit tokens, suffixes each with `:*`, AND-joins with `&` — `to_tsquery` calls now safe against `&|!()` etc. without raising syntax errors. searchRepo per-entity (projects/features/uploads) gains an `OR immutable_unaccent(<field>) % immutable_unaccent($q)` fuzzy branch with `greatest(ts_rank, similarity)` ranking. Authors switch from raw ILIKE chain to unaccented + trigram fallback so `q=hung` matches `Lê Văn Hùng`.
  - **Tests**: 8 new DB cases verify extensions + immutable_unaccent volatility + 4 trigram indexes; 7 new buildTsQuery unit cases; 7 new repo cases (AC-1 prefix, AC-2 feature title, AC-3a/b accent both directions, AC-4 fuzzy, AC-5 author, AC-7 sanitize); 2 new route integration cases; 1 new e2e scenario. **Full 144/144 API + 24 shared + 128 web + e2e green.** Benchmark `EXPLAIN ANALYZE` `q=a` → 0.15ms (target was ≤500ms p95).
  - **Spec artifacts**: FR-SEARCH-004 added to [02-requirements.md](../02-requirements.md); [US-006](../stories/US-006.md) + [tasks.md](../stories/US-006/tasks.md) with 7 AC; traceability + api-surface updated.
  - Commits: `ec750fc` (spec) → `648242b` (T1) → `1b0e75e` (T2) → `630334c` (T3) → `adbdfa3` (T4) → this commit (T5 e2e + sync).

### Added

- **Search v2 — multi-entity grouped + filters** ([US-005](../stories/US-005.md), 2026-04-25) — Catalog search now returns grouped hits across **Projects / Features / Sections / Authors / Uploads**, ranked per group (≤5 hits each). Postgres FTS expanded to projects (`name` weight A + `description` weight B) and uploads (new optional `caption` column + `filename` weight A + caption weight B) via hand-written migration `0004_search_vectors_v2.sql` mirroring the 0001 trigger pattern; archived projects excluded from every group.
  - **Filters** (URL state, only non-default values serialized): section type multi-select (5 enum), author single-select (combobox + debounced ILIKE 300ms via new `GET /api/v1/users`), updated-since (24h / 7d / 30d / Mọi lúc preset → ISO round-trip), status (filled / partial / empty toggle-clear).
  - **Result cards** per entity: ProjectResultCard (gradient avatar + description snippet + featureCount + RelativeTime); SectionResultCard (section-type icon plate + breadcrumb + sanitized `<mark>` snippet + author + RelativeTime + deep-link `#section-{type}`); AuthorResultCard (Avatar + role badge + touchedFeatureCount + placeholder toast per skeleton-UI policy); UploadResultCard (file icon + filename + optional caption + breadcrumb + RelativeTime, links to parent feature `#section-screenshots`); FeatureResultCard reuses redesigned SearchResultRow re-typed to FeatureHit. EntityGroup wrapper skips when `count = 0`.
  - **Backend**: `GET /api/v1/search` response shape **breaking change** v1 `data: SearchHit[]` → v2 `data: { projects, features, sections, authors, uploads }`. Filters validated by Zod; explicit SEARCH_QUERY_EMPTY / SEARCH_QUERY_TOO_LONG retained for the `q` field. New `GET /api/v1/users?q=&role=` returns id + displayName + role only (excludes email + passwordHash) sorted asc displayName, limit 50.
  - **Spec artifacts** (Phase 0): FR-SEARCH-002 / FR-SEARCH-003 / FR-USER-001 added to [02-requirements.md](../02-requirements.md); [US-005](../stories/US-005.md) + [tasks.md](../stories/US-005/tasks.md) with 15 AC; traceability + glossary (Section hit, Upload caption, Business flow = section-type `user-flow`) + api-surface (search v2 row + users endpoint) updated; [ui/search.md](../ui/search.md) v2 spec layered over the v1 Workspace section.
  - **Tests**: 8 migration tests (search-vectors-v2.test.ts), 12 repo tests (searchRepo.v2.test.ts), 10 route tests (search-v2.test.ts), 6 users-list tests, updated SearchPage test fixtures, new `e2e/us-005.spec.ts`. **127 web + 117 api + 24 shared unit tests + 5/5 Playwright E2E** green.
  - Commits: `d570bd1` (T1) → `3de57a5` (T2 + T3) → `2da1d2e` (T4) → `df8d877` (T5) → `a9fbf86` (T6 + T7 + T8 + T9) → this commit (T10 + sync).

- **UI Quality Uplift v1** ([CR-002](../changes/CR-002.md), 2026-04-25) — Workspace-style refresh across all 5 shipped screens. New charter [visual-language.md](../ui/visual-language.md) v2 establishes baseline (typography hierarchy, color rules, surface depth, motion, density per screen, illustration policy, a11y floor, anti-patterns, Workspace component patterns: StatChip / FloatStat / MiniStat / ProgressStrip / SectionDots / AvatarStack / TabBar / DecorativeMark / EmptyDashedCard / TipCard).
  - **HomePage** ([Phase 2-1 `1d76919`](https://example/commit)): hero row với 3 StatChips + 2-col card grid (revoked old "full-width row" Gate 1 decision) + ProjectFilterPills (Tất cả/Đang viết/Cần bổ sung) + ProjectCard có gradient avatar 44×44 + ProgressBar block + AvatarStack contributors + admin "Tạo project mới" dashed tile.
  - **ProjectLandingPage** ([Phase 2-2 `8da2aff`](https://example/commit)): ProjectHero gradient panel + DecorativeMark NxLogo watermark + 4 inline MiniStats (Features / Sections progress primary / Đang chỉnh placeholder / Cập nhật cuối) + action cluster (Theo dõi/Repo placeholder + Thêm feature author + ⋯ admin) + ProjectTabs (Catalog active / 3 placeholder tabs Đang phát triển v2) + redesigned FeatureCard với status-tinted icon plate + ProgressBar + SectionDots row.
  - **FeatureDetailPage** ([Phase 2-3 `2a0caad`](https://example/commit)): flat header với status badge + v2 placeholder + last updater + h1 + action cluster (Xem PR/Theo dõi placeholder + Sửa nhanh scroll-to-empty + ⋯ overflow); ProgressStrip 5 segments với labels; 3-col layout (TOC sticky 240 / main / ActivityRail sticky 280 with hardcoded dummy items + TipCard "MẸO ONBOARDING"); SectionToc redesign với section icons + check-disc filled / dashed-circle empty + active left rail + "Thêm section" placeholder; FeatureSections wrapped in SectionBlock với icon plate + ownership inline + EmptyDashedCard "Dùng template" placeholder.
  - **SearchPage** ([Phase 2-4 `4407c53`](https://example/commit)): hero block (eyebrow + h1 với inline primary highlight + "{N} feature · scope") + filter row consolidated rounded-xl panel (PHẠM VI scope chips + Loại/Sắp xếp dropdown placeholders + count) + SearchResultRow với FolderOpen icon plate + h2 + breadcrumb context + sanitized snippet `<mark>` highlighted bg-primary-100 + idle state với TipCard 3 search tips bullets + zero-result state với Bỏ filter / Quay về catalog actions.
  - **LoginPage** ([Phase 2-5 `a2b347d`](https://example/commit)): 2-pane split (xl≥1280px) — left form 540px white với eyebrow + h2 "Chào mừng quay lại 👋" + email/password fields 48px height với leading icons + Quên link placeholder + custom 18×18 Remember checkbox + primary submit shadowed với ArrowRight + Google SSO outline placeholder + footer "Liên hệ admin" placeholder; right LoginBrandPanel với DecorativeMark watermark + 4 FloatStat collage (FolderOpen 42 / Users 18 / CheckCircle2 86% / Clock 2.3h hardcoded) + testimonial card glassmorphism với hardcoded Ngọc Linh persona.
  - 14 new shared primitives in `apps/web/src/components/common/` ([Phase 2-0 `9cbad37`](https://example/commit)): `avatarHash` util, ProjectAvatar / Avatar / AvatarStack / StatChip / MiniStat / ProgressBar / SectionDots / DecorativeMark / EmptyDashedCard / TipCard / ProgressStrip / FloatStat / TabBar.
  - `CreateProjectDialog` + `CreateFeatureDialog` accept `customTrigger?: ReactElement` for fully custom trigger override (used by dashed tile pattern).
  - Skeleton-UI policy adopted (charter v2): build full reference UI, dummy/placeholder for data without backend (presence indicators hidden, activity feed hardcoded with 1-2 derived items, Activity/Members/Settings tabs render "Đang phát triển v2" empty state, Theo dõi/Repo/Quên/SSO/Liên hệ admin placeholder toasts).
  - 24 shared + 81 api + 127 web unit tests green; 4/4 Playwright E2E green (US-001..US-004 unchanged behavior).

- **Nexlab design system** adopted (ADR-003) — full token rewrite (orange primary `27 88% 51%` + gold secondary + error/success/warning/info semantic tokens + primary ramp 50-900), self-hosted Roboto + Inter (Latin + Vietnamese subsets via `@fontsource`), Tailwind config colors/borderRadius/boxShadow/fontFamily extended, derived dark palette, `NxLogo` brand component (lockup + mark variants), re-style shadcn primitives (Button/Input/Label/Textarea/Card/Dialog/DropdownMenu/Toaster) + layout + feature components + 5 screens re-skinned. 87 unit + 70 api + 3 E2E green zero regression (T-DS-1..13, 2026-04-24).

### Changed

- **FE host: Cloudflare Pages → Netlify** ([CR-003](../changes/CR-003.md) / [ADR-002](../adr/ADR-002-deployment-platform.md), 2026-04-26) — Netlify replaces Cloudflare Pages for the FE static deploy. Cloudflare merged Pages into the Workers UI in early 2026, and the default project type ran `wrangler deploy` at the repo root, which fails on a pnpm monorepo. New repo-root [`netlify.toml`](../../netlify.toml) pins build (`pnpm install --frozen-lockfile && pnpm --filter @onboarding/web build`), publish dir (`apps/web/dist`), Node 20 + pnpm 9.15.0, and the SPA `/* → /index.html` 200 redirect (Netlify does not auto-handle SPA fallback like Cloudflare did). BE stack (Fly.io + Neon + Upstash) unchanged. Vercel evaluated but skipped — Hobby ToS restricts commercial use. RUNBOOK §1.3 / §2.2 / §3 / §4 / §6 swapped accordingly.
- ADR-001 + ADR-002 updated với Related links to ADR-003 (font stack + dark palette source superseded by Nexlab DS adoption).

### Deprecated

- (none)

### Removed

- (none)

### Fixed

- **Theme toggle requires only one click to flip light ↔ dark** ([BUG-002](../bugs/BUG-002.md), 2026-04-25 — fix `51d0543`, regression test `95f6bb5`). The 3-state cycle (`system → light → dark → system`) was masking the click on dark-OS hosts: clicking from `dark` landed on `system`, which re-resolved to dark, leaving the visible page unchanged and forcing a second click. `cycleTheme` now reads `resolvedTheme` and toggles light ↔ dark; `system` is no longer in the click cycle (still the default before any explicit choice and still tracks OS changes while active). ThemeToggle's icon + aria-label bind to `resolvedTheme`. 6/6 ThemeToggle tests green.

### Security

- (none)

---

## [US-003] — 2026-04-24 (Tech-notes + Screenshots + Embed + Ownership)

US-003 implementation complete — 7/7 tasks. Dev bổ sung `tech-notes` + `screenshots` với image upload (5 MiB, magic-byte sniff), GitHub/Figma/Jira embed cards inline cho whitelisted autolinks, per-section "Cập nhật bởi" ownership hiển thị dưới heading. All 5 sections now editable (tech-notes + screenshots joined business/user-flow/business-rules). Playwright E2E covers full happy path embed + upload + reload persistence.

### Added

- T1 — Shared `uploadResponseSchema` + `UPLOAD_MIME_WHITELIST` + `UPLOAD_MAX_BYTES` (5 MiB) + `uploads` pgTable migration + `file-type` dep (`b285b99`).
- T2 — `POST /api/v1/features/:id/uploads` multipart endpoint: multer memoryStorage + 5 MiB fileSize limit → 413 FILE_TOO_LARGE, file-type magic-byte sniff → 415 UNSUPPORTED_MEDIA_TYPE (PDF-spoof + GIF rejected), UUID filename on disk + sanitized originalname in DB (`b082416`).
- T3 — `GET /api/v1/uploads/:id` session-protected static serve: DB lookup → Content-Type from row.mime_type, resolved path + sep boundary check, `Cache-Control: private 5 min` (`4690b8e`).
- T4 — Embed parser `embedFromUrl` + markdown post-process: DOMParser walk `<a>` tags, swap whitelisted autolinks (github.com, figma.com, atlassian.net) with embed-card HTML (inline brand SVG + path + domain subtitle). Custom-labeled links stay plain anchors. Strict hostname match prevents `evil.com/github.com` spoof (`a262cf3`).
- T5 — `useUpload(featureId)` mutation + `UploadButton` component + SectionEditor conditional toolbar (tech-notes + screenshots only). Cursor position captured via textarea ref, `![alt](url)` spliced at last-known selectionStart after 201, focus + caret restored via queueMicrotask (`f75f75a`).
- T6 — Drop `EDITABLE` gate → all 5 sections editable. `SectionResponse.updatedByName` hydrated via `LEFT JOIN users` ở feature repo; PUT response sets it from `req.user.displayName`. FE subtitle "Cập nhật bởi @{name}, {relative time}" under filled sections; null renders `(người dùng đã xóa)` (`dd1c213`).
- T7 — Playwright E2E `e2e/us-003.spec.ts`: admin tạo project+feature → logout → dev login → tech-notes embed autolink → screenshots `setInputFiles(tiny.png)` → save → reload → assert both embed-card + `<img src=/api/v1/uploads/>` + ownership line persist. Full E2E suite 4/4 green (US-001 + US-002 + US-003 + US-004) (`c6c57fc`).

### Fixed

- Markdown sanitizer img-src allowlist: `/uploads/` → `/api/v1/uploads/` để DOMPurify không strip src của uploaded images (caught by E2E, not unit tests). Committed cùng T7 (`c6c57fc`).

### Added (requirements)

- [FR-UPLOAD-001](../02-requirements.md#fr-upload-001--image-upload-for-screenshots) + [FR-EMBED-001](../02-requirements.md#fr-embed-001--external-link-embed) now implemented end-to-end.

### Design system

- Icons added: `ImagePlus` (Upload toolbar). Components: `UploadButton`, embed-card HTML (post-process MarkdownView, no separate component).

---

## [US-004] — 2026-04-24 (Project Catalog + Admin Lifecycle)

US-004 implementation complete — 8/8 tasks. Project catalog `/` với list rows (name/description/featureCount/relative time), admin-only edit metadata + archive qua `⋯` overflow menu trên project landing header. Archive redirect `/` + excludes từ catalog + makes detail URL 404. Playwright E2E covers full happy path catalog → edit → archive → redirect.

### Added

- T1 — Shared `updateProjectRequestSchema` + `ProjectSummary` type + `projects.archived_at` column migration (`e9898c7`).
- T2 — `GET /api/v1/projects` list endpoint: `ProjectSummary[]` non-archived, sorted `updated_at` desc, `featureCount` qua LEFT JOIN (`2939f56`).
- T3 — `PATCH /api/v1/projects/:slug` + `POST /api/v1/projects/:slug/archive` admin-only endpoints. PATCH update name/description (slug immutable — Zod strips); archive set `archived_at` (idempotent 204). `GET /projects/:slug` filter archived → 404 (`3ae766f`).
- T4 — `DropdownMenu` UI primitive: shadcn-style wrapper around `@radix-ui/react-dropdown-menu`. 6 sub-components exported (Root/Trigger/Portal/Content/Item/Separator/Label) (`54b276c`).
- T5 — HomePage `/` catalog: list rows với name + description (line-clamp-2) + featureCount + relative time, ChevronRight arrow, 4 states (loading skeletons / list / empty / error). Admin empty state có inline CTA "Tạo project đầu tiên" reuse CreateProjectDialog (`triggerLabel` prop). `useProjects()` TanStack Query, key `["projects"]` (`6981c07`).
- T6 — `EditProjectDialog` + `useUpdateProject(slug)` mutation. RHF+Zod, slug readonly với hint, "Lưu" (Check icon), sonner success, native confirm cho dirty cancel. Controlled dialog (open + onOpenChange props) (`c2d7988`).
- T7 — `ProjectActionsMenu` trên ProjectLandingPage header. `⋯` (MoreHorizontal) trigger → DropdownMenu với "Sửa project" (opens EditProjectDialog) + "Lưu trữ project" (destructive). Archive flow: native confirm `'Lưu trữ project "X"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.'` → `useArchiveProject` POST → sonner "Đã lưu trữ project" + `navigate("/")`. AdminGate-wrapped (`904e9c8`).
- T8 — Playwright E2E `e2e/us-004.spec.ts`: login admin → create seed project → return catalog → click row → detail → ⋯ → "Sửa project" → rename → verify heading → ⋯ → "Lưu trữ" → auto-accept confirm → redirect `/` → archived project gone. Full E2E suite 3/3 green (US-001 + US-002 + US-004) (`a9282d6`).

### Added (requirements)

- [FR-PROJ-002](../02-requirements.md#fr-proj-002--project-metadata-edit--archive) — admin metadata edit + soft-delete archive via `archived_at`. FR-PROJ-001 clarified: catalog list excludes archived.

### Design system

- Icons added: `Check` (retroactive US-002 T7), `MoreHorizontal`, `Archive`. Component: `DropdownMenu` primitive (requires `@radix-ui/react-dropdown-menu`).

---

## [US-002] — 2026-04-23 (BA Author Path)

US-002 implementation complete — 8/8 tasks. Admin tạo project + author tạo feature (5 section atomic init) + edit 3 business sections in-place với live markdown preview. Playwright E2E smoke covers full happy path + persist-after-reload.

### Added

- T1 — Shared Zod schemas: `createProjectRequestSchema`, `createFeatureRequestSchema`, `updateSectionRequestSchema` (`e218c8e`).
- T2 — `POST /api/v1/projects` endpoint: admin-only create với 201/409 `PROJECT_SLUG_TAKEN`/400/403 branches (`23f6c91`).
- T3 — `POST /api/v1/projects/:slug/features` endpoint: author+ create feature + 5-section atomic init; 201/404/409/401/400 branches (`4869a68`).
- T4 — `CreateProjectDialog` FE: admin-gated dialog trong AppHeader, Radix Dialog + RHF + Zod, auto-derive slug với diacritic strip, 409 inline error, navigate sau 201 (`956b959`).
- T5 — `PUT /api/v1/features/:featureId/sections/:type` endpoint: 64 KiB byte limit → 413 `SECTION_TOO_LARGE`, feature.updated_at bump, sibling sections stable (`ddfb9ab`).
- T6 — `CreateFeatureDialog` FE: author-gated trigger trên ProjectLandingPage, Radix Dialog + RHF + Zod, slug auto-derive từ tiêu đề, 409 inline error, navigate sau 201 (`522889c`).
- T7 — `SectionEditor` FE edit-in-place: per-section pencil toggle (business/user-flow/business-rules), 2-col markdown source + preview (200ms debounce), byte counter, sonner toasts (success + 413), native confirm on dirty cancel. Per-section state độc lập. Sonner `<Toaster>` mounted globally (`03c83ba`).
- T8 — Playwright E2E smoke `e2e/us-002.spec.ts`: login admin → tạo project → tạo feature → edit business section → reload → assert persist. Full E2E suite 2/2 green (US-001 + US-002) (`a482ecd`).

### Fixed

- `pnpm dev` tự động kill process zombie giữ port 3001 trước khi start (SIGTERM pre-flight) — EADDRINUSE hết xuất hiện giữa sessions. Thêm `pnpm stop` để stop chủ động cả API + Web (`8d17e09`).
- US-001 E2E test label drift: seed feature title Vietnamese ("Đăng nhập bằng email") + section headings VN theo T8.5 design-system nhưng test regex English. Updated regex để match real labels (`a482ecd`).

### Docs

- DoD checkbox discipline: CLAUDE.md §Post-task progress sync mandates flip `[ ]` → `[x]` cùng commit sync (`9026801`), backfill 65 boxes cho US-001 T3-T10 + US-002 T1-T7 (`ba79822`).
- `api-surface.md` + `error-codes.md` elevated thành dedicated bullets trong progress-sync checklist.

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
