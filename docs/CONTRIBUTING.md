# Contributing

Repo này dùng **Spec-Driven Development (SDD)**. Trước khi đóng góp, đọc:

1. [../CLAUDE.md](../CLAUDE.md) — SDD contract + tech stack rules (áp dụng cho cả AI và human).
2. [../.specs/00-vision.md](../.specs/00-vision.md) — vision + non-goals.
3. [../.specs/02-requirements.md](../.specs/02-requirements.md) — FRs + NFRs.

---

## Workflow

### 1. Chọn work item

- Story: chọn từ [../.specs/stories/](../.specs/stories/). Mỗi story có AC + mapped FR + effort estimate.
- Task: nếu story đã break down (VD [US-001 tasks](../.specs/stories/US-001/tasks.md)), chọn task theo thứ tự. Nếu chưa → viết `tasks.md` trước.
- Bug: verify reproducible + đã có regression test plan trước khi fix.

### 2. Branch

- Trunk-based acceptable cho solo v1 — commit thẳng `main` sau khi test xanh.
- Team mode (sau pilot): `feat/us-NNN-<slug>`, `fix/<area>-<slug>`, `chore/<scope>`. PR vào `main`, squash merge.

### 3. Commit

Format: `type(scope): subject (spec-ref)` — xem [CLAUDE.md](../CLAUDE.md#commit-message-convention).

- `type`: `feat` | `fix` | `chore` | `docs` | `test` | `refactor` | `perf` | `build`
- `scope`: `api` | `web` | `shared` | `spec` | `infra` | `ci`
- `spec-ref` (preferred): `(US-001 / T3)`, `(FR-FEAT-002)`, `(ADR-001)`

Examples:
- `feat(api): session middleware with connect-redis (US-001 / T4 / FR-AUTH-001)`
- `fix(web): empty search query should not call API (US-001 / AC-8)`
- `docs(spec): ADR-002 switch to Meilisearch (ADR-002)`

### 4. Pull Request checklist

(Trunk-based solo: checklist vẫn áp dụng mentally trước khi commit.)

- [ ] Reference spec ID trong commit/PR description.
- [ ] Test viết trước (failing), commit riêng nếu helpful.
- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` đều xanh local.
- [ ] Nếu đổi schema → `pnpm db:generate` tạo migration, không hand-edit migration file.
- [ ] Nếu thêm FR / error code / endpoint → cập nhật [../.specs/02-requirements.md](../.specs/02-requirements.md), [../.specs/error-codes.md](../.specs/error-codes.md), [../.specs/api-surface.md](../.specs/api-surface.md) trong **cùng PR**.
- [ ] Nếu đổi spec → update [../.specs/traceability.md](../.specs/traceability.md).
- [ ] Không commit `.env.local`, secret, generated artifact.
- [ ] Không `.skip`/`.only` trong test committed.

### 5. Definition of Done (task-level)

Xem [../.specs/stories/US-001/tasks.md §Conventions](../.specs/stories/US-001/tasks.md). Mỗi task DoD:
1. Tests passing (`pnpm test`).
2. `pnpm lint` + `pnpm typecheck` xanh.
3. AC liên quan có automated test.
4. Commit landed `main`.

### 6. Definition of Ready (story-level)

Xem [../CLAUDE.md §Definition of Ready](../CLAUDE.md#definition-of-ready-dor--story-level). Story DoR:
1. User perspective rõ (role + goal + benefit).
2. AC đầy đủ Given/When/Then.
3. FR mapped → có trong [../.specs/02-requirements.md](../.specs/02-requirements.md).
4. Persona mapped → có trong [../.specs/01-personas.md](../.specs/01-personas.md).
5. Dependency resolved hoặc noted.
6. Effort estimate (hours range).
7. Test plan outline.

---

## Tool setup

Xem [SETUP.md](SETUP.md).

### Local dev gotchas

- Pre-commit hook (husky + lint-staged) chạy ESLint + Prettier trên staged files. Nếu fail, fix rồi re-stage — **không** skip bằng `--no-verify`.
- Docker Compose local: `docker compose down -v` xoá volumes (reset DB). Dùng khi migration conflict.
- Env secrets: mỗi dev có `.env.local` của riêng. Template: [../.env.example](../.env.example).

---

## Code style

- **TypeScript strict**: `strict: true` toàn repo. Không `any` không comment.
- **Formatting**: Prettier default config. Không bàn cãi phong cách.
- **Import order**: automatic qua ESLint `import/order` plugin (nếu enable).
- **Naming**:
  - File: kebab-case cho route/lib, PascalCase cho React component.
  - Variable: camelCase; const uppercase chỉ khi true global constant (enum, config).
  - Type/Interface: PascalCase; tránh prefix `I`.
- **Comments**: default không viết. Viết khi WHY non-obvious (workaround, hidden constraint). Không narrate WHAT.

---

## Adding new dependency

1. Justify: link tới spec/task cần nó.
2. Check alternatives: có thể tự viết < 30 dòng không?
3. Check bundle size (FE): https://bundlephobia.com.
4. Add: `pnpm --filter @onboarding/<app> add <pkg>`.
5. Commit `build(<scope>): add <pkg> for <reason> (<spec-ref>)`.

---

## Asking for help

- Check existing spec + glossary first.
- Nếu spec gap → raise PR propose FR/US thay vì tự code.
- Nếu gap về quyết định architectural → viết ADR proposal (sao chép [../.specs/adr/_template.md](../.specs/adr/_template.md)).
