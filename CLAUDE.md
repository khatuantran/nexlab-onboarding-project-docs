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
├── api-surface.md          # endpoint catalog
├── error-codes.md          # canonical error code registry
├── glossary.md             # domain terminology
├── risks.md                # risk + assumption register
├── roadmap.md              # milestone plan
├── traceability.md         # FR ↔ US ↔ Task matrix
├── adr/
│   └── ADR-NNN-*.md        # architecture decision records
├── stories/
│   ├── US-NNN.md           # user story (Given/When/Then)
│   └── US-NNN/tasks.md     # 2-4h task breakdown
├── ui/                     # per-screen UI specs (gate before FE TDD)
│   ├── design-system.md    # tokens + icons + components (registry)
│   └── <screen>.md         # 02-ui-spec-template clones
├── backlog/                # deferred ideas tracked as BL-NNN
│   ├── README.md           # index (exempt registry)
│   └── BL-NNN.md           # 06-backlog-item-template clones
├── bugs/                   # reported faults (TDD: test before fix)
│   ├── README.md
│   └── BUG-NNN.md          # 05-bug-template clones
├── changes/                # mid-milestone scope/spec/tech changes
│   ├── README.md
│   └── CR-NNN.md           # 05-change-request-template clones
├── incidents/              # prod post-mortems (48h SLA)
│   ├── README.md
│   └── INC-NNN.md          # 06-incident-template clones
└── releases/
    └── CHANGELOG.md        # Keep-a-Changelog format
```

---

## When a request comes in

- **"Add feature X"** → check if an FR exists in `02-requirements.md` and a US exists in `stories/`. If not, propose the FR/US first.
- **"Fix bug Y"** → check `.specs/bugs/` for existing BUG-NNN. If not, clone [05-bug-template.md](templates/05-bug-template.md) → `.specs/bugs/BUG-NNN.md`, write failing regression test (commit test alone), then fix commit (`fix(<scope>): ... (BUG-NNN)`). Update `.specs/bugs/README.md` index.
- **"Refactor Z"** → must preserve spec-guaranteed behavior. Add tests if missing before touching code.
- **"Đổi scope / spec mid-milestone"** → clone [05-change-request-template.md](templates/05-change-request-template.md) → `.specs/changes/CR-NNN.md`. Capture Impact + Alternatives + Decision. User approves before code touches. If architectural → spawn ADR-NNN.
- **"Idea Z chưa fit sprint"** → clone [06-backlog-item-template.md](templates/06-backlog-item-template.md) → `.specs/backlog/BL-NNN.md` với Priority P0-P3. Không đẩy vào `02-requirements.md` / `stories/` cho tới khi đạt promotion criteria.
- **"Sự cố prod xảy ra"** → within 48h của resolution, clone [06-incident-template.md](templates/06-incident-template.md) → `.specs/incidents/INC-NNN.md`. 5-whys root cause + action items với owner/due/tracking.

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
- [ ] **UI spec per authenticated screen** trong story: mỗi screen có file `.specs/ui/<screen>.md` clone từ [templates/02-ui-spec-template.md](templates/02-ui-spec-template.md), user-approved (Status = `Ready` hoặc `Implemented`). Token/icon/component mới đã update [.specs/ui/design-system.md](.specs/ui/design-system.md) (nếu có).

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
- [.specs/stories/US-NNN/tasks.md](.specs/stories/US-NNN/tasks.md) — Task Summary cột Status + Last updated line. **Bắt buộc flip DoD checkbox `[ ]` → `[x]` cho mọi item trong khối `### T<N>` vừa ship** — cùng commit sync này. Không để drift giữa Summary (✅) và DoD (`[ ]`).
- [.specs/traceability.md](.specs/traceability.md) — reverse-index 🟡 Planned → ✅ kèm commit hash.
- [.specs/api-surface.md](.specs/api-surface.md) — nếu task BE ship endpoint mới hoặc đổi request/response shape/errors: cập nhật row tương ứng + link commit hash trong cột Task. Không bỏ sót dù endpoint là "US-NNN task" stub.
- [.specs/error-codes.md](.specs/error-codes.md) — nếu task introduce error code mới hoặc đổi HTTP status mapping: cập nhật row + cột "Where raised".
- [.specs/ui/\<screen\>.md](.specs/ui/) — nếu task chạm FE screen: Status `Draft`/`Ready` → `Implemented`.
- [.specs/ui/design-system.md](.specs/ui/design-system.md) — thêm row CHANGELOG nếu task add/đổi token/icon/component/variant.
- [.specs/bugs/BUG-NNN.md](.specs/bugs/) + [.specs/bugs/README.md](.specs/bugs/README.md) — nếu task fix bug: BUG status `Open`/`In Progress` → `Fixed` + commit hash; row index cập nhật.
- [.specs/changes/CR-NNN.md](.specs/changes/) + [.specs/changes/README.md](.specs/changes/README.md) — nếu task thực thi CR approved: row index cập nhật Status + implementation link.
- [.specs/releases/CHANGELOG.md](.specs/releases/CHANGELOG.md) — thêm row dưới `[Unreleased]` nếu commit ship user-facing change (Added/Changed/Fixed/...).
- File khác task chạm cụ thể mà chưa có bullet trên (safety net — ưu tiên thêm bullet mới nếu pattern lặp).

**Rule**:

- Không skip, không gom vào commit chính — luôn commit riêng để diff chỉ còn marker changes, dễ audit.
- Không cần hỏi user permission (scope hẹp, chỉ progress markers).
- Chạy `pnpm smoke` trước commit để catch markdown/format issue.
- Chỉ hỏi user nếu task lộ ra **spec gap** (FR mới, AC mới, scope change) — đó là spec update, không phải progress sync.
- Nếu task không ảnh hưởng file nào → skip commit, ghi rõ `(no progress sync needed)` trong response.

## SDD guardrail — flag khi user đi lệch quy trình

Nếu user prompt đụng action không khớp SDD flow, **KHÔNG** im lặng làm theo. Dừng lại, flag rõ, đề xuất quy trình đúng, chờ user confirm.

### Common violations + response

| Trigger từ user                                                           | Rule bị vi phạm                               | Đề xuất                                                                                                                                             |
| ------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Thêm endpoint / feature X" chưa có FR + US                               | SDD Contract #3 (No spec-less code)           | "FR/US nào cover? Nếu chưa, viết FR + US trước, clone từ `templates/01-*.md`."                                                                      |
| "Fix bug Y" không có regression test                                      | #4 (TDD)                                      | "Viết failing test reproduce trước, commit riêng. Sau đó fix + commit."                                                                             |
| Start T\<N+1\> khi T\<N\> chưa DoD pass                                   | §tasks.md Conventions "Order"                 | "T\<N\> chưa ✅ trong traceability/roadmap. Finish DoD + progress-sync trước."                                                                      |
| Viết file `.specs/` không clone template                                  | #8 (Template is law)                          | "Clone từ `templates/XX-*.md`. Template không fit → propose update + bump version."                                                                 |
| Gom spec change + code change vào 1 commit                                | #5 (Small commits) + §Post-task progress sync | "Tách: spec commit riêng → code commit riêng → progress-sync commit riêng. Mỗi diff 1 concern."                                                     |
| "Skip test đi" / `--no-verify` / bypass husky                             | #4 + §Hard DO NOTs                            | Flag + ask explicit lý do. Không tự bypass.                                                                                                         |
| Scope creep: "làm task hiện tại + feature X luôn"                         | §Default mode of working                      | "Feature X ngoài scope task hiện tại. Viết US/task riêng, hoặc split sau khi task N xong."                                                          |
| Commit secrets / `.env*` / key file                                       | §Hard DO NOTs                                 | **Block thẳng**, không override.                                                                                                                    |
| "Start T\<FE-task\>" khi chưa có `.specs/ui/<screen>.md` approved         | SDD #3 (No spec-less code) + §DoR             | "Màn hình \<X> chưa có UI spec. Clone `templates/02-ui-spec-template.md` → draft → user review → mới TDD."                                          |
| FE code add token/variant/icon chưa có trong `.specs/ui/design-system.md` | SDD #3 + §DoR                                 | "Token/variant/icon mới chưa trong design-system.md. Update registry trước (commit riêng) → rồi code."                                              |
| "Fix bug Y" không có `.specs/bugs/BUG-NNN.md`                             | SDD #3 + #4 (TDD)                             | "Bug chưa có BUG-NNN. Clone `templates/05-bug-template.md`, viết repro + failing regression test trước (commit test riêng) → rồi fix."              |
| Scope/spec/tech change mid-milestone không có `.specs/changes/CR-NNN.md`  | SDD #3 + Roadmap integrity                    | "Scope change cần CR-NNN capture Impact + Alternatives + Decision. Clone `templates/05-change-request-template.md` → user approve → rồi đụng code." |
| "Thêm FR/US mới" cho idea loose chưa ready                                | SDD #3 + Backlog discipline                   | "Idea chưa có US đầy đủ → viết `.specs/backlog/BL-NNN.md` trước (P0-P3), triage sau. Không đẩy thẳng vào `02-requirements.md` / `stories/`."        |
| Post-mortem prod không có INC-NNN sau 48h                                 | §Incident SLA                                 | "Sự cố đã mitigate nhưng chưa có INC-NNN. Clone `templates/06-incident-template.md` trong 48h kể từ resolved."                                      |

### Response format khi flag

```
⚠️ SDD check: <1 câu mô tả chỗ lệch>
Rule: <link §... CLAUDE.md hoặc templates/>
Đề xuất: <1-3 step đúng quy trình>
Override? Confirm "override: <reason>" và tôi làm (sẽ ghi rõ trong commit/response).
```

### Override policy

- User có thể explicit override (`"proceed anyway"` / `"override: <reason>"`). AI làm theo nhưng **ghi rõ** trong commit body hoặc response rằng đã override rule nào.
- **Không override** cho Hard DO NOTs liên quan security (commit secret, push force `main`, skip signing).

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
- **Env**: per-layer files — `infra/docker/.env` (compose auto-load), `apps/api/.env` (`dotenv/config` at every API entrypoint), `apps/web/.env.local` (Vite auto-load). All gitignored. Templates live next to each runtime file (`.env.example`). Run `pnpm migrate:env` to split a legacy root `.env.local`. See [CR-001](.specs/changes/CR-001.md).
- **Coding conventions (mandatory, apply every PR/commit)**: [docs/conventions-be.md](docs/conventions-be.md) cho `apps/api/`; [docs/conventions-fe.md](docs/conventions-fe.md) cho `apps/web/`. Đọc trước khi start task tương ứng.

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

## Deploy policy

- **FE (Netlify)** — auto-build on `git push origin main` qua Netlify GitHub App. Không cần thao tác gì.
- **BE (Fly.io)** — 2 đường, ưu tiên auto khi có:
  - **Auto (preferred)**: workflow [.github/workflows/deploy-be.yml](.github/workflows/deploy-be.yml) trigger trên push tới `apps/api/**`, `packages/shared/**`, hoặc workflow file. Yêu cầu repo secret `FLY_API_TOKEN`. Public repo → 0$ Action minutes.
  - **Manual**: khi auto fail (e.g. token missing/expired) hoặc user nói "deploy" / "deploy BE" / "push deploy" cho one-off, chạy từ repo root:

    ```bash
    fly deploy --local-only \
      --config apps/api/fly.toml \
      --dockerfile apps/api/Dockerfile \
      --app onboarding-api-cool-waterfall-8568
    ```

    Dùng `--local-only` (không `--remote-only`) vì Fly depot remote builder yêu cầu credit; local build qua Docker daemon thì free. Yêu cầu Docker daemon chạy local.

  Sau khi xong (auto hoặc manual), smoke check `curl -sS https://onboarding-api-cool-waterfall-8568.fly.dev/api/v1/health` và báo kết quả.

- **Không tự `fly deploy`** khi user chưa explicit yêu cầu. Push code lên main → auto workflow tự chạy (đó là contract); nhưng KHÔNG chạy `fly deploy` manual nếu user chưa nói "deploy".

---

## Ambiguity policy — hỏi trước khi làm

Khi prompt của user có chỗ chưa rõ — scope mơ hồ, intent có nhiều cách hiểu, lựa chọn kỹ thuật không khớp pattern hiện có, hoặc decision có blast radius rộng — **KHÔNG** đoán rồi làm. Dừng lại, liệt kê interpretation, hỏi 1 câu hỏi gọn (≤ 3 lựa chọn), chờ user confirm.

**Trigger cụ thể** (không exhaustive — judgment-based):

- User nói "fix bug này" / "thêm tính năng này" nhưng prompt không nêu file/endpoint/AC cụ thể → hỏi.
- Có ≥ 2 implementation approach hợp lý với trade-off khác nhau (VD: drop auth vs proxy vs crossorigin) → hỏi user pick approach trước khi viết code.
- User dùng từ generic ("update X", "improve Y") trong khi codebase có nhiều X / Y candidate → hỏi target cụ thể.
- Action sẽ chạm prod (push, deploy, secrets, force-push, schema migration không reversible) → confirm 1 lần dù đã có context.
- Decision sẽ ghi vào spec (CR, ADR, FR amend) → confirm trước khi commit, vì spec khó undo.

**Định dạng câu hỏi** (dùng `AskUserQuestion` tool nếu có ≤ 4 lựa chọn rõ ràng, ngược lại text bullet):

```text
Trước khi làm, confirm 1 chỗ:
- A) <option 1 ngắn gọn>
- B) <option 2 ngắn gọn>
- C) Khác — bạn mô tả.
Recommend A vì <1 dòng lý do>.
```

**Không hỏi** khi:

- Task rõ ràng, single-path, low blast radius (VD: fix typo, rename internal var, format file).
- User đã confirm trong cùng turn / plan đã được approve qua `ExitPlanMode`.
- Hỏi thêm sẽ chậm flow hơn chi phí của bug (cost-benefit judgment).

Nếu lỡ làm rồi mới thấy chỗ mơ hồ → dừng, flag rõ "tôi đã làm X dựa trên giả định Y, nếu sai bạn cho biết để revert" — không silently push tiếp.

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
