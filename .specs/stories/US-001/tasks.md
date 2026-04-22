# US-001 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level sections Conventions/Summary/Deferred are additional_sections_allowed) -->

_Story_: [US-001 — Dev reads và search feature catalog](../US-001.md)
_Total estimate_: ~34h (solo, TDD pace; story-level estimate 10-14h là pair/ideal, tasks là pessimistic; T3 + T4 thêm vào cho senior-role infra scaffold)
_Last updated_: 2026-04-23 (T2 landed `829a51a`; +T3-BE, +T4-FE inserted, old T3-T8 renumbered → T5-T10)

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

| #                                                     | Title                                             | Effort | AC covered                | FR touched                     | Status       |
| ----------------------------------------------------- | ------------------------------------------------- | ------ | ------------------------- | ------------------------------ | ------------ |
| [T1](#t1--monorepo-bootstrap--tooling)                | Monorepo bootstrap + tooling                      | 3h     | — (foundation)            | —                              | ✅ `10b3a04` |
| [T2](#t2--docker-compose--api-skeleton)               | Docker Compose + API skeleton + health            | 3h     | infra for all             | —                              | ✅ `829a51a` |
| [T3](#t3--backend-infrastructure-scaffold-senior-be)  | **Backend infrastructure scaffold (senior BE)**   | 4h     | infra for all             | —                              | 🟡 Next      |
| [T4](#t4--frontend-infrastructure-scaffold-senior-fe) | **Frontend infrastructure scaffold (senior FE)**  | 4-5h   | infra for all             | —                              | 🟡           |
| [T5](#t5--db-schema--migration--seed)                 | DB schema + Drizzle migration + seed              | 4h     | AC-3, AC-5, AC-6 (data)   | FEAT-002                       | 🟡           |
| [T6](#t6--auth-endpoints--session-middleware)         | Auth endpoints + session middleware               | 3h     | AC-1, AC-2, AC-10, AC-11  | AUTH-001                       | 🟡           |
| [T7](#t7--read-api--search-api)                       | Feature read API + search API                     | 4h     | AC-3, AC-5, AC-7, AC-9    | FEAT-002, READ-001, SEARCH-001 | 🟡           |
| [T8](#t8--login-page--auth-guard)                     | Login page + auth guard (FE)                      | 3h     | AC-1, AC-2, AC-10, AC-11  | AUTH-001                       | 🟡           |
| [T9](#t9--landing--feature-detail-pages)              | Project landing + feature detail render           | 4h     | AC-3, AC-4, AC-5, AC-6    | READ-001, FEAT-002             | 🟡           |
| [T10](#t10--search-page--e2e-smoke--setup-validation) | Search page + Playwright smoke + SETUP validation | 3h     | AC-7, AC-8, AC-9 + all AC | SEARCH-001                     | 🟡           |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10.
**Parallel potential**: T4 (FE infra) có thể chạy song song với T3 (BE infra). T8 (login UI) có thể chạy sau T4 nhưng login functional cần T6.

---

## T1 — Monorepo bootstrap + tooling

**Effort**: 3h
**FR**: —
**Deps**: —
**Status**: ✅ Done (`10b3a04`, 2026-04-22)

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

- [x] `pnpm install` clean (no warnings về workspace).
- [x] `pnpm lint` pass với 0 file.
- [x] `pnpm typecheck` pass.
- [x] `pnpm test --passWithNoTests` exit 0.
- [x] Husky pre-commit hook blocks commit khi lint fail.
- [x] `.gitignore` cover `node_modules`, `dist`, `.env.local`, `data/`.

### Commit

`chore(infra): bootstrap pnpm monorepo + tooling (US-001 / T1)` → `10b3a04`

---

## T2 — Docker Compose + API skeleton

**Effort**: 3h
**FR**: infra (mọi FR phụ thuộc)
**Deps**: T1
**Status**: ✅ Done (`829a51a`, 2026-04-23)

### Goal

Express server chạy `tsx watch`, `/api/v1/health` endpoint trả `{ status, db, redis, version }`. Docker Compose start postgres + redis. Test unit chạy với Vitest + Supertest.

### TDD cycle

1. **Red**: `apps/api/src/routes/health.test.ts` — health endpoint expected shape, chạy → fail (no route).
2. **Green**: `app.ts` (DI factory) + `config.ts` (Zod env) + `logger.ts` (pino) + `db.ts`/`redis.ts` (checkers) + `errors.ts` + `routes/health.ts` + `infra/docker/docker-compose.yml`.
3. **Refactor**: `createApp(deps)` pattern cho unit test + real bootstrap khác nhau.

### DoD

- [x] `docker compose -f infra/docker/docker-compose.yml up -d` → cả 2 healthy (verify qua compose config + manual).
- [x] `pnpm dev` → API listen 3001.
- [x] `curl /api/v1/health` trả `{status, db, redis, version}` — "degraded" khi no containers.
- [x] `pnpm --filter @onboarding/api test` green (4/4).
- [x] Error format `{ error: { code, message } }` middleware có trong `errors.ts`.

### Commit

`feat(api): health endpoint + docker compose infra (US-001 / T2)` → `829a51a`

---

## T3 — Backend infrastructure scaffold (senior BE)

**Effort**: 4h
**FR**: infra (foundation cho T6/T7 và các US sau)
**Deps**: T2
**Status**: 🟡 Next

### Goal

Establish **BE architecture conventions** như senior BE sẽ làm ngày đầu của project. Sau T3, khi T5+ viết business logic, pattern đã sẵn sàng (không phải nghĩ lại mỗi task):

1. **Folder structure**:

   ```
   apps/api/src/
   ├── app.ts                  ✅ T2
   ├── config.ts               ✅ T2
   ├── logger.ts               ✅ T2
   ├── errors.ts               ✅ T2 → extend ở T3
   ├── db.ts                   ✅ T2 (pg Pool) → T3 wire drizzle
   ├── redis.ts                ✅ T2
   ├── index.ts                ✅ T2
   ├── middleware/             🟡 T3 new
   │   ├── session.ts          (connect-redis config; endpoint wired ở T6)
   │   ├── requireAuth.ts      (stub: trả 401 UNAUTHENTICATED; logic hoàn chỉnh T6)
   │   ├── rateLimit.ts        (Redis counter helper factory)
   │   └── zodValidate.ts      (wrap Zod parse → 400 VALIDATION_ERROR)
   ├── services/               🟡 T3 new (empty, README-only)
   ├── repos/                  🟡 T3 new (empty, README-only)
   ├── routes/
   │   └── health.ts           ✅ T2
   ├── db/
   │   ├── schema.ts           🟡 T3 (empty export; T5 điền)
   │   ├── client.ts           🟡 T3 (drizzle instance)
   │   └── migrations/         🟡 T3 (empty dir, .gitkeep)
   ├── lib/                    🟡 T3 new
   │   └── http.ts             (response helpers: success, error thin wrappers)
   └── test/                   🟡 T3 new
       ├── factories.ts        (fixture factory stubs)
       └── helpers.ts          (supertest wrapper, test app builder)
   ```

2. **Middleware stack** đầy đủ (some stub):
   - Session middleware (`express-session` + `connect-redis` config; mount vào createApp).
   - `requireAuth` middleware (stub: check `req.session?.userId`, trả 401 nếu thiếu).
   - `rateLimit(keyFn, max, windowSec)` factory (Redis counter; T6 dùng cho `/auth/login`).
   - `zodValidate` helper — parse body/query/params → next hoặc throw `HttpError(400, "VALIDATION_ERROR", ...)`.
   - CORS config (`cors` package, allow `VITE_APP_ORIGIN`).

3. **Drizzle config** ready:
   - `apps/api/drizzle.config.ts` point vào `src/db/schema.ts` + `src/db/migrations/`.
   - `apps/api/src/db/client.ts` export `db = drizzle(pool, { schema })`.
   - Root `package.json` scripts: `db:generate`, `db:migrate`, `db:check` (filter `@onboarding/api`).

4. **Error codes shared**:
   - `packages/shared/src/errors.ts` export `ErrorCode` enum + `ApiErrorShape` type.
   - BE import enum; FE reuse ở T4 cho mapping toast.

5. **Test helpers**:
   - `apps/api/src/test/helpers.ts`: `createTestApp(overrides)` wrap `createApp` với mock deps defaults.
   - `apps/api/src/test/factories.ts`: factory function signatures (empty implementations until T5).

### TDD cycle

1. **Red**: `apps/api/src/middleware/__infra.test.ts` cover:
   - Session cookie name = `sid`, httpOnly, sameSite=lax.
   - `requireAuth` without session → 401 `UNAUTHENTICATED`.
   - `zodValidate` với schema fail → 400 `VALIDATION_ERROR`, body có `details.issues`.
   - `rateLimit(..., 2, 60)` — 3rd hit → 429 `RATE_LIMITED`.
   - CORS `Access-Control-Allow-Origin` match config origin, khác thì block.
2. **Green**: implement middleware + wire vào `createApp`. Install `express-session`, `connect-redis`, `bcryptjs`, `cors`, `drizzle-orm`, `drizzle-kit`.
3. **Refactor**:
   - Extract error code enum sang `@onboarding/shared`.
   - `createApp(deps)` accept optional middleware overrides cho test.

### DoD

- [ ] Test `middleware/__infra.test.ts` green (all 5 cases).
- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm smoke` xanh.
- [ ] Folder `services/`, `repos/`, `lib/`, `test/`, `middleware/`, `db/migrations/` đều có README hoặc `.gitkeep` + comment giải thích layer.
- [ ] `packages/shared/src/errors.ts` export `ErrorCode` enum khớp list ở `.specs/error-codes.md`.
- [ ] `drizzle.config.ts` + `db:generate`/`db:migrate`/`db:check` scripts chạy được (dù schema rỗng).
- [ ] Deps added: `express-session`, `connect-redis`, `bcryptjs`, `cors`, `drizzle-orm`, `drizzle-kit`, `@types/express-session`, `@types/bcryptjs`, `@types/cors`.

### Commit

`chore(api): backend infra scaffold — middleware stack, drizzle config, test helpers (US-001 / T3)`

---

## T4 — Frontend infrastructure scaffold (senior FE)

**Effort**: 4-5h
**FR**: infra (foundation cho T8/T9/T10)
**Deps**: T1 (web workspace tồn tại; **không** cần chờ T2/T3 — có thể chạy song song với T3)
**Status**: 🟡

### Goal

Establish **FE architecture conventions** như senior FE sẽ làm ngày đầu. Sau T4, `pnpm --filter @onboarding/web dev` mở Vite + browser render placeholder page; khi T8+ viết page thật, pattern đã sẵn:

1. **Folder structure**:

   ```
   apps/web/src/
   ├── main.tsx               (Router + QueryClient + ErrorBoundary provider tree)
   ├── App.tsx                (route tree shell)
   ├── routes/                (route definitions — createBrowserRouter)
   ├── pages/                 (page components — 1 placeholder HomePage ở T4)
   ├── components/
   │   ├── ui/                (shadcn copied components)
   │   ├── layout/            (AppHeader, AppShell, ErrorBoundary)
   │   └── features/          (feature-scoped components — empty)
   ├── queries/               (TanStack Query hooks — empty, factory pattern doc)
   ├── hooks/                 (custom hooks — empty)
   ├── lib/
   │   ├── api.ts             (fetch wrapper: credentials:"include", error mapping)
   │   ├── errorMessages.ts   (ErrorCode → VI copy; import từ @onboarding/shared)
   │   └── cn.ts              (tailwind class merger)
   ├── styles/
   │   └── index.css          (tailwind directives + shadcn theme)
   └── test/
       ├── setup.ts           (vitest jsdom setup + MSW server start)
       ├── msw-handlers.ts    (default MSW handlers)
       └── test-utils.tsx     (render-with-providers wrapper)
   ```

2. **Config**:
   - `vite.config.ts`: React plugin, path alias `@/` → `src/`, proxy `/api` → `http://localhost:3001`, test config (vitest jsdom + setup file).
   - `tailwind.config.js` + `postcss.config.js`: content paths cover `src/**/*.{ts,tsx}`.
   - `components.json` (shadcn config) + CLI-generated `ui/button.tsx`, `ui/input.tsx`, `ui/label.tsx`.
   - `index.html` ở root apps/web với `#root` div.
   - `tsconfig.json`: add `jsx: react-jsx`, `paths` alias.

3. **Provider tree** (`main.tsx` → `App.tsx`):
   - `<QueryClientProvider>` (TanStack Query default client).
   - `<RouterProvider>` (createBrowserRouter).
   - `<ErrorBoundary>` (class component render fallback UI).

4. **API client** (`lib/api.ts`):
   - `apiFetch<T>(path, init?)`: base URL từ `import.meta.env.VITE_API_BASE_URL`, `credentials: "include"`, parse response, throw `ApiError` với `code`/`message`/`details` khớp BE shape.
   - Hook `useApi()` chưa cần — query/mutation hooks trực tiếp ở T6/T8 dùng `apiFetch`.

5. **Test setup**:
   - Vitest với `environment: "jsdom"` + `setupFiles: ["./src/test/setup.ts"]`.
   - MSW `setupServer()` default handler trả 200 healthz; test override khi cần.
   - `test-utils.tsx` export `renderWithProviders(ui, { initialEntries? })` wrap Router+Query.

6. **Placeholder page**: `HomePage.tsx` render `<h1>Onboarding Portal</h1>` + `"Implementation in progress — M1"` để verify wiring.

### TDD cycle

1. **Red**: `apps/web/src/__smoke__.test.tsx`:
   - `renderWithProviders(<App />)` → tìm thấy text "Onboarding Portal".
   - MSW mock `/api/v1/health` → `apiFetch("/health")` trả đúng shape `{status, db, redis, version}`.
   - Error case: MSW trả 401 `UNAUTHENTICATED` → `apiFetch` throw `ApiError` có `code === "UNAUTHENTICATED"`.
2. **Green**: install deps + scaffold các file trên. Chạy `pnpm --filter @onboarding/web dev` verify manual browser render.
3. **Refactor**: pull `errorMessages.ts` copy từ `.specs/error-codes.md` §Client-side mapping.

### DoD

- [ ] `pnpm --filter @onboarding/web dev` serve Vite trên :5173; browser render `<h1>`.
- [ ] `pnpm --filter @onboarding/web test` green (smoke + api.ts unit test).
- [ ] `pnpm smoke` (root) vẫn pass.
- [ ] Tailwind build output CSS (check via `pnpm --filter @onboarding/web build`).
- [ ] shadcn `components.json` + ≥ 3 component stubs copied (button, input, label).
- [ ] MSW setup hoạt động — 1 smoke test dùng MSW pass.
- [ ] `lib/api.ts` unit test cover happy path + error mapping.

### Deps added

- **Runtime**: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`.
- **Forms (tiền cài cho T8/US-002)**: `react-hook-form`, `@hookform/resolvers`, `zod` (via shared).
- **Dev**: `@vitejs/plugin-react`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `msw`, `@types/react`, `@types/react-dom`.

### Commit

`chore(web): frontend infra scaffold — vite + tailwind + shadcn + router + query client (US-001 / T4)`

---

## T5 — DB schema + migration + seed

**Effort**: 4h
**FR**: FR-FEAT-002
**Deps**: T3 (drizzle config from infra scaffold)
**Status**: 🟡

### Goal

4 bảng: `users`, `projects`, `features`, `sections`. Migration generated + applied. Seed script tạo 1 admin + 1 author + 1 project + 1 feature 5-section filled. `tsvector` column cho FTS ready (dùng cho T7 search).

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
   - `apps/api/src/db/seed.ts`: bcrypt hash `dev12345`, insert admin + author + project "Demo Project" (slug `demo`) + feature "Login with email" (slug `login-with-email`) + 5 sections với markdown mẫu (business/user-flow/business-rules/tech-notes/screenshots).
3. **Refactor**: nếu search_vector dùng trigger thay generated column, viết trigger SQL rõ ràng comment why.

### DoD

- [ ] `pnpm db:migrate` run clean từ empty DB.
- [ ] `pnpm db:seed` → console log "Seeded 1 project, 1 feature (5 sections), 2 users".
- [ ] Seed idempotent (re-run không duplicate hoặc error — dùng `on conflict do nothing`).
- [ ] Schema test green.
- [ ] `pnpm db:check` (drizzle-kit) consistent.

### Commit

`feat(api): db schema + seed data for demo project (US-001 / T5 / FR-FEAT-002)`

---

## T6 — Auth endpoints + session middleware

**Effort**: 3h
**FR**: FR-AUTH-001
**Deps**: T5 (users table) + T3 (session middleware config already present)
**Status**: 🟡

### Goal

`POST /auth/login`, `POST /auth/logout`, `GET /auth/me` hoạt động với session Redis. Middleware `requireAuth` (stub từ T3) nay query user thật + attach `req.user`.

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
   - `apps/api/src/routes/auth.ts`: login (bcrypt compare, set `req.session.userId`), logout (destroy), me (requireAuth).
   - Extend `apps/api/src/middleware/requireAuth.ts` (from T3 stub): query user by `req.session.userId`, attach `req.user`.
   - `rateLimit(ipKey, 10, 60)` apply trên `/auth/login` (helper từ T3).
3. **Refactor**: extract user repo (`apps/api/src/repos/userRepo.ts`) theo T3 pattern.

### DoD

- [ ] Auth routes tests all green.
- [ ] Password comparison constant-time (bcryptjs default OK).
- [ ] Session persist sau server restart (nếu Redis persist — v1 accepted loss, document).
- [ ] Error response schema consistent với `ErrorCode` enum từ T3.
- [ ] `userRepo` dùng drizzle client từ T3.

### Commit

`feat(api): auth login/logout + session middleware (US-001 / T6 / FR-AUTH-001)`

---

## T7 — Read API + search API

**Effort**: 4h
**FR**: FR-FEAT-002, FR-READ-001, FR-SEARCH-001
**Deps**: T6
**Status**: 🟡

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
   - `apps/api/src/repos/projectRepo.ts`, `featureRepo.ts`, `searchRepo.ts` (pattern từ T3).
   - `apps/api/src/services/*`: thin wrappers (validate slug format, error mapping).
   - `apps/api/src/routes/{projects,features,search}.ts`: Zod validate params/query (dùng `zodValidate` middleware từ T3) + call service.
   - Shared Zod schemas ở `packages/shared/src/schemas/feature.ts`.
3. **Refactor**: extract section ordering constant `SECTION_ORDER` dùng shared FE/BE.

### DoD

- [ ] Tất cả test route green.
- [ ] p95 < 300ms đo qua console (không strict gate).
- [ ] Search trả `snippet` escaped HTML ngoại trừ `<mark>` tag.
- [ ] `SECTION_ORDER` export từ `packages/shared`.
- [ ] Error codes thêm: `PROJECT_NOT_FOUND`, `FEATURE_NOT_FOUND`, `SEARCH_QUERY_EMPTY`, `SEARCH_QUERY_TOO_LONG`.

### Commit

`feat(api): project + feature + search read endpoints (US-001 / T7 / FR-READ-001,SEARCH-001)`

---

## T8 — Login page + auth guard

**Effort**: 3h (scope narrowed: FE shell đã có từ T4)
**FR**: FR-AUTH-001
**Deps**: T4 (FE shell) + T6 (auth API)
**Status**: 🟡

### Goal

LoginPage + RequireAuth wrapper + logout button. Scope hẹp vì T4 đã có Vite/Tailwind/shadcn/Router/Query client/api client/error boundary. Task này wire auth-specific UI vào shell.

### TDD cycle

1. **Red**: `apps/web/src/pages/LoginPage.test.tsx`:
   - Render form với email + password input + submit button.
   - Submit valid → MSW mock API success → router push `/`.
   - Submit invalid → MSW mock 401 → inline error "Email hoặc mật khẩu không đúng" (map qua `errorMessages.ts` từ T4).
   - Empty form + submit → Zod validation error hiển thị.
   - Logout button click → mutation → redirect `/login`.
2. **Green**:
   - `apps/web/src/queries/auth.ts`: `useMe()`, `useLogin()`, `useLogout()` (TanStack Query hooks dùng `apiFetch` từ T4).
   - `apps/web/src/pages/LoginPage.tsx`: react-hook-form + zodResolver + shared Zod schema.
   - `apps/web/src/components/layout/RequireAuth.tsx`: wrapper check `useMe()`; unauthenticated → `<Navigate to={`/login?next=${encodeURIComponent(location)}`} />`.
   - `apps/web/src/components/layout/AppHeader.tsx`: display user + Logout button.
   - Wire routes trong `routes/` (từ T4 scaffold).
3. **Refactor**: error toast helper (dùng shadcn `sonner` hoặc custom).

### DoD

- [ ] LoginPage + RequireAuth tests green.
- [ ] Login flow E2E manual: admin@local/dev12345 → redirect `/` → refresh → vẫn authenticated.
- [ ] Logout clears cookie + redirect `/login`.
- [ ] Zod login schema share giữa BE (T6) và FE — 1 nguồn `packages/shared/src/schemas/auth.ts`.

### Commit

`feat(web): login page + auth guard (US-001 / T8 / FR-AUTH-001)`

---

## T9 — Landing + feature detail pages

**Effort**: 4h
**FR**: FR-READ-001, FR-FEAT-002
**Deps**: T7 (API) + T8 (auth guard)
**Status**: 🟡

### Goal

`/projects/:slug` và `/projects/:slug/features/:featureSlug` render đúng US-001 AC-3, AC-5, AC-6. Markdown sanitize + render. Empty state (AC-4).

### TDD cycle

1. **Red**: `apps/web/src/pages/{ProjectLandingPage,FeatureDetailPage}.test.tsx`:
   - Landing: render feature list với filled count "3/5", relative time "2 giờ trước" (MSW fixture).
   - Landing empty: render "Chưa có feature nào trong project này".
   - Feature detail: 5 section headings đúng thứ tự.
   - Feature detail empty section: render "Chưa có nội dung" placeholder.
   - Markdown sanitize: inject script tag trong body → không execute.
2. **Green**:
   - `apps/web/src/queries/projects.ts`: `useProject(slug)`, `useFeature(slug, featureSlug)`.
   - `apps/web/src/components/features/FeatureList.tsx`, `SectionIndicator.tsx`, `MarkdownView.tsx` (markdown-it + DOMPurify), `FeatureSections.tsx` (dùng `SECTION_ORDER` từ shared).
   - `apps/web/src/lib/relativeTime.ts`: `date-fns/formatDistance` locale `vi`.
   - Route mapping + RequireAuth wrap (từ T8).
3. **Refactor**: common `LoadingState` + `ErrorState` components trong `components/layout/`.

### DoD

- [ ] Landing + detail test green.
- [ ] Markdown XSS test passes.
- [ ] `date-fns` locale `vi` config central.
- [ ] Responsive check manual (mobile width 375px).
- [ ] AC-3/4/5/6 manual verify browser với seed data.

### Commit

`feat(web): project landing + feature detail pages (US-001 / T9 / FR-READ-001,FEAT-002)`

---

## T10 — Search page + Playwright smoke + SETUP validation

**Effort**: 3h
**FR**: FR-SEARCH-001
**Deps**: T7, T9
**Status**: 🟡

### Goal

Search bar trong `AppHeader` (từ T8) + `/search?q=...` page. Playwright smoke E2E cover full US-001 flow. Chạy lại `docs/SETUP.md` từ fresh clone để verify SETUP chính xác.

### TDD cycle

1. **Red**:
   - `apps/web/src/pages/SearchPage.test.tsx`: render result list, empty result "Không tìm thấy feature nào khớp", highlight `<mark>` trong snippet.
   - `e2e/us-001.spec.ts` (Playwright):
     ```
     test('US-001 happy path', async ({ page }) => {
       await page.goto('/login');
       await page.fill('[name=email]', 'admin@local');
       await page.fill('[name=password]', 'dev12345');
       await page.click('button[type=submit]');
       await page.goto('/projects/demo');
       await expect(page.getByText('Login with email')).toBeVisible();
       await page.click('text=Login with email');
       for (const h of ['Business', 'User Flow', 'Business Rules', 'Tech Notes', 'Screenshots']) {
         await expect(page.getByRole('heading', { name: h })).toBeVisible();
       }
       await page.fill('[role=search] input', 'login');
       await page.press('[role=search] input', 'Enter');
       await expect(page.getByRole('mark')).toBeVisible();
     });
     ```
2. **Green**:
   - `apps/web/src/pages/SearchPage.tsx`: query param parsing, `useSearch(q)` TanStack Query, render list + snippet với `dangerouslySetInnerHTML` sau DOMPurify (chỉ allow `<mark>`).
   - Search input trong `AppHeader` submit navigate `/search?q=...`.
   - Empty query client-side guard.
   - Playwright config + smoke spec trong repo root `e2e/`.
3. **Refactor**: share sanitize config.

### DoD

- [ ] SearchPage unit test green.
- [ ] `pnpm test:e2e` green (với `pnpm dev` + docker compose chạy).
- [ ] SETUP.md walk-through fresh clone end-to-end pass 3 smoke checkpoints.
- [ ] SETUP.md labels update 🟡 → ✅ cho các section T1-T10 hoàn thành.
- [ ] US-001 status đổi từ `Draft` → `Done` với ghi chú date + commit range.

### Commit

`feat(web): search page + playwright smoke for US-001 (US-001 / T10 / FR-SEARCH-001)`

---

## Deferred to later tasks / stories

- Multi-user test (Hùng reads Lan's feature): verify ở US-003.
- Markdown editor: US-002 T\*.
- Upload: US-003 T\*.
- Role check `admin` cho create project: US-002 T\*.
- Fine-grained a11y audit (axe): stretch trong T9 hoặc defer.
- Load test NFR-PERF-001 target: manual script sau T10, không gate CI v1.

---

## Checklist trước khi start T3

- [ ] Đọc lại [US-001.md](../US-001.md) full.
- [ ] Xác nhận Docker Desktop running, Node 20 + pnpm 9 available.
- [ ] Review [ADR-001](../../adr/ADR-001-tech-stack.md) §2.1-2.3 để align deps version.
- [ ] Đọc [TESTING.md](../../../docs/TESTING.md) §Mocking policy để biết test strategy mỗi layer.
