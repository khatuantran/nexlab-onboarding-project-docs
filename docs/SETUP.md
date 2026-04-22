# Local Setup Guide

> **Trạng thái**: Sống cùng implementation. Nhãn mỗi section: ✅ `works now` · 🟡 `pending (task T-N)` · ⏳ `v2`. Xem [roadmap.md](../.specs/roadmap.md).
>
> Progress hiện tại: **T1-T3 ✅ done** (monorepo + API skeleton + Docker Compose + BE infra scaffold). T4-T10 còn 🟡.

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
- **direnv** để auto-load `.env.local` (không bắt buộc).
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

## 3. Environment variables ✅ (template shipped; API reads .env.local in T2)

Copy template rồi điền:

```bash
cp .env.example .env.local
```

Biến môi trường tối thiểu:

```dotenv
# Web
VITE_API_BASE_URL=http://localhost:3001/api/v1

# API
API_PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://dev:dev@localhost:5432/onboardingdb
REDIS_URL=redis://localhost:6379
SESSION_SECRET=change-me-to-random-long-string
SESSION_COOKIE_NAME=sid
COOKIE_SECURE=false
LOG_LEVEL=debug
```

**Không commit `.env.local`** — đã có trong `.gitignore`.

---

## 4. Start infrastructure ✅ (T2 done)

Từ root:

```bash
pnpm docker:up
```

(Tương đương `docker compose -f infra/docker/docker-compose.yml up -d`.)

Verify:

```bash
docker compose -f infra/docker/docker-compose.yml ps
# postgres   Up (healthy)
# redis      Up (healthy)
```

Nếu port 5432 hoặc 6379 đã bị chiếm, override qua `.env.local`:

```dotenv
POSTGRES_PORT=5433
REDIS_PORT=6380
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

## 5. Database migration 🟡 (pending T5)

Tạo schema:

```bash
pnpm --filter @onboarding/api db:migrate
```

Hoặc từ root:

```bash
pnpm db:migrate
```

Lệnh này chạy `drizzle-kit migrate` với `DATABASE_URL` từ `.env.local`.

Xem schema snapshot hiện tại:

```bash
pnpm db:check
```

---

## 6. Seed data 🟡 (pending T5)

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

---

## 7. Start dev servers ⚠️ API ✅ (T2) · Web 🟡 (pending T4 scaffold / T8 login)

Hiện tại `pnpm dev` chỉ chạy API (Web shell sẽ wire ở T4, login ở T8):

```bash
pnpm dev
# → API on http://localhost:3001 (Express, tsx watch auto-reload)
```

Sau T6 sẽ chạy 2 process parallel:

- **API**: http://localhost:3001 (Express, `tsx watch`)
- **Web**: http://localhost:5173 (Vite HMR, proxy `/api/*` → API)

---

## 8. Smoke-test checklist ⚠️ 8.1 ✅ (T2) · 8.2 + 8.3 🟡 (pending T7, T9)

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

## 9. Run tests 🟡 (pending — test sẽ thêm cùng từng task TDD)

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

| Command             | Mục đích                                     | Status                      |
| ------------------- | -------------------------------------------- | --------------------------- |
| `pnpm install`      | Install workspace deps                       | ✅ T1                       |
| `pnpm lint`         | ESLint cho toàn repo                         | ✅ T1                       |
| `pnpm format`       | Prettier format                              | ✅ T1                       |
| `pnpm typecheck`    | `tsc --noEmit` all workspaces                | ✅ T1                       |
| `pnpm test`         | Vitest (passWithNoTests hiện tại)            | ✅ T1                       |
| `pnpm smoke`        | `scripts/smoke.sh` = lint + typecheck + test | ✅ T1                       |
| `pnpm dev`          | Start API (web added in T4 scaffold)         | ⚠️ API ✅ T2 / Web 🟡 T4    |
| `pnpm build`        | Build api prod (web prod in T4)              | ⚠️ API ✅ T2 / Web 🟡 T4    |
| `pnpm docker:up`    | Start postgres + redis                       | ✅ T2                       |
| `pnpm docker:down`  | Stop containers                              | ✅ T2                       |
| `pnpm docker:reset` | Stop + xoá data volumes                      | ✅ T2                       |
| `pnpm docker:logs`  | Tail logs postgres + redis                   | ✅ T2                       |
| `pnpm db:generate`  | Generate migration từ schema change          | ⚠️ T3 ✅ config / T5 schema |
| `pnpm db:migrate`   | Drizzle migrate up                           | ⚠️ T3 ✅ config / T5 schema |
| `pnpm db:check`     | Drizzle-kit consistency check                | ⚠️ T3 ✅ config / T5 schema |
| `pnpm db:seed`      | Seed dev data                                | 🟡 T5                       |
| `pnpm test:e2e`     | Playwright E2E                               | 🟡 T10                      |

---

## 11. Troubleshooting

**Port đã bị chiếm (3001 / 5173 / 5432 / 6379)**

```bash
lsof -iTCP:3001 -sTCP:LISTEN
kill <PID>
```

Hoặc đổi port trong `.env.local` + `docker-compose.yml`.

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
3. `.env.local` DATABASE_URL port có khớp với `docker-compose.yml` không.

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
