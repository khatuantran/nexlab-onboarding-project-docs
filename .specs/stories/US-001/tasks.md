# US-001 — Task Breakdown

*Story*: [US-001 — Dev reads và search feature catalog](../US-001.md)
*Total estimate*: ~26h (solo, TDD pace; story-level estimate 10-14h dùng pair/ideal, tasks là pessimistic)
*Last updated*: 2026-04-22

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-001 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **Definition of Done (DoD)** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific test file).
  2. `pnpm lint` + `pnpm typecheck` ở root không lỗi.
  3. AC liên quan trong US-001 đã có automated test coverage.
  4. Task commit landed trên `main`.
- **Order**: tasks tuần tự; không được bắt đầu T<N+1> khi T<N> chưa DoD (trừ ghi chú song song).

---

## Task Summary

| # | Title | Effort | AC covered | FR touched |
|---|---|---|---|---|
| [T1](#t1--monorepo-bootstrap--tooling) | Monorepo bootstrap + tooling | 3h | — (foundation) | — |
| [T2](#t2--docker-compose--api-skeleton) | Docker Compose + API skeleton + health | 3h | infra for all | — |
| [T3](#t3--db-schema--migration--seed) | DB schema + Drizzle migration + seed | 4h | AC-3, AC-5, AC-6 (data) | FEAT-002 |
| [T4](#t4--auth-endpoints--session-middleware) | Auth endpoints + session middleware | 3h | AC-1, AC-2, AC-10, AC-11 | AUTH-001 |
| [T5](#t5--read-api--search-api) | Feature read API + search API | 4h | AC-3, AC-5, AC-7, AC-9 | FEAT-002, READ-001, SEARCH-001 |
| [T6](#t6--web-skeleton--auth-guard--login-page) | Web skeleton + auth guard + login | 4h | AC-1, AC-2, AC-10, AC-11 | AUTH-001 |
| [T7](#t7--landing--feature-detail-pages) | Project landing + feature detail render | 4h | AC-3, AC-4, AC-5, AC-6 | READ-001, FEAT-002 |
| [T8](#t8--search-page--e2e-smoke--setup-validation) | Search page + Playwright smoke + SETUP validation | 3h | AC-7, AC-8, AC-9 + all AC | SEARCH-001 |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.
**Parallel potential**: T6 có thể start sau T2 (không chờ T3/T4/T5) cho login UI shell, nhưng login functional cần T4.

---

## T1 — Monorepo bootstrap + tooling

**Effort**: 3h
**FR**: —
**Deps**: —

### Goal
Repo có `apps/web`, `apps/api`, `packages/shared` (empty), pnpm workspace hoạt động, lint/format/typecheck/test runner configured. Sau T1, `pnpm install` + `pnpm lint` + `pnpm test` chạy được (test 0 vì chưa có file).

### TDD cycle
Task này ít test unit truyền thống; viết 1 **smoke script** làm contract:

1. **Red**: tạo `scripts/smoke.sh` check:
   - `pnpm -w run lint` exit 0
   - `pnpm -w run typecheck` exit 0
   - `pnpm -r run test --passWithNoTests` exit 0
   Chạy → fail vì chưa có config.
2. **Green**: thiết lập:
   - `package.json` root với `workspaces: ["apps/*", "packages/*"]` (pnpm).
   - `pnpm-workspace.yaml`.
   - Root `tsconfig.base.json` với `strict: true`, `target: ES2022`, `moduleResolution: Bundler`.
   - `apps/web/package.json`, `apps/api/package.json`, `packages/shared/package.json` stub (name `@onboarding/*`).
   - `.eslintrc.cjs` + `.prettierrc` ở root.
   - `.husky/pre-commit` chạy `lint-staged`.
   - `vitest.config.ts` ở root (shared defaults).
3. **Refactor**: move shared TS config vào `tsconfig.base.json`, child projects extend.

### DoD
- [ ] `pnpm install` clean (no warnings về workspace).
- [ ] `pnpm lint` pass với 0 file.
- [ ] `pnpm typecheck` pass.
- [ ] `pnpm test --passWithNoTests` exit 0.
- [ ] Husky pre-commit hook blocks commit khi lint fail.
- [ ] `.gitignore` cover `node_modules`, `dist`, `.env.local`, `data/`.

### Commit
`chore(infra): bootstrap pnpm monorepo + tooling (US-001 / T1)`

---

## T2 — Docker Compose + API skeleton

**Effort**: 3h
**FR**: infra (mọi FR phụ thuộc)
**Deps**: T1

### Goal
Express server chạy `tsx watch`, `/api/v1/health` endpoint trả `{ status, db, redis, version }`. Docker Compose start postgres + redis. Test unit chạy với Vitest + Supertest.

### TDD cycle
1. **Red**: `apps/api/src/routes/health.test.ts`:
   - `GET /api/v1/health` → 200, body `{ status: 'ok', db: 'ok', redis: 'ok' }`.
   Chạy → fail (no route).
2. **Green**:
   - `apps/api/src/server.ts`: Express app + router mount `/api/v1`.
   - `apps/api/src/routes/health.ts`: ping Postgres qua `drizzle` (chưa schema, chỉ `select 1`) + ping Redis qua `ioredis` / `connect-redis` client.
   - Pino logger middleware với request-id (uuid).
   - `apps/api/src/index.ts`: start server on `API_PORT`.
   - `infra/docker/docker-compose.yml`: services `postgres` (16-alpine, healthcheck `pg_isready`), `redis` (7-alpine, healthcheck `redis-cli ping`), volumes, env từ `.env.local`.
   - `.env.example` commit với placeholder.
3. **Refactor**: tách config loader (`apps/api/src/config.ts`) dùng Zod parse env.

### DoD
- [ ] `docker compose up -d postgres redis` → cả 2 healthy trong 30s.
- [ ] `pnpm --filter @onboarding/api dev` → listen 3001.
- [ ] `curl /api/v1/health` returns `{status:"ok", db:"ok", redis:"ok"}`.
- [ ] `pnpm --filter @onboarding/api test` green (health test dùng Supertest + testcontainer hoặc mock DB/Redis — **dùng real containers** để match NFR-OBS-001 intent; dev DB kết nối `.env.test` port khác nếu cần).
- [ ] Error format `{ error: { code, message } }` middleware đã có (sẽ verify ở T5).

### Commit
`feat(api): health endpoint + docker compose infra (US-001 / T2)`

---

## T3 — DB schema + Drizzle migration + seed

**Effort**: 4h
**FR**: FR-FEAT-002
**Deps**: T2

### Goal
4 bảng: `users`, `projects`, `features`, `sections`. Migration generated + applied. Seed script tạo 1 admin + 1 author + 1 project + 1 feature 5-section filled. `tsvector` column cho FTS ready (dùng cho T5 search).

### Schema (Drizzle)
- `users`: `id uuid pk`, `email text unique`, `password_hash text`, `display_name text`, `role text check in ('admin','author')`, `created_at timestamptz`.
- `projects`: `id uuid pk`, `slug text unique`, `name text`, `description text nullable`, `created_by uuid fk users`, `created_at`, `updated_at`.
- `features`: `id uuid pk`, `project_id uuid fk projects`, `slug text`, `title text`, `created_at`, `updated_at`, unique `(project_id, slug)`.
- `sections`: `id uuid pk`, `feature_id uuid fk features`, `type text check in ('business','user-flow','business-rules','tech-notes','screenshots')`, `body text default ''`, `updated_by uuid fk users nullable`, `updated_at timestamptz`, unique `(feature_id, type)`.
- `features.search_vector` generated column `tsvector` từ `title` + latest sections bodies (hoặc dùng trigger update).

### TDD cycle
1. **Red**: `apps/api/src/db/schema.test.ts`:
   - After migration + seed, query `select count(*) from sections where feature_id = <seed>` → 5.
   - `select role from users where email='admin@local'` → `admin`.
   Chạy → fail (no migration).
2. **Green**:
   - `apps/api/src/db/schema.ts` declare bảng với Drizzle.
   - `pnpm db:generate` → produce `apps/api/src/db/migrations/0001_init.sql`.
   - `drizzle.config.ts` ở apps/api.
   - `apps/api/src/db/seed.ts`: bcrypt hash `dev12345`, insert admin + author + project "Demo Project" (slug `demo`) + feature "Login with email" (slug `login-with-email`) + 5 sections với markdown mẫu (business/user-flow/business-rules/tech-notes/screenshots).
   - `pnpm db:migrate` + `pnpm db:seed` scripts trong root `package.json`.
3. **Refactor**: nếu search_vector dùng trigger thay generated column, viết trigger SQL rõ ràng comment why.

### DoD
- [ ] `pnpm db:migrate` run clean từ empty DB.
- [ ] `pnpm db:seed` → console log "Seeded 1 project, 1 feature (5 sections), 2 users".
- [ ] Seed idempotent (re-run không duplicate hoặc error — dùng `on conflict do nothing`).
- [ ] Schema test green.
- [ ] `pnpm db:check` (drizzle-kit) consistent.

### Commit
`feat(api): db schema + seed data for demo project (US-001 / T3 / FR-FEAT-002)`

---

## T4 — Auth endpoints + session middleware

**Effort**: 3h
**FR**: FR-AUTH-001
**Deps**: T3

### Goal
`POST /auth/login`, `POST /auth/logout`, `GET /auth/me` hoạt động với session Redis. Middleware `requireAuth` attach `req.user` hoặc trả 401.

### TDD cycle
1. **Red**: `apps/api/src/routes/auth.test.ts`:
   - POST /auth/login valid → 200, Set-Cookie `sid=...`, body `{ data: { user: { id, email, displayName, role } } }`.
   - POST /auth/login wrong password → 401 `INVALID_CREDENTIALS`.
   - POST /auth/login non-existent email → 401 `INVALID_CREDENTIALS` (same code, chống enumeration).
   - GET /auth/me với cookie → 200 user.
   - GET /auth/me without cookie → 401.
   - POST /auth/logout với cookie → 204, sau đó GET /auth/me → 401.
   - Rate limit: 11 login attempts từ 1 IP trong 1 phút → req thứ 11 trả 429 `RATE_LIMITED`.
2. **Green**:
   - Install `express-session`, `connect-redis`, `bcryptjs`.
   - `apps/api/src/middleware/session.ts`: session config (cookie `sid`, httpOnly, sameSite=lax, secure=env, maxAge 7d).
   - `apps/api/src/routes/auth.ts`: login (bcrypt compare, set `req.session.userId`), logout (destroy), me (requireAuth).
   - `apps/api/src/middleware/requireAuth.ts`: check `req.session.userId` → query user → attach `req.user`, else 401.
   - Rate limit trên `/auth/login` dùng Redis counter (SET + EXPIRE) — helper đơn giản, không thêm lib.
3. **Refactor**: error code constants ở `packages/shared/src/errors.ts`.

### DoD
- [ ] Auth routes tests all green.
- [ ] Password comparison constant-time (bcryptjs default OK).
- [ ] Session persist sau server restart (nếu Redis persist — v1 accepted loss, document).
- [ ] Error response schema `{ error: { code, message } }` consistent.
- [ ] `packages/shared/src/errors.ts` export `ErrorCode` enum.

### Commit
`feat(api): auth login/logout + session middleware (US-001 / T4 / FR-AUTH-001)`

---

## T5 — Read API + search API

**Effort**: 4h
**FR**: FR-FEAT-002, FR-READ-001, FR-SEARCH-001
**Deps**: T4

### Goal
- `GET /api/v1/projects/:slug` — project meta + feature list sorted updated-desc + section-filled count.
- `GET /api/v1/projects/:slug/features/:featureSlug` — feature + 5 sections in fixed order.
- `GET /api/v1/search?q=...` — FTS qua Postgres `tsvector` + `ts_rank` + `ts_headline` snippet.

### TDD cycle
1. **Red**: `apps/api/src/routes/{projects,features,search}.test.ts`:
   - GET /projects/demo (authenticated) → 200 với feature list, `filledCount` = 5 cho seeded feature.
   - GET /projects/does-not-exist → 404 `PROJECT_NOT_FOUND`.
   - GET /projects/demo unauthenticated → 401.
   - GET /projects/demo/features/login-with-email → 5 sections trong thứ tự `[business, user-flow, business-rules, tech-notes, screenshots]`.
   - GET /search?q=login → top result là seeded feature, có `snippet` với `<mark>` tag.
   - GET /search?q= (empty) → 400 `SEARCH_QUERY_EMPTY`.
   - GET /search?q=zzzzz → 200 `{ data: [] }`.
2. **Green**:
   - `apps/api/src/repos/projectRepo.ts`: `getProjectBySlug`, `listFeaturesByProject` (JOIN với sections COUNT filled).
   - `apps/api/src/repos/featureRepo.ts`: `getFeatureBySlug` với sections ordered by `CASE type WHEN 'business' THEN 1 ... END`.
   - `apps/api/src/repos/searchRepo.ts`: query `SELECT ..., ts_rank(search_vector, plainto_tsquery(...)) as rank, ts_headline(...) as snippet FROM features WHERE search_vector @@ plainto_tsquery(...) ORDER BY rank DESC LIMIT 20`.
   - `apps/api/src/services/*`: thin wrappers (validate slug format, error mapping).
   - `apps/api/src/routes/{projects,features,search}.ts`: Zod validate params/query + call service.
   - Shared Zod schemas ở `packages/shared/src/schemas/feature.ts`.
3. **Refactor**: extract section ordering constant `SECTION_ORDER` dùng shared FE/BE.

### DoD
- [ ] Tất cả test route green.
- [ ] p95 < 300ms đo qua console (không strict gate).
- [ ] Search trả `snippet` escaped HTML ngoại trừ `<mark>` tag.
- [ ] `SECTION_ORDER` export từ `packages/shared`.
- [ ] Error codes thêm: `PROJECT_NOT_FOUND`, `FEATURE_NOT_FOUND`, `SEARCH_QUERY_EMPTY`, `SEARCH_QUERY_TOO_LONG`.

### Commit
`feat(api): project + feature + search read endpoints (US-001 / T5 / FR-READ-001,SEARCH-001)`

---

## T6 — Web skeleton + auth guard + login page

**Effort**: 4h
**FR**: FR-AUTH-001
**Deps**: T2 (có thể parallel với T3-T5 cho shell, nhưng login functional cần T4)

### Goal
`apps/web` Vite app chạy, Tailwind + shadcn setup, React Router, login page hoạt động end-to-end với API T4.

### TDD cycle
1. **Red**: `apps/web/src/pages/LoginPage.test.tsx`:
   - Render form với email + password input + submit button.
   - Submit valid → mock API success → router push `/`.
   - Submit invalid → inline error "Email hoặc mật khẩu không đúng".
   - Empty form + submit → Zod validation error hiển thị.
2. **Green**:
   - `apps/web/vite.config.ts`: proxy `/api` → `http://localhost:3001`.
   - Tailwind config + shadcn init (`npx shadcn add button input label alert`).
   - `apps/web/src/main.tsx`: React Router `createBrowserRouter`.
   - `apps/web/src/lib/api.ts`: fetch wrapper với `credentials: 'include'` + error mapping.
   - `apps/web/src/queries/auth.ts`: TanStack Query `useMe()`, `useLogin()`, `useLogout()`.
   - `apps/web/src/pages/LoginPage.tsx`: form với react-hook-form + zodResolver + shared Zod schema.
   - `apps/web/src/components/RequireAuth.tsx`: wrapper check `useMe()`; unauthenticated → `<Navigate to={`/login?next=${encodeURIComponent(location)}`} />`.
   - `apps/web/src/components/AppHeader.tsx`: display user + Logout button (logout mutation).
3. **Refactor**: error toast helper, isolate API error → UI message.

### DoD
- [ ] `pnpm --filter @onboarding/web dev` → Vite :5173 OK.
- [ ] Login flow E2E manual: login admin@local/dev12345 → redirect `/` → refresh → vẫn authenticated.
- [ ] LoginPage unit tests green.
- [ ] shadcn components copied tới `apps/web/src/components/ui/`.
- [ ] Logout clears cookie + redirect `/login`.

### Commit
`feat(web): vite app + login page + auth guard (US-001 / T6 / FR-AUTH-001)`

---

## T7 — Landing + feature detail pages

**Effort**: 4h
**FR**: FR-READ-001, FR-FEAT-002
**Deps**: T5, T6

### Goal
`/projects/:slug` và `/projects/:slug/features/:featureSlug` render đúng US-001 AC-3, AC-5, AC-6. Markdown sanitize + render. Empty state (AC-4).

### TDD cycle
1. **Red**: `apps/web/src/pages/{ProjectLandingPage,FeatureDetailPage}.test.tsx`:
   - Landing: render feature list với filled count "3/5", relative time "2 giờ trước" (dùng seed data fixture).
   - Landing empty: render "Chưa có feature nào trong project này".
   - Feature detail: 5 section headings in đúng thứ tự (query by role/heading level).
   - Feature detail empty section: render "Chưa có nội dung" placeholder.
   - Markdown sanitize: inject script tag trong body → không execute, render text plain.
2. **Green**:
   - `apps/web/src/queries/projects.ts`: `useProject(slug)`, `useFeature(slug, featureSlug)`.
   - `apps/web/src/components/features/FeatureList.tsx`: render row + `SectionIndicator`.
   - `apps/web/src/components/features/SectionIndicator.tsx`: 5 chấm + "N/5 filled".
   - `apps/web/src/components/features/MarkdownView.tsx`: server markdown HTML đã sanitize — hoặc FE render với `markdown-it` + `DOMPurify`. **Chọn FE** (ít state server hơn).
   - `apps/web/src/components/features/FeatureSections.tsx`: render 5 section card fixed order, import `SECTION_ORDER` từ shared.
   - `apps/web/src/lib/relativeTime.ts`: wrapper `date-fns/formatDistance` locale `vi`.
   - Route mapping trong `main.tsx` + RequireAuth wrap.
3. **Refactor**: common `LoadingState` + `ErrorState` components.

### DoD
- [ ] Landing + detail test green.
- [ ] Markdown XSS test passes (script tag không execute).
- [ ] `date-fns` locale `vi` config central.
- [ ] Responsive check manual (mobile width 375px không break layout).
- [ ] AC-3/4/5/6 manual verify trên browser với seed data.

### Commit
`feat(web): project landing + feature detail pages (US-001 / T7 / FR-READ-001,FEAT-002)`

---

## T8 — Search page + Playwright smoke + SETUP validation

**Effort**: 3h
**FR**: FR-SEARCH-001
**Deps**: T5, T7

### Goal
Search bar trong header (T6 existing) + `/search?q=...` page. Playwright smoke E2E cover full US-001 flow. Chạy lại `docs/SETUP.md` từ đầu (fresh clone) để verify SETUP chính xác.

### TDD cycle
1. **Red**:
   - `apps/web/src/pages/SearchPage.test.tsx`: render result list, empty result "Không tìm thấy feature nào khớp", highlight `<mark>` trong snippet.
   - `e2e/us-001.spec.ts` (Playwright):
     ```
     test('US-001 happy path', async ({ page }) => {
       // login
       await page.goto('/login');
       await page.fill('[name=email]', 'admin@local');
       await page.fill('[name=password]', 'dev12345');
       await page.click('button[type=submit]');
       // landing
       await page.goto('/projects/demo');
       await expect(page.getByText('Login with email')).toBeVisible();
       // feature detail
       await page.click('text=Login with email');
       for (const h of ['Business', 'User Flow', 'Business Rules', 'Tech Notes', 'Screenshots']) {
         await expect(page.getByRole('heading', { name: h })).toBeVisible();
       }
       // search
       await page.fill('[role=search] input', 'login');
       await page.press('[role=search] input', 'Enter');
       await expect(page.getByRole('mark')).toBeVisible();
     });
     ```
2. **Green**:
   - `apps/web/src/pages/SearchPage.tsx`: query param parsing, `useSearch(q)` TanStack Query, render list + snippet với `dangerouslySetInnerHTML` sau DOMPurify (chỉ allow `<mark>`).
   - Search input trong `AppHeader` submit navigate `/search?q=...`.
   - Empty query client-side guard (disable button + toast).
   - Playwright config + smoke spec trong repo root `e2e/`.
3. **Refactor**: share sanitize config.

### DoD
- [ ] SearchPage unit test green.
- [ ] `pnpm test:e2e` green (với `pnpm dev` + docker compose chạy).
- [ ] SETUP.md walk-through fresh: `git clone → pnpm install → docker compose up → pnpm db:migrate → pnpm db:seed → pnpm dev → browser verify 3 checkpoints 8.1/8.2/8.3` tất cả pass.
- [ ] SETUP.md labels update từ 🟡 → ✅ cho các section T1-T8 hoàn thành.
- [ ] US-001 status trong `../US-001.md` đổi từ `Draft` → `Done` với ghi chú date + commit range.

### Commit
`feat(web): search page + playwright smoke for US-001 (US-001 / T8 / FR-SEARCH-001)`

---

## Deferred to later tasks / stories

- Multi-user test (Hùng reads Lan's feature): verify ở US-003.
- Markdown editor: US-002 T*.
- Upload: US-003 T*.
- Role check `admin` cho create project: US-002 T*.
- Fine-grained a11y audit (axe): stretch trong T7 hoặc defer.
- Load test NFR-PERF-001 target: manual script sau T8, không gate CI v1.

---

## Checklist trước khi start T1

- [ ] Đọc lại [US-001.md](../US-001.md) full.
- [ ] Xác nhận Docker Desktop running, Node 20 + pnpm 9 available.
- [ ] Tạo branch `feat/us-001-reader-mvp` (nếu muốn trunk-based, commit thẳng `main` cũng chấp nhận v1).
- [ ] Review [ADR-001](../../adr/ADR-001-tech-stack.md) §2.1-2.3 để align deps version trước khi add.
