# US-004 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level sections Conventions/Summary are additional_sections_allowed) -->

_Story_: [US-004 — Project catalog + admin lifecycle](../US-004.md)
_Total estimate_: ~14-16h (solo, TDD pace)
_Last updated_: 2026-04-24 (T3 landed `3ae766f`)

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-004 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **Definition of Done (DoD)** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific test file).
  2. `pnpm lint` + `pnpm typecheck` ở root không lỗi.
  3. AC liên quan trong US-004 đã có automated test coverage.
  4. Task commit landed trên `main`.
- **Order**: tasks tuần tự; không được bắt đầu T<N+1> khi T<N> chưa DoD (trừ ghi chú song song).
- **UI spec prerequisite**: T5, T6, T7 chạm FE screen → UI spec phải `Ready` trước khi start (đã có sau phase Gate 1 `31cd6f4`, `4539927`, `2773fd0`).
- **Progress-sync rule** (new): mỗi commit `docs: sync progress markers after T<N> land` **phải flip DoD checkboxes `[ ]` → `[x]`** trong khối task vừa ship — per [CLAUDE.md §Post-task progress sync](../../../CLAUDE.md) updated `9026801`.

---

## Task Summary

| #                                              | Title                                                         | Effort | AC covered                   | FR touched         | UI spec                                                          | Status       |
| ---------------------------------------------- | ------------------------------------------------------------- | ------ | ---------------------------- | ------------------ | ---------------------------------------------------------------- | ------------ |
| [T1](#t1--schema-migration--shared-schemas)    | Schema migration (`archived_at`) + shared schemas             | 2h     | prereq                       | PROJ-001, PROJ-002 | —                                                                | ✅ `e9898c7` |
| [T2](#t2--get-projects-list-api-loại-archived) | `GET /projects` list API (loại archived)                      | 2h     | AC-1, AC-4                   | PROJ-001           | —                                                                | ✅ `2939f56` |
| [T3](#t3--project-patch--archive-apis)         | `PATCH /projects/:slug` + `POST /projects/:slug/archive` APIs | 3h     | AC-5, AC-6, AC-7, AC-8, AC-9 | PROJ-002           | —                                                                | ✅ `3ae766f` |
| [T4](#t4--dropdownmenu-primitive-fe-scaffold)  | DropdownMenu primitive FE scaffold                            | 1h     | prereq FE                    | —                  | [design-system §5.1](../../ui/design-system.md)                  | 🟡 Planned   |
| [T5](#t5--homepage-catalog-fe)                 | HomePage catalog FE (ProjectRow + empty state)                | 3h     | AC-1, AC-2, AC-3, AC-4       | PROJ-001           | [home.md](../../ui/home.md)                                      | 🟡 Planned   |
| [T6](#t6--editprojectdialog-fe)                | EditProjectDialog FE + useUpdateProject mutation              | 2h     | AC-5, AC-6                   | PROJ-002           | [edit-project-dialog.md](../../ui/edit-project-dialog.md)        | 🟡 Planned   |
| [T7](#t7--projectactionsmenu-fe--archive-wire) | ProjectActionsMenu FE + archive wire + redirect               | 2h     | AC-7, AC-8                   | PROJ-002           | [project-landing.md §Admin actions](../../ui/project-landing.md) | 🟡 Planned   |
| [T8](#t8--e2e-smoke--progress-sync)            | Playwright E2E smoke + progress sync                          | 2h     | AC-1, AC-5, AC-7             | all                | —                                                                | 🟡 Planned   |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

**Parallel potential**:

- T4 (FE primitive scaffold) có thể start sau T1; không cần đợi T2/T3.
- T5 (HomePage) cần T2 (list API) xong.
- T6 (EditProjectDialog) cần T3 (PATCH endpoint) + T4 (DropdownMenu) xong.
- T7 (ProjectActionsMenu) cần T3 (archive endpoint) + T4 (DropdownMenu) + T6 (EditDialog component reuse) xong.

---

## T1 — Schema migration + shared schemas

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-PROJ-001](../../02-requirements.md#fr-proj-001--project-crud-minimal), [FR-PROJ-002](../../02-requirements.md#fr-proj-002--project-metadata-edit--archive)
- **AC covered (US-004)**: prereq cho AC-4 (archived exclusion) + AC-5/6 (edit schema).
- **Deps**: US-002 shipped (projects + features + sections schema đã có).
- **Parallel**: no — foundation cho T2/T3.

### Goal

- Add `projects.archived_at timestamptz nullable` column via Drizzle migration.
- Add shared Zod schemas: `updateProjectRequestSchema`, `ProjectSummary` type (list response shape).
- Update `ProjectResponse` type — optional `archivedAt` field (null cho non-archived).

### TDD cycle

**Red**:

```ts
// packages/shared/tests/schemas/project-update.test.ts
it("updateProjectRequestSchema accepts name + description only", () => {
  const res = updateProjectRequestSchema.safeParse({ name: "New", description: "desc" });
  expect(res.success).toBe(true);
});
it("updateProjectRequestSchema rejects slug field silently (not in schema)", () => {
  const res = updateProjectRequestSchema.safeParse({ name: "ok", slug: "changed" });
  // Zod strips unknown by default; slug won't appear in parsed output
  expect(res.success).toBe(true);
  expect("slug" in (res.data ?? {})).toBe(false);
});
it("rejects empty name", () => { ... });
```

**Green**:

- `packages/shared/src/schemas/project.ts` — `updateProjectRequestSchema` = `z.object({ name: ..., description: ... })` (no slug). Export type `UpdateProjectRequest`.
- `packages/shared/src/schemas/project.ts` — `ProjectSummary` interface `{ id, slug, name, description, featureCount, updatedAt, createdAt }` cho list response.
- `apps/api/src/db/schema.ts` — add `archivedAt: timestamp("archived_at", { withTimezone: true })` to `projects` table (nullable, no default).
- Run `pnpm db:generate` → produces new migration `.sql` file.
- Run `pnpm db:migrate` local → verify column added via `\d projects` trong psql.

**Refactor**: update existing `ProjectResponse` để optional include `archivedAt` (null cho non-archived). Không break existing tests vì optional.

### DoD

- [x] Shared schema tests passing (`pnpm --filter @onboarding/shared test`).
- [x] Drizzle migration SQL file committed vào `apps/api/src/db/migrations/`.
- [x] `pnpm db:migrate` clean apply trên fresh DB.
- [x] `pnpm lint` + `pnpm typecheck` green.

### Commit example

```
feat(shared): add updateProjectRequestSchema + archived_at migration (US-004 / T1)
```

---

## T2 — `GET /projects` list API (loại archived)

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-PROJ-001](../../02-requirements.md#fr-proj-001--project-crud-minimal)
- **AC covered (US-004)**: AC-1 (render catalog), AC-4 (archived exclusion).
- **Deps**: T1.
- **Parallel**: T4 (FE scaffold) có thể start song song.

### Goal

Endpoint `GET /api/v1/projects` trả `{ data: ProjectSummary[] }` sorted `updated_at` desc, loại `archived_at IS NOT NULL`. Include `featureCount` (COUNT features per project) via LEFT JOIN.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/projects-list.test.ts
it("returns all non-archived projects sorted updated_at desc", async () => {
  const agent = await loginAs("dev@local");
  const res = await agent.get("/api/v1/projects");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data[0]).toMatchObject({ id: expect.any(String), slug: expect.any(String), name: expect.any(String), featureCount: expect.any(Number) });
});
it("excludes archived projects", async () => { ... });
it("returns empty array when no projects", async () => { ... });
it("returns 401 for unauthenticated", async () => { ... });
```

**Green**:

- `apps/api/src/repos/projectRepo.ts` — add `listNonArchived()`:
  ```ts
  SELECT p.*, COUNT(f.id)::int AS feature_count
  FROM projects p LEFT JOIN features f ON f.project_id = p.id
  WHERE p.archived_at IS NULL
  GROUP BY p.id
  ORDER BY p.updated_at DESC
  ```
- `apps/api/src/routes/projects.ts` — thêm `router.get("/", requireAuth, listHandler)`:
  - Call `projectRepo.listNonArchived()`.
  - Map → ProjectSummary response.
  - Return `{ data: ProjectSummary[] }`.
- Update [.specs/api-surface.md](../../api-surface.md) `GET /projects` row từ "T7" placeholder → `T2 ✅ <hash>`.

**Refactor**: extract `mapProjectSummary(row)` helper.

### DoD

- [x] 4 test cases green.
- [x] api-surface.md updated.
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): GET /projects list non-archived with featureCount (US-004 / T2 / FR-PROJ-001)
```

---

## T3 — Project PATCH + archive APIs

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-PROJ-002](../../02-requirements.md#fr-proj-002--project-metadata-edit--archive)
- **AC covered (US-004)**: AC-5 (happy path edit), AC-6 (slug immutable), AC-7 (archive flow), AC-8 (non-admin 403), AC-9 (archived 404).
- **Deps**: T1, T2.
- **Parallel**: no.

### Goal

2 endpoints admin-only:

1. `PATCH /api/v1/projects/:slug` update name + description. Body slug bị strip (Zod schema không có). Bump `updated_at`.
2. `POST /api/v1/projects/:slug/archive` set `archived_at = NOW()`. Return 204.

Cả 2 return 404 nếu project không tồn tại hoặc đã archived (trừ archive của archived = idempotent 204 OK, không error — document).

`GET /projects/:slug` cũng phải return 404 khi archived (per AC-9) — update existing handler.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/projects-edit-archive.test.ts
describe("PATCH /projects/:slug", () => {
  it("returns 200 + updated project for admin", async () => { ... });
  it("ignores slug in body (slug immutable)", async () => { ... });
  it("bumps updated_at", async () => { ... });
  it("returns 403 for author", async () => { ... });
  it("returns 404 for archived project", async () => { ... });
  it("returns 400 VALIDATION_ERROR for empty name", async () => { ... });
});
describe("POST /projects/:slug/archive", () => {
  it("returns 204 + sets archived_at for admin", async () => { ... });
  it("excludes archived from GET /projects list (AC-4)", async () => { ... });
  it("GET /projects/:slug returns 404 after archive (AC-9)", async () => { ... });
  it("returns 403 for author", async () => { ... });
  it("returns 404 for non-existent slug", async () => { ... });
});
```

**Green**:

- `apps/api/src/repos/projectRepo.ts` — add `updateMetadata(slug, { name, description })` + `archive(slug)`:
  - `updateMetadata`: `UPDATE projects SET name, description, updated_at = NOW() WHERE slug = ? AND archived_at IS NULL RETURNING *`.
  - `archive`: `UPDATE projects SET archived_at = NOW() WHERE slug = ? AND archived_at IS NULL`.
- `apps/api/src/routes/projects.ts`:
  - `router.patch("/:slug", requireAuth, requireAdmin, zodValidate({ body: updateProjectRequestSchema }), patchHandler)`.
  - `router.post("/:slug/archive", requireAuth, requireAdmin, archiveHandler)`.
- Update `findBySlug()` repo method → add `WHERE archived_at IS NULL` filter (affects `GET /projects/:slug`).
- Update api-surface.md rows + error-codes.md nếu codes mới.

**Refactor**: consolidate project error mapping helper.

### DoD

- [x] 12 test cases green (6 PATCH + 6 archive, includes idempotency case).
- [x] GET /projects/:slug handler filter archived (no regressions in US-001 read tests).
- [x] api-surface.md updated (no new error codes — reused `PROJECT_NOT_FOUND` + `FORBIDDEN` + `VALIDATION_ERROR`).
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): PATCH + archive project endpoints (admin-only) (US-004 / T3 / FR-PROJ-002)
```

---

## T4 — DropdownMenu primitive FE scaffold

### Metadata

- **Effort**: 1h
- **FR covered**: — (infra)
- **AC covered (US-004)**: prereq cho AC-7, AC-8.
- **Deps**: T1 (không block nhưng logical order).
- **Parallel**: yes — có thể start song song với T2/T3.

### Goal

Install `@radix-ui/react-dropdown-menu` + create shadcn-style wrapper `apps/web/src/components/ui/dropdown-menu.tsx` export `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`.

### TDD cycle

**Red**: N/A — primitive wrapper không có logic; test sẽ ở caller level (T7 ProjectActionsMenu test verify menu opens/navigates).

**Green**:

- `pnpm --filter @onboarding/web add @radix-ui/react-dropdown-menu`.
- `apps/web/src/components/ui/dropdown-menu.tsx` — clone pattern từ shadcn/ui docs hoặc existing Dialog (US-002).
- Basic smoke test: `apps/web/tests/components/ui/dropdown-menu.test.tsx` verify Trigger → Content opens với role="menu".

**Refactor**: verify a11y attributes (role, aria-haspopup) đúng.

### DoD

- [ ] Smoke test 1-2 cases green.
- [ ] Primitive exports đủ 6 sub-components.
- [ ] Design-system §5.1 row cho DropdownMenu flip `(US-004)` → `(land T4 <hash>)`.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): add DropdownMenu primitive (US-004 / T4)
```

---

## T5 — HomePage catalog FE

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-PROJ-001](../../02-requirements.md#fr-proj-001--project-crud-minimal)
- **AC covered (US-004)**: AC-1 (render), AC-2 (navigate), AC-3 (empty state), AC-4 (archived exclude UI).
- **Deps**: T2 (list API ready).
- **Parallel**: no (UI sequence).

### Goal

Replace HomePage placeholder với catalog list per [home.md](../../ui/home.md) Gate 1. ProjectRow component, 3 states (loading/list/empty/error). Empty state admin variant có inline CreateProjectDialog trigger.

### TDD cycle

**Red**:

```tsx
// apps/web/tests/pages/HomePage.test.tsx
it("renders project rows sorted desc with name/description/count/relative", async () => { ... });
it("renders empty state with admin CTA 'Tạo project đầu tiên'", async () => { ... });
it("renders empty state without CTA for author role", async () => { ... });
it("click row navigates to /projects/:slug", async () => { ... });
it("admin CTA opens CreateProjectDialog", async () => { ... });
it("error state shows retry button", async () => { ... });
```

**Green**:

- `apps/web/src/queries/projects.ts` — `useProjects()` TanStack Query fetch `/projects`, key `["projects"]`.
- `apps/web/src/components/projects/ProjectRow.tsx` — `<a>` wrap semantic; name h2, description line-clamp-2, meta feature-count + RelativeTime + ChevronRight.
- `apps/web/src/pages/HomePage.tsx` — replace placeholder. useProjects → 4 states. Admin empty CTA mount `<CreateProjectDialog />` với controlled open state.
- Update AppHeader trigger nếu cần isolate state của 2 CreateProjectDialog instances.

**Refactor**: extract skeleton row component.

### DoD

- [ ] 6 test cases green (MSW mock list + empty + error).
- [ ] Admin CTA opens dialog verified.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): HomePage project catalog (US-004 / T5 / FR-PROJ-001)
```

---

## T6 — EditProjectDialog FE

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-PROJ-002](../../02-requirements.md#fr-proj-002--project-metadata-edit--archive)
- **AC covered (US-004)**: AC-5 (edit happy path), AC-6 (slug readonly).
- **Deps**: T3 (PATCH endpoint), T4 (DropdownMenu cho trigger mount trong T7).
- **Parallel**: T5 có thể song song vì khác screen.

### Goal

EditProjectDialog component per [edit-project-dialog.md](../../ui/edit-project-dialog.md) Gate 1. Parity pattern với CreateProjectDialog (RHF + Zod + Radix Dialog + sonner). Pre-fill từ `useProject()` cache, slug readonly, "Lưu" submit.

### TDD cycle

**Red**:

```tsx
// apps/web/tests/components/EditProjectDialog.test.tsx
it("pre-fills name + description from project", async () => { ... });
it("slug field readonly disabled", async () => { ... });
it("submit PATCH /projects/:slug → toast + close + invalidate query", async () => { ... });
it("409/400 branches → per-field error", async () => { ... });
it("cancel with dirty → native confirm", async () => { ... });
```

**Green**:

- `apps/web/src/queries/projects.ts` — `useUpdateProject(slug)` mutation; onSuccess invalidate `["project", slug]` + `["projects"]`.
- `apps/web/src/components/projects/EditProjectDialog.tsx` — RHF + zodResolver(updateProjectRequestSchema).
- Không mount yet vào ProjectLandingPage — sẽ wire ở T7 qua ProjectActionsMenu.

### DoD

- [ ] 5 test cases green.
- [ ] Dialog isolated reusable.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): EditProjectDialog + useUpdateProject (US-004 / T6 / FR-PROJ-002)
```

---

## T7 — ProjectActionsMenu FE + archive wire

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-PROJ-002](../../02-requirements.md#fr-proj-002--project-metadata-edit--archive)
- **AC covered (US-004)**: AC-7 (archive flow), AC-8 (non-admin invisible).
- **Deps**: T3 (archive endpoint), T4 (DropdownMenu), T6 (EditProjectDialog reuse).
- **Parallel**: no.

### Goal

ProjectActionsMenu component với overflow menu (`⋯` MoreHorizontal trigger) mount vào ProjectLandingPage header. 2 items: "Sửa project" (opens EditProjectDialog controlled) + "Lưu trữ" (confirm + archive). AuthorGate hide cho non-admin.

### TDD cycle

**Red**:

```tsx
// apps/web/tests/components/ProjectActionsMenu.test.tsx
it("admin sees ⋯ trigger on project landing", async () => { ... });
it("author does not see trigger", async () => { ... });
it("click ⋯ opens menu with 2 items", async () => { ... });
it("click 'Sửa' opens EditProjectDialog", async () => { ... });
it("click 'Lưu trữ' shows native confirm with project name + consequence", async () => { ... });
it("confirm archive → POST /archive → toast + navigate / + invalidate queries", async () => { ... });
```

**Green**:

- `apps/web/src/queries/projects.ts` — `useArchiveProject(slug)` mutation; onSuccess invalidate `["projects"]` + `["project", slug]` + navigate("/") via caller.
- `apps/web/src/components/projects/ProjectActionsMenu.tsx` — DropdownMenu với 2 items. Wire AdminGate.
- Mount vào `apps/web/src/pages/ProjectLandingPage.tsx` header cạnh `<CreateFeatureDialog />`.
- Archive flow: `if (window.confirm(\`Lưu trữ project "${name}"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.\`)) mutation.mutate()`.

### DoD

- [ ] 6 test cases green.
- [ ] Post-archive redirect verified (MemoryRouter location probe).
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): ProjectActionsMenu + archive wire (US-004 / T7 / FR-PROJ-002)
```

---

## T8 — E2E smoke + progress sync

### Metadata

- **Effort**: 2h
- **FR covered**: all US-004 scope
- **AC covered (US-004)**: AC-1, AC-5, AC-7 (cross-cutting smoke)
- **Deps**: T1-T7 all green
- **Parallel**: no (final task)

### Goal

1 Playwright E2E verify full happy path: login admin → landed `/` catalog → click seeded project → detail → `⋯` → "Sửa project" → rename → verify heading → `⋯` → "Lưu trữ" → confirm → redirect `/` → archived project không còn trong catalog.

Progress sync + CHANGELOG entry + DoD checkbox flips.

### TDD cycle

**Red**:

```ts
// e2e/us-004.spec.ts
test("US-004 happy path: catalog → detail → edit → archive → redirect", async ({ page }) => {
  // Login admin
  // 1. Landed on / with catalog
  // 2. Click a project → navigate /projects/:slug
  // 3. Click ⋯ → "Sửa project" → dialog pre-filled → rename → Lưu
  //    Verify heading reflects new name + toast
  // 4. Click ⋯ → "Lưu trữ" → window.confirm accept
  //    Verify redirect `/` + sonner + archived project gone from catalog
});
```

**Green**:

- Playwright spec hoàn chỉnh.
- Handle `page.on("dialog")` để auto-accept native confirm.
- Unique project slug per run (seed cleanup) hoặc dùng project tạo ad-hoc.

**Refactor**: extract `loginAsAdmin(page)` shared helper nếu US-001/US-002 chưa có.

### Progress sync (post-DoD)

Sau khi T8 merge, commit riêng `docs: sync progress markers after US-004 complete`:

- [README.md](../../../README.md) — status "US-004 done" + stats.
- [.specs/roadmap.md](../../roadmap.md) — M2 progress list thêm US-004 entries T1-T8; M2 overall status re-evaluate.
- [.specs/traceability.md](../../traceability.md) — FR-PROJ-001 + FR-PROJ-002 rows flip ✅; reverse index thêm US-004 task table.
- [.specs/ui/home.md](../../ui/home.md) Status `Ready` → `Implemented`.
- [.specs/ui/edit-project-dialog.md](../../ui/edit-project-dialog.md) Status `Ready` → `Implemented`.
- [.specs/ui/project-landing.md](../../ui/project-landing.md) Status flip — admin actions block → `Implemented`.
- [.specs/ui/design-system.md](../../ui/design-system.md) CHANGELOG row DropdownMenu + icons `(planned)` → ship hash.
- [.specs/releases/CHANGELOG.md](../../releases/CHANGELOG.md) cut `[US-004]` block (parity với `[US-002]` pattern).
- [.specs/stories/US-004.md](../US-004.md) Status `Ready` → `Done`.
- Flip DoD `[ ]` → `[x]` cho T1-T8.

### DoD

- [ ] E2E test green locally (`pnpm test:e2e`).
- [ ] Progress sync commit landed.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
test(web): US-004 E2E smoke — catalog → edit → archive (US-004 / T8)
```

---

## Risks / open items

- **Shared DB test state**: E2E runs gia tăng seed. Mitigation: unique project name per run + accept growth (seed < 100 projects OK cho MVP).
- **Archive vs search**: FTS endpoint không scope archived exclusion v1 trong US-001 T7. T3 hoặc T8 phải verify archived feature không xuất hiện trong search (per FR-PROJ-002 acceptance hint). Có thể phải update searchRepo — track as sub-task trong T3.
- **CreateProjectDialog state leak**: 2 instances (AppHeader + HomePage empty) cùng trigger. Both `useState(open, setOpen)` internal → isolated. Verify trong T5 test case.
- **Slug immutable enforcement**: Zod schema không có slug field → automatic strip. Nhưng BE handler vẫn nên defensive: nếu `req.body.slug` truyền qua → explicit ignore. Test case T3.
- **Archive idempotency**: archive project đã archived → behavior? Decision: treat as 204 success (idempotent) thay vì 404 để client retry safe. Document trong T3 commit body.
