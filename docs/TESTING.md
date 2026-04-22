# Testing Strategy

_Last updated: 2026-04-22 · Source of truth for test approach trong repo này._

Nguyên tắc: **spec → test → code** (TDD). Mỗi task start với failing test (xem [US-001 tasks](../.specs/stories/US-001/tasks.md) §Conventions).

---

## Test pyramid (v1)

```
         /\
        /E2\         Playwright: 1 smoke per story (~3 tests v1)
       /────\
      /Integ.\       Vitest + Supertest: API route + real Postgres/Redis
     /────────\      (~40-60 tests v1)
    /  Unit    \     Vitest pure: FE components, utils, Zod schemas
   /────────────\    (~80-120 tests v1)
```

**Ratio target**: ~70% unit, ~25% integration, ~5% E2E. Không gate cứng tỉ lệ.

---

## 1. Unit tests

### Folder convention (áp dụng cả BE + FE, từ T3)

Tests **tách hoàn toàn** khỏi `src/` — mirror structure trong `tests/`:

```
apps/<app>/
  src/
    middleware/requireAuth.ts
    routes/health.ts
  tests/
    middleware/requireAuth.test.ts     ← mirror src/
    routes/health.test.ts              ← mirror src/
    lib/                               ← test helpers, factories
```

Lý do: giữ `src/` sạch (build + ship), test code không leak vào bundle. Tsconfig split: `tsconfig.json` (IDE/typecheck, noEmit, include src+tests) vs `tsconfig.build.json` (composite, emit, chỉ src).

### 1.1 Frontend (`apps/web`)

- **Runner**: Vitest + `@testing-library/react` + `jsdom`.
- **Where**: `apps/web/tests/<mirror>/*.test.tsx`.
- **What to cover**:
  - Component render theo prop (happy + edge).
  - Form validation logic (Zod resolver).
  - Pure utils (`relativeTime`, `errorMessages`, embed URL parser, markdown sanitize config).
  - Custom hooks (nếu có logic thực).
- **What NOT to cover**: 3rd-party lib internals, trivial JSX passthrough.
- **Mocking**: MSW hoặc fetch mock cho API layer. TanStack Query dùng `QueryClient` test wrapper, không mock hook riêng lẻ.

### 1.2 Backend (`apps/api`)

- **Runner**: Vitest + Supertest.
- **Where**: `apps/api/tests/<mirror>/*.test.ts`.
- **What to cover**:
  - Route handlers với real Express app + in-memory session store cho unit, hoặc real Redis cho integration.
  - Service layer logic (validation, error mapping).
  - Repo layer query correctness (xem Integration bên dưới).
  - Zod schemas ở `packages/shared` (parse valid + reject invalid).

### 1.3 Shared (`packages/shared`)

- **Runner**: Vitest.
- **What to cover**: Zod schema roundtrip (parse/serialize), constants sanity.

---

## 2. Integration tests

### 2.1 Philosophy: real containers, not mocks

**Default**: Test hit **real Postgres + Redis** chạy qua Docker Compose. Lý do: mock DB/ORM dễ drift khỏi prod schema (đã có incident tham khảo trong feedback chung).

**Exception**: pure logic (validation, pure transforms) test mà không cần container.

### 2.2 Setup

- Dev laptop: reuse `docker compose up -d postgres redis` từ [SETUP.md](SETUP.md).
- CI: GitHub Actions service containers (`services: postgres + redis`) — sẽ config ở task post-M1.
- Test DB: `NODE_ENV=test` + `DATABASE_URL` pointing tới `onboardingdb_test`. Fresh schema mỗi suite (migrate từ đầu) để idempotent.

### 2.3 Coverage targets

- Mọi endpoint trong [api-surface.md](../.specs/api-surface.md) có ≥ 1 happy path + 1 error path test.
- Auth middleware: 401 khi không session, 200 khi có, 403 khi role mismatch (ở endpoint admin-only).
- Transaction atomicity: tạo feature tạo đủ 5 sections trong 1 commit (rollback nếu fail).

---

## 3. E2E tests

### 3.1 Runner: Playwright

- **Where**: `e2e/` ở root.
- **Browsers**: Chromium only v1 (Firefox/Webkit defer — 1 dev).
- **Fixtures**: login helper (login admin once per test), reset DB giữa test suites.

### 3.2 Scope

- 1 smoke test mỗi story → 3 test v1 (US-001/002/003). Mỗi test cover AC quan trọng nhất (thường là happy path).
- Không test edge case ở E2E (để integration); E2E verify wiring end-to-end.
- **Target runtime**: < 60s toàn bộ E2E suite (chạy trước mỗi release).

---

## 4. Mocking policy

| Layer                                     | Mock OK                                         | Real required              |
| ----------------------------------------- | ----------------------------------------------- | -------------------------- |
| External services (Jira/Figma/GitHub API) | ✅ (v1 client-side card không fetch anyway)     | —                          |
| Postgres                                  | ❌                                              | ✅ container               |
| Redis                                     | ❌ (cho integration)                            | ✅ container               |
| Session store                             | mock OK cho route unit test                     | real Redis cho integration |
| File system (uploads)                     | `tmpdir()` per test                             | —                          |
| Time (`Date.now()`)                       | `vi.useFakeTimers()` cho test cần deterministic | —                          |
| bcrypt                                    | ❌ (slow but verify real behavior)              | ✅ real                    |
| Network fetch từ FE                       | MSW handler                                     | —                          |

---

## 5. Coverage

- **Target**: ≥ 70% line coverage cho `apps/api/src/services/` + `apps/api/src/repos/`.
- **Tool**: `vitest --coverage` (c8).
- **Gate**: không cứng v1; mở report manual review. Sẽ gate CI ở M3.
- **Exclude**: `*.test.ts`, `apps/api/src/db/migrations/*`, generated files.

---

## 6. Test data

### 6.1 Fixtures

- Seed data cho integration: `apps/api/src/db/seed.ts` (shared giữa dev + test).
- Factory pattern cho test-specific data: `apps/api/src/test/factories.ts` (TBD trong T3 refactor nếu cần).
- JSON fixtures cho FE test: `apps/web/src/test/fixtures/` (VD `feature-with-5-sections.json`).

### 6.2 Reset strategy

- Unit/FE: không cần DB, no-op.
- Integration: truncate tables giữa test suites (NOT drop/migrate) để nhanh hơn. Seed từ factory trong `beforeEach`.
- E2E: `docker compose down -v && up + migrate + seed` trước suite (slow, chỉ chạy 1 lần).

---

## 7. Running tests

| Command                              | Scope                                                |
| ------------------------------------ | ---------------------------------------------------- |
| `pnpm test`                          | All unit + integration, 1 lần                        |
| `pnpm test:watch`                    | Watch mode (TDD)                                     |
| `pnpm --filter @onboarding/web test` | FE only                                              |
| `pnpm --filter @onboarding/api test` | API only                                             |
| `pnpm test:e2e`                      | Playwright (requires `pnpm dev` + docker compose up) |
| `pnpm test --coverage`               | Coverage report                                      |

Chi tiết command xem [SETUP.md §9](SETUP.md#9-run-tests--pending--test-sẽ-thêm-cùng-từng-task-tdd).

---

## 8. Anti-patterns (DO NOT)

- ❌ Test implementation detail (VD "assert function called 3 times"). Test behavior observable.
- ❌ Share state giữa test cases (every test must be order-independent).
- ❌ Dùng `.skip` / `.only` trong committed code (CLAUDE.md Hard DO NOT).
- ❌ Mock `Date`/`bcrypt` trừ khi thực sự cần (prefer real; mock time only when deterministic assertion requires).
- ❌ Sleep/setTimeout trong test (dùng `waitFor` hoặc fake timers).
- ❌ Commit test với DB credentials hard-coded (luôn qua env).

---

## 9. TDD cadence

Tại task level, mỗi unit of work:

1. **Red** — viết 1 test thất bại, chạy → fail với reason rõ ràng.
2. **Green** — viết code tối thiểu làm test pass. Không refactor giữa chừng.
3. **Refactor** — dọn code, tests phải vẫn xanh sau mỗi edit.
4. **Commit** — 1 commit per green milestone; message format theo [CLAUDE.md](../CLAUDE.md#commit-message-convention).

Tham khảo cycle cụ thể ở mỗi task: [US-001 tasks](../.specs/stories/US-001/tasks.md).
