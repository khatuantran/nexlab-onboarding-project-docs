# CLAUDE.md — AI Working Rules for this Repo

This project follows **Spec-Driven Development (SDD)**. All specs live in `.specs/`. Before writing or modifying code, you MUST read the relevant spec(s). If a spec does not exist for what you're about to change, pause and ask the user to write (or let you write) the spec first.

---

## The SDD Contract (non-negotiable)

1. **Read before write.** Read `.specs/00-vision.md` and any relevant `.specs/stories/US-XXX.md` before coding.
2. **Spec precedence.** If code and spec disagree, the **spec wins** — update the code, or escalate to the user if the spec seems wrong.
3. **No spec-less code.** Do not add a new feature, route, endpoint, or screen unless a user story or FR exists in `.specs/`.
4. **TDD by default.** Every task starts with a failing test. Red → green → refactor. Commit at each green.
5. **Small commits.** One concern per commit. Conventional Commits style: `type(scope): subject`.
6. **EARS requirements.** New functional requirements use EARS format (Ubiquitous / Event / State / Optional / Unwanted / Complex).
7. **Glossary is law.** New domain term → add to `.specs/glossary.md` FIRST, then use it consistently.
8. **Template is law.** Không viết file mới trong `.specs/` mà không clone từ template tương ứng ở `templates/`. Xem §Template Compliance Rules.

---

## Spec Tree

```
.specs/
├── 00-vision.md            # product vision, users, goals, non-goals
├── 01-personas.md          # user personas
├── 02-requirements.md      # FRs (EARS) + NFRs
├── 03-architecture.md      # architecture summary (links to ADRs)
├── glossary.md             # domain terminology
├── adr/
│   └── ADR-XXX-*.md        # architecture decision records
└── stories/
    ├── US-XXX.md           # user story (Given/When/Then)
    └── US-XXX/
        └── tasks.md        # 2-4h task breakdown
```

---

## When a request comes in

- **"Add feature X"** → check if an FR exists in `02-requirements.md` and a US exists in `stories/`. If not, propose the FR/US first.
- **"Fix bug Y"** → check if the behavior is covered by any spec/story. Bug may be in code OR in spec. Add a regression test before fixing.
- **"Refactor Z"** → must preserve spec-guaranteed behavior. Add tests if missing before touching code.

## Default mode of working

1. Identify the spec you're implementing (FR-xxx / US-xxx / Task-Tx).
2. Write or update the test first.
3. Run the test → expect red.
4. Implement the minimum to make it green.
5. Refactor with tests green.
6. Commit with spec reference: `feat(api): add GET /projects/:id/features endpoint (US-001 / T5)`.

---

## Definition of Ready (DoR) — story-level

Một user story chỉ được start task breakdown / implementation khi đạt **tất cả** checklist:

- [ ] **User perspective** rõ: "As a <role>, I want <capability>, so that <benefit>."
- [ ] **Acceptance criteria** đầy đủ Given/When/Then, không có "TBD".
- [ ] **FR mapping**: mỗi AC trace về ≥ 1 FR trong [02-requirements.md](.specs/02-requirements.md).
- [ ] **Persona mapping**: story link về persona cụ thể trong [01-personas.md](.specs/01-personas.md).
- [ ] **Dependencies** declared: US/task prerequisite, infra, seed data. Nếu chưa resolve → note rõ.
- [ ] **Scope in/out** explicit: dễ spot scope creep.
- [ ] **Effort estimate**: range hours (solo TDD pace).
- [ ] **Test plan**: outline unit/integration/E2E coverage.
- [ ] **Known risks**: ≥ bullet ở §Risks (có thể refer về [risks.md](.specs/risks.md)).
- [ ] **Traceability matrix** cập nhật: [traceability.md](.specs/traceability.md) có row cho story.

Không đạt DoR → **không viết tasks.md**; hỏi user clarify hoặc viết thêm spec trước.

## Definition of Done (DoD) — task-level

Xem [stories/US-001/tasks.md §Conventions](.specs/stories/US-001/tasks.md). Minimal DoD:

- [ ] Tests passing (`pnpm test`).
- [ ] `pnpm lint` + `pnpm typecheck` green.
- [ ] Linked AC có automated test coverage.
- [ ] Commit message format `type(scope): subject (spec-ref)`.
- [ ] Liên quan spec update (API surface / error codes / traceability) cùng commit nếu áp dụng.

## Post-task progress sync (mandatory)

Sau khi commit task `T<N>` land (DoD pass), **trong cùng phiên làm việc** tạo 1 commit follow-up riêng với message `docs: sync progress markers after T<N> land (US-NNN / T<N> follow-up)` update các file sau nếu bị ảnh hưởng:

- [README.md](README.md) — status line, "Next task" pointer, live-command list.
- [docs/SETUP.md](docs/SETUP.md) — nhãn 🟡 → ✅ cho section task-covered; §Common commands cột Status.
- [.specs/roadmap.md](.specs/roadmap.md) — milestone progress table (task row + commit hash + date).
- [.specs/stories/US-NNN/tasks.md](.specs/stories/US-NNN/tasks.md) — Task Summary cột Status + Last updated line.
- [.specs/traceability.md](.specs/traceability.md) — reverse-index 🟡 Planned → ✅ kèm commit hash.
- File khác task chạm cụ thể (VD `api-surface.md` khi có endpoint mới, `error-codes.md` khi có code mới).

**Rule**:

- Không skip, không gom vào commit chính — luôn commit riêng để diff chỉ còn marker changes, dễ audit.
- Không cần hỏi user permission (scope hẹp, chỉ progress markers).
- Chạy `pnpm smoke` trước commit để catch markdown/format issue.
- Chỉ hỏi user nếu task lộ ra **spec gap** (FR mới, AC mới, scope change) — đó là spec update, không phải progress sync.
- Nếu task không ảnh hưởng file nào → skip commit, ghi rõ `(no progress sync needed)` trong response.

---

## Commit message convention

```
type(scope): subject (spec-ref)
```

- `type`: `feat` | `fix` | `chore` | `docs` | `test` | `refactor` | `perf` | `build`
- `scope`: `api` | `web` | `shared` | `spec` | `infra` | `ci`
- `spec-ref`: optional but preferred, e.g. `(US-001)`, `(FR-FEAT-002)`, `(ADR-001)`

Examples:

- `feat(api): add feature section CRUD (US-002 / FR-FEAT-003)`
- `test(web): cover feature page empty state (US-001)`
- `docs(spec): expand glossary with 'section owner' (glossary)`

---

## Tech-stack specifics

Full rationale: [.specs/adr/ADR-001-tech-stack.md](.specs/adr/ADR-001-tech-stack.md). Absolute minimum an AI must know working in this repo:

- **Package manager**: `pnpm` (NOT npm / yarn). `pnpm install`, `pnpm add -w <pkg>` for root, `pnpm --filter @onboarding/<app> add <pkg>` for per-app.
- **Monorepo**: `apps/web` (React+Vite), `apps/api` (Express), `packages/shared` (Zod schemas + TS types). Shared schemas — **reuse**, don't redefine on FE or BE.
- **Language**: TypeScript strict. No `any` without a comment explaining why.
- **Tests**: Vitest (unit), Playwright (E2E). Run with `pnpm test` / `pnpm test:watch` / `pnpm test:e2e`.
- **Lint/format**: `pnpm lint` and `pnpm format`. Both must pass before commit (enforced by husky pre-commit).
- **Typecheck**: `pnpm typecheck` (root). Must pass.
- **API conventions**:
  - Base URL: `/api/v1/...`
  - Errors: `{ error: { code, message, details? } }` + correct HTTP status.
  - Validation: Zod at every route boundary.
  - Auth: session cookie `sid` (httpOnly). Session store = Redis via `connect-redis`.
- **DB**: Drizzle ORM. Schema in `apps/api/src/db/schema.ts`. Migrations in `apps/api/src/db/migrations/` — **never hand-edit committed migration files**; run `pnpm db:generate` to produce new migration after schema change.
- **Env**: `.env.local` at repo root (gitignored). Template in `.env.example`.

When in doubt about a tech choice, read ADR-001 first. If the question isn't covered and is architectural, propose **ADR-002** rather than silently deciding.

---

## Template Compliance Rules

Mọi file trong `.specs/` phải clone từ template ở [`templates/`](templates/). Full registry + per-template required sections + versioning policy: [templates/README.md](templates/README.md).

### Quick mapping (hay dùng)

| Target file                                 | Template                                  |
| ------------------------------------------- | ----------------------------------------- |
| `.specs/stories/US-NNN.md`                  | `templates/01-user-story-template.md`     |
| `.specs/stories/US-NNN/tasks.md` (per-task) | `templates/03-task-template.md`           |
| `.specs/adr/ADR-NNN-*.md`                   | `templates/04-adr-template.md`            |
| `.specs/bugs/BUG-NNN.md`                    | `templates/05-bug-template.md`            |
| `.specs/changes/CR-NNN.md`                  | `templates/05-change-request-template.md` |

Full 11-row table: [templates/README.md §1](templates/README.md#1-template-registry).

### Pre-save validation (MUST chạy trước mỗi Write/Edit vào `.specs/`)

1. Read template tương ứng từ `templates/`.
2. Verify file mới có đủ mọi `## <heading>` trong template frontmatter `required_sections`, đúng thứ tự.
3. Verify placeholder `<...>` / `TBD` còn lại là cố ý (có note lý do); không sót.
4. Verify template-ref ở dòng 2: `<!-- template: XX-*.md@<version> -->` match template version.
5. Fail bất kỳ bước → **KHÔNG Write**. Print diff vs template + hỏi user.

VD: trước khi tạo `.specs/stories/US-004.md`, tôi Read `templates/01-user-story-template.md`, verify target có đủ heading `## Metadata / User perspective / Scope in / Scope out / Acceptance criteria / UX notes / Dependencies / Downstream consumers / Risks & open items / Test plan / Tasks`.

### Khi template không fit

- KHÔNG deviate im lặng. KHÔNG thêm/xóa required section tự chế.
- Viết proposal: `Template change proposal: <diff> because <reason>` → chờ user confirm → bump template version + commit template trước → dùng sau.
- User reject → refactor content để fit template hiện tại.

### Versioning (tóm tắt)

- Minor bump (`0.1` → `0.2`): thêm optional section, clarify hint. Không migrate file cũ.
- Breaking bump (`0.1` → `1.0`): remove/rename required section. **Phải** migrate file đang dùng template cũ trong cùng PR.
- Chi tiết: [templates/README.md §5](templates/README.md#5-versioning-policy).

---

## Hard DO NOTs

- Do NOT create documentation files outside `.specs/` or `docs/` unless the user explicitly asks.
- Do NOT install dependencies without a spec/task justifying them.
- Do NOT skip tests with `.skip` or `.only` in committed code.
- Do NOT commit secrets, `.env*`, or generated artifacts.
- Do NOT bypass git hooks (`--no-verify`) unless the user explicitly asks.
- Do NOT auto-push to remote. Local commits only unless asked.

---

## Response style in this repo

- Vietnamese for domain/content discussions with the user.
- English for code, tests, commit messages, and tooling configs.
- Be terse. Reference file paths, not paragraphs.
