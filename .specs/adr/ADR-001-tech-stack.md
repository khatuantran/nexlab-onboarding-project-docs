# ADR-001 — Tech Stack Decision (MVP v1)

<!-- template: 04-adr-template.md@0.2 -->

- **Status**: Accepted
- **Date**: 2026-04-22
- **Deciders**: @khatuantran11 (solo owner)
- **Supersedes**: —
- **Related**: [Vision](../00-vision.md), [Architecture summary](../03-architecture.md), [ADR-003 Nexlab DS](ADR-003-nexlab-design-system.md) (partial supersede: font stack + shadcn-neutral tokens)

---

## 1. Context

Owner build greenfield MVP cho Onboarding Doc Portal:

- **Team**: solo, 2-3 tháng, side project (ngoài giờ).
- **Scale mục tiêu**: 20-100 dev, 3-10 project, 2-5 dev mới/tháng (workload nhẹ, không bust traffic).
- **Stack preference** owner đã chọn trước: React + Tailwind (FE), Express.js + PostgreSQL + Redis (BE), Docker Compose (dev), K8s (prod).
- **Non-goals v1**: AI Q&A, real-time collab, native mobile, SSO / permissions phức tạp, 2-way sync với tool ngoài.

Cần chốt chi tiết **từng layer** (bundler, ORM, test, validation, auth, routing, state mgmt, lint/format, deployment) để unblock Bước 4-6.

Guideline: prefer **boring, well-documented, solo-friendly** technology. Tránh cutting-edge tool chưa stable. Mỗi dep phải có lý do.

---

## 2. Decision

### 2.1 Monorepo & tooling

| Concern           | Choice                                                                         | Lý do ngắn                                                                               |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Monorepo          | **pnpm workspaces**                                                            | Đơn giản nhất, không cần task runner layer (Turborepo/Nx) cho solo. Upgrade sau nếu cần. |
| Package manager   | **pnpm ≥ 9**                                                                   | Nhanh, tiết kiệm disk, strict peer-deps.                                                 |
| Node              | **Node 20 LTS**                                                                | LTS, hỗ trợ native test runner, fetch, top-level await.                                  |
| Language          | **TypeScript 5.x (strict)**                                                    | Chia sẻ type giữa FE/BE qua `packages/shared`. `strict: true` bật hết.                   |
| Commit convention | **Conventional Commits**                                                       | `type(scope): subject (spec-ref)`.                                                       |
| Git hooks         | **Husky + lint-staged**                                                        | Pre-commit chạy eslint/prettier trên staged files.                                       |
| Lint              | **ESLint** (typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks) | Standard.                                                                                |
| Format            | **Prettier**                                                                   | Không bàn cãi phong cách.                                                                |

**Layout:**

```
apps/
  web/         # React + Vite
  api/         # Express
packages/
  shared/      # TS types, Zod schemas dùng chung
docs/          # Human docs (SETUP, CONTRIBUTING)
.specs/        # SDD specs
infra/
  docker/      # Docker Compose, Dockerfiles
  k8s/         # K8s manifests (deferred v2 prep)
```

### 2.2 Frontend (`apps/web`)

| Concern      | Choice                              | Lý do ngắn                                                                       |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| Build tool   | **Vite 5**                          | Nhanh, hot reload tốt, config nhẹ.                                               |
| Framework    | **React 18**                        | Ecosystem lớn, owner quen thuộc.                                                 |
| Routing      | **React Router v6** (data APIs)     | Solo-friendly, đủ mạnh, không cần Next.js SSR ở v1.                              |
| Server state | **TanStack Query (React Query) v5** | Cache + refetch chuẩn, tiết kiệm boilerplate so với Redux.                       |
| Client state | **Zustand** (nếu cần)               | Chỉ dùng khi có state toàn app (theme, user profile). Mặc định dùng React state. |
| Forms        | **react-hook-form + zod resolver**  | Re-dùng Zod schema từ `packages/shared`.                                         |
| CSS          | **Tailwind CSS v3+**                | Owner chọn.                                                                      |
| Components   | **shadcn/ui**                       | Copy-paste components, không lock vào 1 lib.                                     |
| Icons        | **lucide-react**                    | Đi kèm shadcn/ui.                                                                |
| Testing      | **Vitest + @testing-library/react** | Chạy trên Vite, cùng runner với BE.                                              |
| E2E          | **Playwright**                      | Chuẩn mới, nhanh hơn Cypress. Tối thiểu 1 smoke test per story.                  |

### 2.3 Backend (`apps/api`)

| Concern        | Choice                                         | Lý do ngắn                                                                                                               |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Framework      | **Express 4**                                  | Owner chọn. Đơn giản, ecosystem middleware lớn.                                                                          |
| Validation     | **Zod**                                        | Runtime validation + TS type inference. Schema share với FE qua `packages/shared`.                                       |
| ORM            | **Drizzle ORM**                                | TS-first, SQL-like, migrations tự động, không có generate step như Prisma. Nhẹ hơn cho solo.                             |
| Migrations     | **drizzle-kit**                                | `pnpm db:generate && pnpm db:migrate`.                                                                                   |
| Auth           | **express-session + connect-redis + bcryptjs** | Session server-side trong Redis (cho Redis 1 công việc thật), cookie httpOnly/secure. Có thể invalidate session tức thì. |
| Error handling | **Custom middleware** + HTTP status đúng chuẩn | JSON `{ error: { code, message } }`.                                                                                     |
| Logging        | **pino**                                       | Nhanh, structured JSON log. Log level qua env.                                                                           |
| Testing        | **Vitest + Supertest**                         | In-process test cho route + handler.                                                                                     |
| API style      | **REST JSON**                                  | Tránh GraphQL/tRPC complexity ở v1.                                                                                      |
| OpenAPI        | **Defer v2**                                   | V1 document API trong story spec, không generate OpenAPI (YAGNI).                                                        |

### 2.4 Data

| Concern               | Choice                                 | Lý do ngắn                                                                                   |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Primary DB            | **PostgreSQL 16**                      | Owner chọn. Full-text search built-in (tsvector) — đủ cho FR-SEARCH-001 v1.                  |
| Cache / session store | **Redis 7**                            | Owner chọn. V1 dùng cho session (auth) + rate limit middleware. Sau này có thể cache search. |
| Search                | **Postgres `tsvector` + `ts_rank`** v1 | Không thêm Elasticsearch/Meilisearch ở v1 — over-engineer. Revisit nếu > 10k feature.        |
| File / image storage  | **Filesystem + Docker volume** v1      | Upload screenshot → volume local. V2 chuyển S3-compatible (MinIO/R2).                        |
| Backup                | **Manual `pg_dump`** v1                | Document trong SETUP. V2 automated.                                                          |

### 2.5 Embed (FR-EMBED-001)

| Concern | Choice                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------- |
| v1      | **Client-side detect domain** → render simple link card (icon + URL + domain). No server fetch. |
| v2      | Server-side oEmbed / Open Graph fetch cho rich preview.                                         |

### 2.6 Infrastructure

| Concern       | Dev                                  | Prod (v1 target)                                | Prod (v2)                                         |
| ------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| Container     | Docker Compose                       | Docker Compose trên VPS đơn                     | **K8s** (sau khi MVP validated)                   |
| DB            | Compose service `postgres:16-alpine` | Managed Postgres (Neon / Supabase / DO Managed) | Managed hoặc self-hosted trong cluster            |
| Redis         | Compose service `redis:7-alpine`     | Managed Redis hoặc container                    | In-cluster                                        |
| Web server    | Vite dev server (port 5173)          | Nginx serve static build + reverse proxy API    | Ingress + cert-manager                            |
| Secrets       | `.env.local` (gitignored)            | Platform env vars                               | K8s Secret (sealed-secrets hoặc SOPS)             |
| CI            | —                                    | GitHub Actions: lint + test + build             | + image push + deploy                             |
| Observability | Console log                          | pino → stdout                                   | Structured log + metrics (v2: Prometheus/Grafana) |

**K8s deferred** vì: solo + 2-3 tháng → ops-heavy. Infra sẵn sàng qua Docker Compose đã unblock 100% dev flow. K8s manifests sẽ viết ở `infra/k8s/` nhưng **chưa wire vào CI/CD** cho v1.

### 2.7 API conventions (chốt sớm để nhất quán)

- Base URL dev: `http://localhost:3001/api/v1`
- Authentication: cookie `sid` (httpOnly, secure in prod, sameSite=lax)
- Errors: `4xx/5xx` status + `{ error: { code: string, message: string, details?: unknown } }`
- Success: `{ data: T }` hoặc raw resource (sẽ chốt ở US-001 task)
- Pagination: cursor-based khi list dài (feature list) → defer tới khi cần
- Date: ISO 8601 string, server authoritative

---

## 3. Alternatives considered (brief)

| Stack                                 | Pros                                            | Cons                                                                        | Lý do không chọn                                           |
| ------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Next.js 14 (App Router) fullstack** | 1 framework, auto SSR, 1 deploy                 | Owner đã chọn Express tách riêng; Next.js lock vào Vercel-friendly paradigm | Tôn trọng quyết định owner về Express.                     |
| **NestJS BE**                         | Enterprise-grade, DI, module structure          | Overkill cho v1 solo, tốn thời gian boilerplate                             | YAGNI với scale mục tiêu.                                  |
| **Prisma ORM**                        | DX tốt, schema.prisma rõ ràng                   | Generate step, runtime engine nặng hơn                                      | Drizzle nhẹ hơn, TS-native, đủ tính năng.                  |
| **tRPC**                              | End-to-end type-safe, không cần Zod duplication | Khóa ecosystem, khó test với tool REST, khó mở public API                   | REST + shared Zod đã đủ type-safe.                         |
| **Elasticsearch / Meilisearch**       | Search mạnh                                     | Thêm 1 service, op cost                                                     | Postgres FTS đủ cho ≤ 10k feature.                         |
| **Turborepo / Nx**                    | Build caching, task graph                       | Thêm layer                                                                  | Với 2 app + 1 package, pnpm là đủ.                         |
| **JWT thay vì session**               | Stateless, Redis không cần cho auth             | Khó invalidate, cần refresh token dance                                     | Session+Redis cho Redis có công việc thật + dễ invalidate. |

---

## 4. Consequences

### Positive

- Stack đồng nhất TypeScript end-to-end, share type qua `packages/shared`.
- Mọi deps đều là "boring" — solo dev không phải debug cutting-edge bug.
- Redis có vai trò rõ (session) thay vì thừa.
- Postgres FTS vừa đủ search, không thêm service.
- Docker Compose đủ dev + v1 prod nhỏ.

### Negative / trade-off

- Vite dev + Express dev chạy 2 port khác nhau → cần proxy config (Vite server.proxy) trong dev.
- Monorepo pnpm yêu cầu user hiểu `workspace:*` protocol.
- Không có SSR → SEO yếu (nhưng internal portal, không SEO).
- Drizzle ecosystem trẻ hơn Prisma → ít tutorial, hỏi AI nhiều hơn.

### Neutral

- K8s deferred v2 → cần rewrite Docker Compose → K8s sau. Document manifest stub sớm để dễ migrate.

---

## 5. Risks & mitigations

| Risk                                    | Impact             | Mitigation                                                                                        |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| K8s deploy khó khi solo tự host         | Medium             | V1 deploy VPS/Railway + Docker Compose. K8s dưới dạng practice manifest, không block release.     |
| Postgres FTS không đủ khi > 10k feature | Low (scale v1 nhỏ) | Query interface tách riêng (`searchRepo`), swap sang Meilisearch không break domain.              |
| Session+Redis phức tạp cho solo         | Low                | express-session chuẩn, connect-redis adapter 3 dòng. Có fallback: JWT trong cookie nếu Redis sập. |
| Drizzle breaking change                 | Low-Medium         | Pin version, update theo release note.                                                            |
| Monorepo pnpm leak deps                 | Low                | `pnpm.packageExtensions` config rõ; CI kiểm tra build từ clean.                                   |
| Bundle size React+Tailwind+shadcn       | Low                | Vite tree-shake, Tailwind purge. Đo ở task cuối.                                                  |

---

## 6. Validation criteria (khi nào cần revisit ADR này?)

Tạo ADR-002 + supersede nếu:

- Có nhu cầu SSR (SEO cho public-facing) → xem xét Next.js.
- Scale > 10k feature hoặc search latency > 500ms → thêm search service.
- Team mở rộng > 3 dev full-time → cân nhắc Turborepo/Nx, CI caching.
- Multi-tenant cứng (data isolation per company) → revisit auth + DB schema.

---

## 7. References

- pnpm workspaces: https://pnpm.io/workspaces
- Drizzle ORM: https://orm.drizzle.team
- TanStack Query: https://tanstack.com/query
- shadcn/ui: https://ui.shadcn.com
- Conventional Commits: https://www.conventionalcommits.org
- EARS format: https://alistairmavin.com/ears/
