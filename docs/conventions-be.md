# Backend Coding Conventions (`apps/api`)

_Last updated: 2026-04-23 · Áp dụng cho mọi PR/commit vào `apps/api/`._

**Enforcement**: Tasks phải tuân thủ. Review PR check checklist bên dưới. ESLint/Prettier catch cơ bản; các rule không auto-enforce được phải human review.

## 1. Layered architecture

```
routes/      → HTTP concerns (Express handlers, response shape)
services/    → Business logic (orchestrate repos, enforce rules)
repos/       → DB queries (Drizzle only)
db/          → Schema + migrations
middleware/  → Cross-cutting (auth, validation, rate limit, session)
lib/         → Utilities (response helpers, date, etc.)
```

- **Layer rule**: route → service → repo. Không skip layer. Service KHÔNG biết req/res; repo KHÔNG biết HTTP status.
- **One domain noun = 1 file**: `userService.ts`, `userRepo.ts`. Không nhét nhiều domain chung file.

## 2. TypeScript

- `strict: true` + `noUncheckedIndexedAccess` (root `tsconfig.base.json`).
- **Không `any`** trừ khi có `// eslint-disable-next-line` kèm lý do 1 dòng.
- Prefer `type` alias cho domain shapes; `interface` cho object có thể extend.
- Export types từ `packages/shared/src/` khi BE+FE cùng dùng (VD `ErrorCode`, Zod schemas).
- ESM imports phải có `.js` extension: `import { x } from "./foo.js"` (TS strip extension khi emit).

## 3. Error handling

- **Throw `HttpError`** từ `src/errors.ts` với `ErrorCode` enum từ `@onboarding/shared`. KHÔNG throw plain `Error` trong service/repo.
- Route layer KHÔNG try/catch để trả response — để error middleware handle.
- Zod fail → dùng middleware `zodValidate` (tự map 400 VALIDATION_ERROR).
- Unknown error → error middleware map 500 INTERNAL_ERROR + log stack (không leak ra response).

## 4. Validation

- **Mọi route boundary** (body/query/params) phải qua `zodValidate` middleware.
- Reuse Zod schema từ `packages/shared/src/schemas/` khi shape share với FE.
- Strict mode (`z.object({...}).strict()`) — reject unknown field.

## 5. DB access

- **Drizzle only**. KHÔNG raw SQL template string. Parameterized luôn.
- Migrations sinh qua `pnpm db:generate` — KHÔNG hand-edit file `.sql` đã commit.
- Transaction cho atomic multi-table (VD tạo feature + 5 sections): `db.transaction(async (tx) => {...})`.
- Timeouts: `connectionTimeoutMillis` trong `db.ts` config.

## 6. Async / concurrency

- Prefer `async/await` hơn `.then()` chain.
- `Promise.all` khi operations độc lập; `for await` khi sequential cần thiết.
- Không floating promise — `void` explicit nếu fire-and-forget có chủ đích.

## 7. Logging

- **pino** qua `logger` từ `src/logger.ts`. KHÔNG `console.*` trong code committed.
- Mỗi request log tự động có `request_id` (pino-http middleware).
- KHÔNG log: password, session cookie value, full email, API key, bearer token.
- Log level: `error` cho unhandled, `warn` cho expected failure (VD dbCheck fail), `info` cho request complete, `debug` cho detail dev.

## 8. Testing

- Unit test: DI mocks (không cần Redis/DB), xem `tests/lib/helpers.ts`.
- Integration: real Postgres/Redis container (xem [docs/TESTING.md](TESTING.md)).
- File ở `tests/` mirror `src/`. Không co-locate.
- Mọi endpoint trong [api-surface.md](../.specs/api-surface.md) cần ≥ 1 happy + 1 error test.
- Assertion theo behavior, KHÔNG assertion implementation detail (VD "function called N times").

### 8.1 Test case naming

- **`describe(...)`**: tên subject (function/route/middleware), match exact tên code. VD `describe("zodValidate middleware")`, `describe("GET /api/v1/health")`, `describe("userRepo.findByEmail")`.
- **`it(...)`**: mô tả **behavior observable**, bắt đầu bằng verb ngôi 3 hiện tại + điều kiện. Không dùng "should".
  - ✅ `it("returns 200 with status=ok when db and redis are both ok")`
  - ✅ `it("rejects 401 UNAUTHENTICATED when session.userId missing")`
  - ✅ `it("throws HttpError(409, PROJECT_SLUG_TAKEN) on duplicate slug")`
  - ❌ `it("should work")` — vague
  - ❌ `it("test feature creation")` — không phải câu mô tả
  - ❌ `it("calls service.createFeature once")` — implementation detail
- **AAA layout**: blank line tách Arrange / Act / Assert trong body.
- **Nested describe** chỉ khi subject có phương thức riêng, không dùng để group pre-condition.
- **File name**: `<subject>.test.ts` match source. VD `src/services/userService.ts` → `tests/services/userService.test.ts`.
- **Integration suffix** `.integration.test.ts` nếu tách vitest project (optional v1).

## 9. Naming

| Kind                        | Convention           | Example                                       |
| --------------------------- | -------------------- | --------------------------------------------- |
| File (non-component)        | camelCase            | `userService.ts`, `rateLimit.ts`              |
| File (test)                 | `.test.ts` suffix    | `userService.test.ts`                         |
| Type / Interface            | PascalCase           | `User`, `ApiErrorShape`                       |
| Variable / function         | camelCase            | `findUserByEmail`                             |
| Constant / env / error code | SCREAMING_SNAKE_CASE | `SESSION_TTL`, `INVALID_CREDENTIALS`          |
| DB column                   | snake_case           | `password_hash`, `updated_at`                 |
| API path                    | kebab-case           | `/auth/login`, `/features/:id/sections/:type` |

## 10. Config & secrets

- **Chỉ** truy cập env qua `config.ts` (Zod-parsed). KHÔNG `process.env.*` rải rác.
- KHÔNG commit `.env*`, `*.pem`, credential. Template ở `.env.example`.

## 11. Comments

- Mặc định không viết comment. Viết khi **WHY non-obvious**: workaround, hidden constraint, security note.
- Link tới spec khi relevant: `// FR-AUTH-001: wrong email + wrong password cùng code để chống enumeration`.
- KHÔNG comment mô tả WHAT (code tự nói).

## 12. Hard DO NOTs

- ❌ `any` không comment lý do.
- ❌ Raw SQL string interpolation.
- ❌ `console.log` trong code committed.
- ❌ Hand-edit migration file.
- ❌ `process.env.*` ngoài `config.ts`.
- ❌ Skip Zod validation trên route boundary.
- ❌ Catch error rồi silent swallow (không log, không rethrow).
- ❌ Floating promise.
- ❌ Commit secret / `.env*`.

## References

- [CLAUDE.md](../CLAUDE.md) — SDD contract + commit format.
- [ADR-001](../.specs/adr/ADR-001-tech-stack.md) — tech stack rationale.
- [docs/TESTING.md](TESTING.md) — test strategy.
- [.specs/error-codes.md](../.specs/error-codes.md) — error code registry.
- [.specs/api-surface.md](../.specs/api-surface.md) — endpoint catalog.
