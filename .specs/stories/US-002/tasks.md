# US-002 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level sections Conventions/Summary are additional_sections_allowed) -->

_Story_: [US-002 — BA tạo project + feature với business sections](../US-002.md)
_Total estimate_: ~18h (solo, TDD pace)
_Last updated_: 2026-04-23 (tasks drafted, awaiting user approval)

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-002 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **Definition of Done (DoD)** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific test file).
  2. `pnpm lint` + `pnpm typecheck` ở root không lỗi.
  3. AC liên quan trong US-002 đã có automated test coverage.
  4. Task commit landed trên `main`.
- **Order**: tasks tuần tự; không được bắt đầu T<N+1> khi T<N> chưa DoD (trừ ghi chú song song).
- **UI spec prerequisite**: T4, T6, T7 chạm FE screen → UI spec phải `Ready` trước khi start (đã có sau phase Gate 1).

---

## Task Summary

| #                                                       | Title                                                | Effort | AC covered       | FR touched         | UI spec                                                             | Status     |
| ------------------------------------------------------- | ---------------------------------------------------- | ------ | ---------------- | ------------------ | ------------------------------------------------------------------- | ---------- |
| [T1](#t1--db-role-column--shared-schemas)               | DB role column check + shared schemas                | 2h     | AC-1 (role gate) | AUTH-001, FEAT-001 | —                                                                   | 🟡 Planned |
| [T2](#t2--project-create-api--admin-gate)               | `POST /projects` API + admin gate + 409 slug         | 3h     | AC-1, AC-2, AC-3 | PROJ-001           | —                                                                   | 🟡 Planned |
| [T3](#t3--feature-create-api--5-section-init)           | `POST /projects/:slug/features` API + section init   | 3h     | AC-4             | FEAT-001, FEAT-002 | —                                                                   | 🟡 Planned |
| [T4](#t4--create-project-dialog-fe)                     | CreateProjectDialog FE (Radix + RHF + Zod)           | 3h     | AC-1, AC-2, AC-3 | PROJ-001           | [create-project-dialog.md](../../ui/create-project-dialog.md)       | 🟡 Planned |
| [T5](#t5--section-put-api--413-validation)              | `PUT /features/:id/sections/:type` API + 413         | 2h     | AC-5, AC-6, AC-7 | FEAT-003           | —                                                                   | 🟡 Planned |
| [T6](#t6--create-feature-dialog-fe)                     | CreateFeatureDialog FE + project-landing trigger     | 2h     | AC-4             | FEAT-001           | [create-feature-dialog.md](../../ui/create-feature-dialog.md)       | 🟡 Planned |
| [T7](#t7--section-editor-fe--edit-in-place-integration) | SectionEditor FE + feature-detail edit-in-place wire | 3h     | AC-5, AC-6, AC-7 | FEAT-003           | [feature-detail.md §Edit-in-place mode](../../ui/feature-detail.md) | 🟡 Planned |
| [T8](#t8--e2e-smoke--progress-sync-release-tag)         | Playwright E2E + progress sync + M2 release tag      | 2h     | AC-2, AC-4, AC-5 | all                | —                                                                   | 🟡 Planned |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

**Parallel potential**:

- T4 (FE dialog tạo project) có thể start sau T2 (API 201/409 đã xanh); không cần đợi T3.
- T5 (BE section PUT) có thể chạy song song với T4 (FE dialog) — chạm khác nhau của stack.
- T6 (FE feature dialog) cần T3 xong (API feature create).
- T7 (FE section editor) cần T5 xong (API section PUT).

---

## T1 — DB role column + shared schemas

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-AUTH-001](../../02-requirements.md#fr-auth-001--emailpassword-auth), [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered (US-002)**: AC-1 (admin gate prereq)
- **Deps**: — (US-001 land là prereq)
- **Parallel**: no — foundation cho T2/T3

### Goal

- Verify `users.role` column tồn tại với enum `admin|author` (từ US-001 T5). Nếu thiếu → migration bổ sung.
- Add shared Zod schemas + TS types cho `CreateProjectRequest`, `CreateFeatureRequest`, `UpdateSectionRequest` trong `packages/shared/src/schemas/`.

### TDD cycle

**Red**:

```ts
// packages/shared/tests/schemas/project.test.ts
it("createProjectRequestSchema rejects invalid slug", () => {
  const res = createProjectRequestSchema.safeParse({ slug: "Invalid Slug!", name: "X" });
  expect(res.success).toBe(false);
});
it("createFeatureRequestSchema rejects empty title", () => {
  const res = createFeatureRequestSchema.safeParse({ slug: "ok", title: "" });
  expect(res.success).toBe(false);
});
```

**Green**:

- `packages/shared/src/schemas/project.ts` — `createProjectRequestSchema` (slug regex, name 1-120, description 0-1000).
- `packages/shared/src/schemas/feature.ts` — `createFeatureRequestSchema` (slug regex, title 1-160).
- `packages/shared/src/schemas/section.ts` — `updateSectionRequestSchema` (`body: string`, server byte check ở T5).
- DB check script: `apps/api/scripts/check-role-column.mjs` → query `information_schema.columns` → nếu thiếu, echo migration cần thêm. Nếu đã có → no-op.

**Refactor**: Export barrel `packages/shared/src/schemas/index.ts`.

### DoD

- [ ] Shared schema tests passing.
- [ ] `users.role` confirmed `admin|author` enum.
- [ ] Schemas exported, FE/BE import path hoạt động.
- [ ] `pnpm lint` + `pnpm typecheck` green.

### Commit example

```
feat(shared): add US-002 request schemas for project/feature/section (US-002 / T1)
```

---

## T2 — Project create API + admin gate

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-PROJ-001](../../02-requirements.md#fr-proj-001--project-crud-minimal)
- **AC covered (US-002)**: AC-1, AC-2, AC-3
- **Deps**: T1
- **Parallel**: no

### Goal

Endpoint `POST /api/v1/projects` admin-only tạo project; 201 success + 403 non-admin + 409 slug duplicate + 400 validation.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/projects-create.test.ts
it("POST /projects returns 201 for admin", async () => { ... });
it("POST /projects returns 403 for author", async () => { ... });
it("POST /projects returns 409 when slug exists", async () => { ... });
it("POST /projects returns 400 for invalid slug", async () => { ... });
```

**Green**:

- `apps/api/src/middleware/requireAdmin.ts` — check `req.session.user.role === "admin"`, else 403 `FORBIDDEN`.
- `apps/api/src/routes/projects.ts` — thêm `router.post("/", requireAuth, requireAdmin, zodValidate(createProjectRequestSchema), handler)`:
  - INSERT into `projects(id, slug, name, description, created_by)` với `created_by = session.user.id`.
  - Catch Drizzle UNIQUE violation → 409 `PROJECT_SLUG_TAKEN`.
  - Success → 201 `{ data: ProjectResponse }`.
- Update [.specs/api-surface.md](../../api-surface.md) + [.specs/error-codes.md](../../error-codes.md) (new code `PROJECT_SLUG_TAKEN` if missing).

**Refactor**: Extract `mapProjectToResponse(row)` helper.

### DoD

- [ ] 4 test cases green.
- [ ] api-surface.md + error-codes.md updated.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): POST /projects with admin gate + 409 slug taken (US-002 / T2 / FR-PROJ-001)
```

---

## T3 — Feature create API + 5-section init

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project), [FR-FEAT-002](../../02-requirements.md#fr-feat-002--5-section-template)
- **AC covered (US-002)**: AC-4
- **Deps**: T2
- **Parallel**: T5 (BE section PUT) có thể start sau T3

### Goal

Endpoint `POST /api/v1/projects/:projectSlug/features` tạo feature + 5 section rows empty trong 1 transaction atomic. Admin/author only.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/features-create.test.ts
it("POST creates feature + exactly 5 empty sections atomically", async () => {
  const res = await request(app).post("/api/v1/projects/pilot/features").send({ slug: "login", title: "Login" });
  expect(res.status).toBe(201);
  const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.featureId, res.body.data.id));
  expect(sections).toHaveLength(5);
  expect(sections.every((s) => s.body === "")).toBe(true);
});
it("returns 409 when feature slug exists in project", async () => { ... });
it("returns 403 for viewer role", async () => { ... });
it("returns 404 when project slug not found", async () => { ... });
```

**Green**:

- `apps/api/src/middleware/requireAuthor.ts` — admin|author pass, else 403.
- `apps/api/src/routes/features.ts` — POST handler với `db.transaction`:
  - Lookup project by slug → 404 nếu miss.
  - INSERT feature → catch UNIQUE → 409 `FEATURE_SLUG_TAKEN`.
  - INSERT 5 sections loop qua `SECTION_ORDER` (`business`, `user-flow`, `business-rules`, `tech-notes`, `screenshots`), all `body = ""`.
  - Return 201 `{ data: FeatureResponse }` (không inline sections để response ngắn; FE refetch).

**Refactor**: Move `SECTION_ORDER` constant về `packages/shared/src/constants/sections.ts` nếu chưa.

### DoD

- [ ] 4 test cases green, atomic transaction verified.
- [ ] api-surface.md + error-codes.md updated.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): POST /projects/:slug/features with 5-section atomic init (US-002 / T3 / FR-FEAT-001)
```

---

## T4 — CreateProjectDialog FE

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-PROJ-001](../../02-requirements.md#fr-proj-001--project-crud-minimal)
- **AC covered (US-002)**: AC-1 (admin gate UI), AC-2 (happy path), AC-3 (409 inline)
- **Deps**: T2 (API 201/409 ready)
- **Parallel**: T5 (BE section PUT) — yes

### Goal

Admin-gated "Tạo project" trigger trong AppHeader mở Radix Dialog với form RHF+Zod. Submit → navigate `/projects/:slug`. 409/403/5xx branches theo [UI spec](../../ui/create-project-dialog.md).

### TDD cycle

**Red**:

```tsx
// apps/web/src/components/projects/CreateProjectDialog.test.tsx
it("admin sees Tạo project button in header", () => { ... });
it("author does not see Tạo project button", () => { ... });
it("auto-derives slug from name (strip diacritics)", async () => { ... });
it("navigates to /projects/:slug on 201", async () => { ... });
it("shows inline error on 409", async () => { ... });
```

**Green**:

- `apps/web/src/lib/slug.ts` — `toKebabCase(input)` + `stripDiacritics(input)` helper.
- `apps/web/src/components/common/AdminGate.tsx` — render children if `user.role === "admin"`.
- `apps/web/src/components/ui/dialog.tsx` — shadcn Dialog wrapper around Radix.
- `apps/web/src/queries/projects.ts` — add `useCreateProject()` mutation hook (existing file from US-001 queries).
- `apps/web/src/components/projects/CreateProjectDialog.tsx` — full component per UI spec.
- Mount trigger trong `AppHeader` wrapped bởi `AdminGate`.
- Mount `<Toaster />` (sonner) vào `AppShell` root (one-time cho all toasts).

**Refactor**: Extract form schema from shared; ensure `slugTouched` state handled.

### DoD

- [ ] 5 test cases green (MSW mock 201/409/403).
- [ ] Admin gate hides button for non-admin.
- [ ] Navigate behavior verified via `MemoryRouter`.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): CreateProjectDialog with Radix + RHF + Zod (US-002 / T4 / FR-PROJ-001)
```

---

## T5 — Section PUT API + 413 validation

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-FEAT-003](../../02-requirements.md#fr-feat-003--per-section-multi-author)
- **AC covered (US-002)**: AC-5, AC-6 (independent save), AC-7 (413)
- **Deps**: T3
- **Parallel**: T4 — yes

### Goal

Endpoint `PUT /api/v1/features/:featureId/sections/:type` update body + metadata; 413 khi > 64 KiB. Chỉ touch 1 section (không side-effect lên sibling).

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/section-update.test.ts
it("PUT updates only target section, sibling unchanged", async () => { ... });
it("refreshes feature.updated_at", async () => { ... });
it("returns 413 when body > 64 KiB", async () => { ... });
it("sets updated_by = session.user.id", async () => { ... });
it("returns 403 for viewer role", async () => { ... });
```

**Green**:

- `apps/api/src/routes/sections.ts` — handler:
  - Check `Buffer.byteLength(body, "utf8") <= 65536` → 413 `SECTION_TOO_LARGE` (middleware chạy trước Zod parse vì Zod count char không count bytes).
  - UPDATE `sections SET body, updated_by, updated_at = now() WHERE feature_id = ? AND section_type = ?`.
  - UPDATE `features SET updated_at = now() WHERE id = ?` (trigger AC-6 cascade).
  - Return 200 `{ data: SectionResponse }`.
- Mount route: `router.put("/features/:featureId/sections/:type", requireAuth, requireAuthor, bytecheck, zodValidate(updateSectionRequestSchema), handler)`.

**Refactor**: Share `SECTION_ORDER` guard — reject unknown `type` với 400.

### DoD

- [ ] 5 test cases green.
- [ ] api-surface.md + error-codes.md updated (`SECTION_TOO_LARGE` nếu new).
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): PUT /features/:id/sections/:type with 64 KiB byte limit (US-002 / T5 / FR-FEAT-003)
```

---

## T6 — CreateFeatureDialog FE

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered (US-002)**: AC-4
- **Deps**: T3, T4 (Dialog primitive + slug util + AuthorGate)
- **Parallel**: T5 — yes (nếu T5 chưa xong cũng không block T6)

### Goal

Author-gated "Thêm feature" trigger trên `ProjectLandingPage` header mở dialog + submit → navigate feature detail. Pattern parity với T4.

### TDD cycle

**Red**:

```tsx
// apps/web/src/components/features/CreateFeatureDialog.test.tsx
it("admin+author see Thêm feature button", () => { ... });
it("viewer does not see button", () => { ... });
it("auto-derives slug from title", async () => { ... });
it("navigates to feature detail on 201", async () => { ... });
it("shows inline error on 409 FEATURE_SLUG_TAKEN", async () => { ... });
```

**Green**:

- `apps/web/src/components/common/AuthorGate.tsx` — admin|author.
- `apps/web/src/queries/features.ts` (existing) — add `useCreateFeature(projectSlug)` mutation.
- `apps/web/src/components/features/CreateFeatureDialog.tsx` — per UI spec.
- Mount trigger trong `ProjectLandingPage` header (AuthorGate).

### DoD

- [ ] 5 test cases green (MSW mock).
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): CreateFeatureDialog with author gate (US-002 / T6 / FR-FEAT-001)
```

---

## T7 — SectionEditor FE + edit-in-place integration

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-FEAT-003](../../02-requirements.md#fr-feat-003--per-section-multi-author)
- **AC covered (US-002)**: AC-5, AC-6, AC-7
- **Deps**: T5, T6 (AuthorGate reuse)
- **Parallel**: no

### Goal

Pencil button per-section trên feature-detail page mở inline `SectionEditor` (2-col desktop, stacked mobile). Save → PUT → refresh meta → collapse. Cancel → confirm nếu dirty.

### TDD cycle

**Red**:

```tsx
// apps/web/src/components/features/SectionEditor.test.tsx
it("author sees pencil button on editable sections only", () => { ... });
it("toggle edit → textarea + preview visible", async () => { ... });
it("preview updates after 200ms debounce", async () => { ... });
it("save → PUT call → toast + collapse to read", async () => { ... });
it("413 shows destructive toast, keeps draft", async () => { ... });
it("cancel with dirty draft prompts confirm", async () => { ... });
it("saving section A does not collapse section B being edited", async () => { ... });
```

**Green**:

- `apps/web/src/components/features/SectionEditor.tsx` — textarea + preview (`MarkdownView`) + footer.
- `apps/web/src/components/features/SectionCard.tsx` (new hoặc extend) — wrapper với `mode: "read"|"editing"` state + Pencil button.
- `apps/web/src/queries/sections.ts` — `useUpdateSection(featureId)` mutation + invalidate `["feature", slug, featureSlug]`.
- Extend `FeatureSections.tsx` render `SectionCard` với `editable = ["business","user-flow","business-rules"].includes(type)`.
- Byte counter: `new Blob([text]).size` client-side display; hard limit ~70000 chars via textarea maxLength.

**Refactor**: Extract debounce via `useDeferredValue` hoặc `useDebounce` từ `use-debounce` nếu cần pkg mới (ADR check — debounce có thể inline thủ công).

### DoD

- [ ] 7 test cases green.
- [ ] Per-section independent state verified (2 sections edit đồng thời).
- [ ] Sonner toast mounted.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): SectionEditor + per-section edit-in-place (US-002 / T7 / FR-FEAT-003)
```

---

## T8 — E2E smoke + progress sync + M2 release tag

### Metadata

- **Effort**: 2h
- **FR covered**: all US-002 scope
- **AC covered (US-002)**: AC-2, AC-4, AC-5 (cross-cutting smoke)
- **Deps**: T1-T7 all green
- **Parallel**: no (final task)

### Goal

1 Playwright E2E verify full happy path: login admin → tạo project → tạo feature → edit business → reload → content persist. Progress sync + M2 CHANGELOG entry.

### TDD cycle

**Red**:

```ts
// e2e/us-002.spec.ts
test("admin creates project + feature + edits section", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", "admin@local");
  await page.fill("[name=password]", "admin123");
  await page.click("button[type=submit]");
  await page.click('text="Tạo project"');
  await page.fill('input[name="name"]', "E2E Project");
  await page.click('text="Tạo project"');
  await expect(page).toHaveURL(/\/projects\/e2e-project/);
  // + feature create
  // + section edit
  // + reload assert persist
});
```

**Green**:

- Playwright spec hoàn chỉnh.
- Seed reset helper (optional): drop E2E-created rows trước test nếu CI flaky.

**Refactor**: Extract helpers `loginAsAdmin(page)` nếu T10 E2E (US-001) chưa có.

### Progress sync (post-DoD)

Sau khi T8 merge, commit riêng `docs: sync progress markers after US-002 complete`:

- [README.md](../../../README.md) — status "M1 complete / M2 in progress" → "M2 complete".
- [.specs/roadmap.md](../../roadmap.md) — M2 row ✅ + date.
- [.specs/traceability.md](../../traceability.md) — T1-T8 flip 🟡 → ✅ + commit hashes.
- [.specs/ui/create-project-dialog.md](../../ui/create-project-dialog.md) — Status `Ready` → `Implemented`.
- [.specs/ui/create-feature-dialog.md](../../ui/create-feature-dialog.md) — Status `Ready` → `Implemented`.
- [.specs/ui/feature-detail.md](../../ui/feature-detail.md) — Status edit block `Ready` → `Implemented`.
- [.specs/releases/CHANGELOG.md](../../releases/CHANGELOG.md) — [M2] block với Added rows.
- [.specs/stories/US-002.md](../US-002.md) — Status `Draft` → `Done`.

### DoD

- [ ] E2E test green locally (`pnpm test:e2e`).
- [ ] Progress sync commit landed.
- [ ] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
test(web): US-002 E2E smoke — create project + feature + edit section (US-002 / T8)
```

---

## Risks / open items

- **Concurrency**: 2 user cùng save 1 section → last-write-wins (FR-FEAT-003 documented). Không warning UI v1.
- **Markdown preview perf**: 64 KiB realtime render có thể lag; debounce 200ms là safety net. Nếu vẫn lag → tăng 400ms.
- **Role column migration**: nếu US-001 T5 chưa có `role`, T1 cần thêm migration bổ sung — flag trước khi start T2.
- **sonner mounting**: `<Toaster />` chưa mount ở US-001. T4 là task đầu tiên cần toast → mount tại T4 là hợp lý, hoặc tách commit riêng trước T4.
