# Local Setup Guide

> **Trạng thái**: Sống cùng implementation. Nhãn mỗi section: ✅ `works now` · 🟡 `pending (task T-N)` · ⏳ `v2`. Xem [roadmap.md](../.specs/roadmap.md).
>
> Progress hiện tại: **T1-T10 + T8.5 ✅ done** (monorepo + API + Docker Compose + BE+FE infra + DB schema/migration/seed/FTS + auth endpoints + read/search endpoints + FE LoginPage + RequireAuth + AppHeader + light/dark theme infra + ProjectLanding + FeatureDetail pages + **SearchPage + Playwright E2E smoke**). US-001 complete.

---

## 1. Prerequisites ✅

Cài các tool sau trên máy dev (kiểm version sau dấu `|`):

| Tool                                | Version tối thiểu | Verify                   |
| ----------------------------------- | ----------------- | ------------------------ |
| Node.js                             | 20.x LTS          | `node -v`                |
| pnpm                                | 9.x               | `pnpm -v`                |
| Docker Desktop (hoặc Docker Engine) | 24+               | `docker -v`              |
| Docker Compose v2                   | 2.20+             | `docker compose version` |
| Git                                 | 2.40+             | `git -v`                 |

Khuyến nghị (optional):

- **nvm** để quản lý Node version.
- **direnv** để auto-load env files (không bắt buộc — API đã dùng `dotenv/config`, Web dùng Vite, Infra dùng Compose auto-load).
- **VS Code**: mở workspace → accept prompt "Install recommended extensions" ([.vscode/extensions.json](../.vscode/extensions.json)). [.vscode/settings.json](../.vscode/settings.json) đã commit trong repo — team dùng **cùng** config (format-on-save Prettier, ESLint auto-fix, workspace TS version, Tailwind hints, Vitest explorer, spellcheck EN+VI). Personal tweaks: VS Code Profiles hoặc `*.code-workspace` ngoài repo.

---

## 2. Clone & install ✅ (T1 done)

```bash
git clone <repo-url> nexlab-onboarding-project-docs
cd nexlab-onboarding-project-docs
nvm use                       # reads .nvmrc → Node 20
corepack enable               # one-time per machine, activates pnpm shim
pnpm install                  # installs workspace deps (214 pkgs ~30s first time)
```

Verify:

```bash
pnpm smoke                    # runs lint + typecheck + test (passWithNoTests)
```

Sau `pnpm install`, cấu trúc workspace:

```
apps/
  web/         # TS stub, React+Vite wires in T6
  api/         # TS stub, Express wires in T2
packages/
  shared/      # TS stub, Zod schemas land with T3/T4
```

---

## 3. Environment variables ✅ (per-layer files — CR-001)

Env được chia theo layer, mỗi file self-contained:

| Layer | Template                                                  | Runtime file          | Loaded by                     |
| ----- | --------------------------------------------------------- | --------------------- | ----------------------------- |
| Infra | [infra/docker/.env.example](../infra/docker/.env.example) | `infra/docker/.env`   | Docker Compose (auto)         |
| API   | [apps/api/.env.example](../apps/api/.env.example)         | `apps/api/.env`       | `dotenv/config` ở entrypoints |
| Web   | [apps/web/.env.example](../apps/web/.env.example)         | `apps/web/.env.local` | Vite (auto)                   |

Copy cả 3 template (one-time setup):

```bash
cp infra/docker/.env.example infra/docker/.env
cp apps/api/.env.example     apps/api/.env
cp apps/web/.env.example     apps/web/.env.local
```

Đang có legacy root `.env.local` từ trước CR-001? Chạy helper để tự split:

```bash
pnpm migrate:env
# Review 3 file mới, rồi xoá root: rm .env.local
```

**Rule**: tất cả runtime env file đều gitignored (pattern `.env`, `.env.local`, `.env.*.local`). Chỉ commit `*.example`.

---

## 4. Start infrastructure ✅ (T2 done)

Từ root (yêu cầu `infra/docker/.env` đã tồn tại — xem §3):

```bash
pnpm docker:up
```

(Tương đương `docker compose -f infra/docker/docker-compose.yml up -d`. Compose auto-load `infra/docker/.env` vì project-directory mặc định = thư mục chứa compose file.)

Verify:

```bash
docker compose -f infra/docker/docker-compose.yml ps
# postgres   Up (healthy)
# redis      Up (healthy)
```

Nếu port 5432 hoặc 6379 đã bị chiếm, override cả 2 file:

```dotenv
# infra/docker/.env
POSTGRES_PORT=5433
REDIS_PORT=6380
```

```dotenv
# apps/api/.env (URL phải khớp port override)
DATABASE_URL=postgresql://dev:dev@localhost:5433/onboardingdb
REDIS_URL=redis://localhost:6380
```

Smoke test Postgres:

```bash
docker compose exec postgres psql -U dev -d onboardingdb -c "select 1;"
```

Smoke test Redis:

```bash
docker compose exec redis redis-cli ping
# PONG
```

---

## 5. Database migration ✅ (T5 done)

Tạo schema:

```bash
pnpm --filter @onboarding/api db:migrate
```

Hoặc từ root:

```bash
pnpm db:migrate
```

Lệnh này chạy `drizzle-kit migrate`; `dotenv/config` trong `drizzle.config.ts` tự load `apps/api/.env` để lấy `DATABASE_URL`.

Xem schema snapshot hiện tại:

```bash
pnpm db:check
```

---

## 6. Seed data ✅ (T5 done)

Seed 1 project + 1 feature đầy đủ 5 section để US-001 có data để demo:

```bash
pnpm db:seed
```

Kết quả mong đợi (console):

```
✓ Seeded 1 project: "Demo Project"
✓ Seeded 1 feature: "Login with email" (5 sections)
✓ Seeded 1 admin user: admin@local / password: dev12345
```

Reset DB + reseed (dev only — destructive):

```bash
pnpm db:reset
```

### 6.1 Test database isolation (one-time setup) ✅

Vitest + Playwright run against a dedicated `onboardingdb_test` database in the same Postgres container so tests never touch dev data. First-time setup:

```bash
pnpm db:create:test     # idempotent CREATE DATABASE onboardingdb_test (skip if init script already ran)
pnpm db:reset:test      # drop + create + migrate + minimal seed (admin + dev users + demo project + demo feature)
```

Subsequent runs reuse the migrated test DB; vitest auto-loads `.env.test` overlay so `pnpm test` already uses it. Re-run `pnpm db:reset:test` only when you want a clean slate (after a migration changes shape, or if a flaky test left bad data).

**File:** `apps/api/.env.test` (gitignored, copy from `.env.test.example`) — only overrides `DATABASE_URL` to point at `onboardingdb_test`.

---

## 7. Start dev servers ✅ (T2 + T4; login lands T8)

```bash
pnpm dev
```

Chạy song song cả 2 workspace:

- **API**: http://localhost:3001 (Express, `tsx watch` auto-reload)
- **Web**: http://localhost:5173 (Vite HMR, proxy `/api/*` → API :3001)

Hiện `/` render placeholder `<h1>Onboarding Portal</h1>`. Login + routes chính thức wire ở T8-T10.

---

## 8. Smoke-test checklist ✅ (T2, T7, T9, T10)

Sau khi start thành công, verify theo thứ tự:

### 8.1 API health ✅ (T2)

```bash
curl -s http://localhost:3001/api/v1/health | jq
```

Expect (với docker containers chạy):

```json
{ "status": "ok", "db": "ok", "redis": "ok", "version": "0.1.0" }
```

Không có docker? API vẫn chạy, nhưng trả degraded:

```json
{ "status": "degraded", "db": "error", "redis": "error", "version": "0.1.0" }
```

### 8.2 Read seeded feature via API

```bash
curl -s http://localhost:3001/api/v1/projects/demo/features/login-with-email | jq
```

Expect: feature object với `sections` array length 5.

### 8.3 Web — feature detail page

Mở browser: http://localhost:5173/projects/demo/features/login-with-email

Expect: trang hiển thị tên feature + 5 section headers (Business, User Flow, Business Rules, Tech Notes, Screenshots).

---

## 9. Run tests ✅

Unit tests (Vitest) xanh theo từng task; E2E (Playwright) smoke cover US-001 happy path.

```bash
# Tất cả unit tests
pnpm test

# Watch mode (làm TDD)
pnpm test:watch

# Web test only
pnpm --filter @onboarding/web test

# API test only
pnpm --filter @onboarding/api test

# E2E (Playwright) — phải có dev server đang chạy
pnpm test:e2e
```

---

## 10. Common commands

Progress: ✅ = live sau T1 · 🟡 = pending task.

| Command                | Mục đích                                                | Status                   |
| ---------------------- | ------------------------------------------------------- | ------------------------ |
| `pnpm install`         | Install workspace deps                                  | ✅ T1                    |
| `pnpm lint`            | ESLint cho toàn repo                                    | ✅ T1                    |
| `pnpm format`          | Prettier format                                         | ✅ T1                    |
| `pnpm typecheck`       | `tsc --noEmit` all workspaces                           | ✅ T1                    |
| `pnpm test`            | Vitest (passWithNoTests hiện tại)                       | ✅ T1                    |
| `pnpm smoke`           | `scripts/smoke.sh` = lint + typecheck + test            | ✅ T1                    |
| `pnpm dev`             | Start API + Web parallel (auto-free port 3001)          | ✅ T2 (API) + T4 (Web)   |
| `pnpm stop`            | Stop API + Web (SIGTERM port 3001 + 5173)               | ✅ infra chore           |
| `pnpm build`           | Build api + web prod                                    | ✅ T2 (API) + T4 (Web)   |
| `pnpm docker:up`       | Start postgres + redis                                  | ✅ T2                    |
| `pnpm docker:down`     | Stop containers                                         | ✅ T2                    |
| `pnpm docker:reset`    | Stop + xoá data volumes                                 | ✅ T2                    |
| `pnpm docker:logs`     | Tail logs postgres + redis                              | ✅ T2                    |
| `pnpm db:generate`     | Generate migration từ schema change                     | ✅ T3 config + T5 schema |
| `pnpm db:migrate`      | Drizzle migrate up                                      | ✅ T5                    |
| `pnpm db:check`        | Drizzle-kit consistency check                           | ✅ T5                    |
| `pnpm db:seed`         | Seed dev data (admin/author + demo + pilot projects)    | ✅ T5                    |
| `pnpm db:create:test`  | Create onboardingdb_test in same Postgres (idempotent)  | ✅                       |
| `pnpm db:migrate:test` | Drizzle migrate against test DB (APP_ENV=test)          | ✅                       |
| `pnpm db:seed:test`    | Minimal seed (admin/author + demo only) on test DB      | ✅                       |
| `pnpm db:reset:test`   | Drop + create + migrate + seed test DB                  | ✅                       |
| `pnpm dev:test`        | Start API (APP_ENV=test) + web; tests / E2E hit test DB | ✅                       |
| `pnpm test:e2e`        | Playwright E2E smoke (US-001..US-005)                   | ✅                       |

---

## 11. Troubleshooting

**Port đã bị chiếm (3001 / 5173 / 5432 / 6379)**

Port 3001 (API) được auto-free mỗi lần `pnpm dev` (pre-flight SIGTERM). Nếu muốn stop chủ động cả 3001 + 5173: `pnpm stop`. Manual fallback:

```bash
lsof -iTCP:3001 -sTCP:LISTEN
kill <PID>
```

5432 / 6379 nằm trong Docker containers — đổi port qua `infra/docker/.env` (override `POSTGRES_PORT` / `REDIS_PORT`) và đồng bộ `DATABASE_URL` / `REDIS_URL` trong `apps/api/.env`.

**Override `POSTGRES_PORT` / `REDIS_PORT` trong `infra/docker/.env` không hiệu lực**

Verify đã tạo file (không phải `.env.local` ở root):

```bash
cat infra/docker/.env | grep POSTGRES_PORT
docker compose -f infra/docker/docker-compose.yml config | grep -A2 postgres
```

Nếu đang có legacy root `.env.local` từ trước CR-001, chạy `pnpm migrate:env` để split.

**API start fail `DATABASE_URL undefined` hay connect refused**

`apps/api/.env` chưa tồn tại hoặc thiếu biến. Copy template + check port khớp `infra/docker/.env`:

```bash
cp apps/api/.env.example apps/api/.env  # nếu chưa có
cat apps/api/.env | grep DATABASE_URL
cat infra/docker/.env    | grep POSTGRES_PORT
```

**`pnpm install` lỗi peer deps**

```bash
pnpm install --prefer-offline
# hoặc
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
```

**DB connection refused**

1. `docker compose ps` — kiểm postgres có healthy không.
2. `docker compose logs postgres` — xem có error.
3. `apps/api/.env` `DATABASE_URL` port có khớp `POSTGRES_PORT` trong `infra/docker/.env` không.

**Session không persist khi login**

1. `COOKIE_SECURE=false` cho local (cookie secure yêu cầu HTTPS).
2. Redis có running không: `docker compose exec redis redis-cli ping`.

**Drizzle migration lỗi "relation already exists"**
DB đang có schema cũ xung đột. Reset:

```bash
docker compose down -v && docker compose up -d postgres redis
pnpm db:migrate && pnpm db:seed
```

---

## 12. Production deploy ⏳ (v2)

- **v1 target**: Docker Compose trên 1 VPS (DO Droplet / Hetzner). Nginx reverse proxy, Let's Encrypt cert, managed Postgres.
- **v2 target**: K8s cluster. Manifests sẽ viết dần ở `infra/k8s/` — **không** là blocker cho MVP.

Xem [ADR-001](../.specs/adr/ADR-001-tech-stack.md) section 2.6 cho chi tiết infra.

---

## 13. Khi có vấn đề

1. Đọc `CLAUDE.md` nếu đang dùng AI assistant.
2. Đọc lại `.specs/00-vision.md` + `.specs/adr/ADR-001-tech-stack.md`.
3. Kiểm `.specs/stories/US-001/tasks.md` xem task nào chưa done.
4. Tạo issue nội bộ (khi có repo host).
