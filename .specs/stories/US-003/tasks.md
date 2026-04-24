# US-003 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level sections Conventions/Summary are additional_sections_allowed) -->

_Story_: [US-003 — Dev bổ sung tech-notes + screenshots](../US-003.md)
_Total estimate_: ~12-14h (solo, TDD pace)
_Last updated_: 2026-04-24 (T1-T7 ✅ — 7/7 shipped, US-003 Done)

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-003 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **Definition of Done (DoD)** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific test file).
  2. `pnpm lint` + `pnpm typecheck` ở root không lỗi.
  3. AC liên quan trong US-003 đã có automated test coverage.
  4. Task commit landed trên `main`.
- **Order**: tasks tuần tự; T3 ∥ T4 có thể song song sau T2 (khác scope). Không start T\<N+1\> khi T\<N\> chưa DoD (trừ ghi chú parallel).
- **UI spec prerequisite**: T5, T6 chạm FE screen → UI spec phải `Ready` (✅ `feature-detail.md` extended `05105cb`; `design-system.md` registered `54d5b88`).
- **Progress-sync rule**: mỗi commit `docs: sync progress markers after T<N> land` **phải flip DoD checkboxes `[ ]` → `[x]`** trong khối task vừa ship — per [CLAUDE.md §Post-task progress sync](../../../CLAUDE.md).

---

## Task Summary

| #                                            | Title                                                                    | Effort | AC covered       | FR touched           | UI spec                                                 | Status       |
| -------------------------------------------- | ------------------------------------------------------------------------ | ------ | ---------------- | -------------------- | ------------------------------------------------------- | ------------ |
| [T1](#t1--uploads-migration--shared-schemas) | Uploads table migration + shared schemas + `file-type` dep               | 1h     | prereq           | UPLOAD-001           | —                                                       | ✅ `b285b99` |
| [T2](#t2--post-uploads-endpoint)             | `POST /features/:id/uploads` endpoint (multer + magic bytes + DB)        | 3h     | AC-4, AC-5, AC-6 | UPLOAD-001           | —                                                       | ✅ `b082416` |
| [T3](#t3--get-uploads-id-static-serve)       | `GET /uploads/:id` session-protected static file serve                   | 1h     | AC-4 read, AC-9  | UPLOAD-001, AUTH-001 | —                                                       | ✅ `4690b8e` |
| [T4](#t4--embed-parser--embedcard-component) | Embed parser util + `EmbedCard` + MarkdownView integration               | 2h     | AC-2, AC-3, AC-8 | EMBED-001            | [feature-detail §Embed](../../ui/feature-detail.md)     | ✅ `a262cf3` |
| [T5](#t5--sectioneditor-upload-toolbar)      | SectionEditor upload toolbar + `useUpload` mutation + cursor insert      | 2h     | AC-4, AC-5, AC-6 | UPLOAD-001, FEAT-003 | [feature-detail §Upload](../../ui/feature-detail.md)    | ✅ `f75f75a` |
| [T6](#t6--section-editable-gate--ownership)  | Enable tech-notes/screenshots edit + per-section "Cập nhật bởi" metadata | 2h     | AC-1, AC-7       | FEAT-002, FEAT-003   | [feature-detail §Ownership](../../ui/feature-detail.md) | ✅ `dd1c213` |
| [T7](#t7--e2e-smoke--progress-sync)          | Playwright E2E + story-level progress sync + CHANGELOG cut `[US-003]`    | 2h     | cross-cutting    | all                  | —                                                       | ✅ `c6c57fc` |

**Critical path**: T1 → T2 → (T3 ∥ T4) → T5 → T6 → T7.

**Parallel potential**:

- T3 (static serve) + T4 (embed FE) có thể song song sau T2 — khác scope BE/FE.
- T5 (upload FE) cần T2 (endpoint) xong.
- T6 (enable 2 sections + ownership UI) cần T5 (upload toolbar component) + API response extend.

---

## T1 — Uploads migration + shared schemas

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-UPLOAD-001](../../02-requirements.md#fr-upload-001--image-upload-for-screenshots)
- **AC covered (US-003)**: prereq cho AC-4, AC-5, AC-6, AC-9.
- **Deps**: US-002 shipped (sections + features + users đã có).
- **Parallel**: no — foundation cho T2/T3.

### Goal

- Add `uploads` table via Drizzle migration: `id uuid PK, feature_id uuid FK→features(id) ON DELETE CASCADE, uploaded_by uuid FK→users(id) ON DELETE SET NULL, mime_type text NOT NULL, size_bytes int NOT NULL, filename text NOT NULL, created_at timestamptz NOT NULL default now()`.
- Install `file-type` (~50 KiB) cho magic-byte MIME detection.
- Add shared Zod schemas: `uploadResponseSchema` (return shape `{ id, url, sizeBytes, mimeType, createdAt }`). No request schema (multipart handled by multer middleware, not Zod).
- Verify `UNSUPPORTED_MEDIA_TYPE` registered trong [error-codes.md](../../error-codes.md); add nếu thiếu.

### TDD cycle

**Red**:

```ts
// packages/shared/tests/schemas/upload.test.ts
it("uploadResponseSchema parses valid server response", () => {
  const res = uploadResponseSchema.safeParse({
    id: "uuid",
    url: "/uploads/uuid",
    sizeBytes: 1024,
    mimeType: "image/png",
    createdAt: new Date().toISOString(),
  });
  expect(res.success).toBe(true);
});
```

**Green**:

- `packages/shared/src/schemas/upload.ts` — export `uploadResponseSchema` + `UploadResponse` type.
- `packages/shared/src/index.ts` — re-export.
- `apps/api/src/db/schema.ts` — add `uploads` pgTable.
- `pnpm db:generate` → produce migration file.
- `pnpm --filter @onboarding/api add file-type` (BE dep).
- Verify error-codes.md row `UNSUPPORTED_MEDIA_TYPE` (415) — add nếu thiếu.

**Refactor**: none.

### DoD

- [x] Shared schema test green.
- [x] Migration SQL file committed; `pnpm db:migrate` clean apply fresh DB.
- [x] `file-type` trong `apps/api/package.json`.
- [x] `pnpm lint` + `pnpm typecheck` + `pnpm smoke` green.

### Commit example

```
feat(shared): uploads table migration + UploadResponse schema + file-type dep (US-003 / T1)
```

---

## T2 — `POST /uploads` endpoint

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-UPLOAD-001](../../02-requirements.md#fr-upload-001--image-upload-for-screenshots)
- **AC covered (US-003)**: AC-4 (happy path), AC-5 (413), AC-6 (415), AC-9 (401).
- **Deps**: T1.
- **Parallel**: T3 + T4 sau khi T2 xong.

### Goal

Endpoint `POST /api/v1/features/:id/uploads` multipart/form-data. Validation:

1. 401 nếu no session.
2. 404 nếu feature không tồn tại.
3. 413 nếu file > 5 MiB (multer limit).
4. 415 nếu magic-byte sniff không match png/jpg/webp (ngay cả khi Content-Type đúng).
5. 201: write file `$UPLOAD_DIR/<uploadId>.<ext>`, insert DB row, return `{ data: UploadResponse }` với `url: "/uploads/<id>"`.

Filename sanitized (UUID-based, chống path traversal per story §Risks).

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/uploads-create.test.ts
describe("POST /features/:id/uploads", () => {
  it("returns 201 with valid png file for author", async () => { ... });
  it("returns 413 FILE_TOO_LARGE for 6 MiB file", async () => { ... });
  it("returns 415 UNSUPPORTED_MEDIA_TYPE cho pdf disguised as png", async () => {
    // Rename pdf → evil.png, upload → server magic-byte detect real MIME
    expect(res.status).toBe(415);
  });
  it("returns 415 cho gif (not in whitelist)", async () => { ... });
  it("returns 404 cho feature không tồn tại", async () => { ... });
  it("returns 401 cho no session", async () => { ... });
  it("stores file trong UPLOAD_DIR với UUID filename (no path traversal)", async () => { ... });
  it("inserts DB row với uploadedBy = session user id", async () => { ... });
});
```

**Green**:

- `apps/api/src/repos/uploadRepo.ts` — `insert(input)` + `findById(id)`.
- `apps/api/src/routes/uploads.ts` — router, mount multer middleware (memory storage, 5 MiB limit), magic-byte validate via `fileTypeFromBuffer`, write to disk, insert row, return response.
- `apps/api/src/app.ts` — wire uploadsRouter.
- Update [.specs/api-surface.md](../../api-surface.md:67) row `POST /features/:id/uploads` Task column T2 hash.

**Refactor**: extract `UPLOAD_DIR` env reader; extract MIME whitelist constant (share với T3).

### DoD

- [x] 7 test cases green (happy path + 413 + 415 PDF-spoof + 415 GIF + 404 + 401 + path-traversal).
- [x] api-surface.md updated.
- [x] `UPLOAD_DIR` có default `./data/uploads`, gitignored path.
- [ ] Docker compose volume mount cho persistence (deferred tới M3 infra hardening — dev chạy native).
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): POST /features/:id/uploads multipart + magic bytes (US-003 / T2 / FR-UPLOAD-001)
```

---

## T3 — `GET /uploads/:id` static serve

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-UPLOAD-001](../../02-requirements.md#fr-upload-001--image-upload-for-screenshots), [FR-AUTH-001](../../02-requirements.md#fr-auth-001--emailpassword-auth) (session gate)
- **AC covered (US-003)**: AC-4 (read path — `<img>` renders), AC-9 (no session → 401).
- **Deps**: T2 (same router).
- **Parallel**: yes với T4.

### Goal

Session-protected file serve. `GET /api/v1/uploads/:id` → lookup row → stream file từ `UPLOAD_DIR/<id>.<ext>` với đúng `Content-Type` (từ DB `mime_type`). 404 nếu row không exist or file missing.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/uploads-get.test.ts
it("returns 200 + binary for authenticated user", async () => { ... });
it("returns Content-Type matching DB mime_type", async () => { ... });
it("returns 404 cho unknown id", async () => { ... });
it("returns 401 cho no session", async () => { ... });
```

**Green**:

- `apps/api/src/routes/uploads.ts` — thêm `router.get("/:id", requireAuth, getHandler)`. Use `res.sendFile(path)` với absolute resolved path (chống relative traversal).
- Mount `/api/v1/uploads` separate from `/api/v1/features/:id/uploads` (different base path).
- Update api-surface.md row `GET /uploads/:id` Task column T3 hash.

**Refactor**: share path resolver helper với T2.

### DoD

- [x] 3 test cases green (happy 200 + binary, 404 unknown, 401 no-session).
- [x] api-surface.md updated.
- [ ] `<img src="/api/v1/uploads/:id">` works trong FE với cookie — verify in T5 integration.
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(api): GET /uploads/:id session-protected static serve (US-003 / T3 / FR-UPLOAD-001)
```

---

## T4 — Embed parser + EmbedCard component

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-EMBED-001](../../02-requirements.md#fr-embed-001--external-link-embed)
- **AC covered (US-003)**: AC-2 (GitHub card), AC-3 (non-whitelist plain anchor), AC-8 (read view render).
- **Deps**: none (pure FE, có thể song song T3).
- **Parallel**: yes với T3.

### Goal

- Parser util `embedFromUrl(href: string): EmbedDescriptor | null` — returns `{ hostname, domain, icon: "github"|"figma"|"jira" }` cho whitelisted URLs, else null.
- `EmbedCard` component render card layout (bordered, icon 24px + URL path + domain subtitle).
- Brand icons: custom SVG components `GithubIcon`, `FigmaIcon`, `JiraIcon` (~20 LOC each) in `apps/web/src/components/features/brand-icons.tsx`.
- Extend `MarkdownView` (hoặc post-process step) to scan rendered HTML `<a>` → swap with EmbedCard nếu URL match. Security: `URL()` parse strict (no substring).

### TDD cycle

**Red**:

```ts
// apps/web/tests/lib/embed.test.ts
describe("embedFromUrl", () => {
  it("matches github.com", () => expect(embedFromUrl("https://github.com/x")).toMatchObject({ icon: "github" }));
  it("matches subdomain atlassian.net", () => expect(embedFromUrl("https://foo.atlassian.net/browse/X")).toMatchObject({ icon: "jira" }));
  it("matches figma.com", () => ...);
  it("rejects evil.com/github.com spoof", () => expect(embedFromUrl("https://evil.com/github.com")).toBeNull());
  it("rejects invalid URL", () => expect(embedFromUrl("not a url")).toBeNull());
  it("rejects non-whitelist example.com", () => expect(embedFromUrl("https://example.com")).toBeNull());
});
```

```tsx
// apps/web/tests/components/EmbedCard.test.tsx
it("renders card với icon + URL + domain", () => { ... });
it("wraps in <a target='_blank' rel='noopener noreferrer'>", () => { ... });
it("truncates long URL path visually", () => { ... });
```

```tsx
// apps/web/tests/lib/markdown.test.ts (extend existing)
it("replaces whitelist <a> với EmbedCard in rendered output", () => { ... });
it("keeps non-whitelist <a> as plain anchor", () => { ... });
```

**Green**:

- `apps/web/src/lib/embed.ts` — parser.
- `apps/web/src/components/features/brand-icons.tsx` — 3 SVG components.
- `apps/web/src/components/features/EmbedCard.tsx` — card component.
- Extend `apps/web/src/lib/markdown.ts` hoặc `MarkdownView.tsx` — post-process step dùng React portals / DOM traversal để swap `<a>` → EmbedCard inline.

**Refactor**: centralize whitelist constant in `embed.ts`.

### DoD

- [x] Parser 7 test cases green (github / atlassian subdomain / figma+query / spoof / invalid / non-whitelist / ftp).
- [x] Embed card render inlined in markdown.ts post-process step (pure HTML — no React component needed, brand SVG inlined).
- [x] MarkdownView integration 5 test cases green (autolink swap, custom label pass-through, target/rel).
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): embed parser + EmbedCard inline render (US-003 / T4 / FR-EMBED-001)
```

---

## T5 — SectionEditor upload toolbar

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-UPLOAD-001](../../02-requirements.md#fr-upload-001--image-upload-for-screenshots), [FR-FEAT-003](../../02-requirements.md#fr-feat-003--per-section-multi-author)
- **AC covered (US-003)**: AC-4 (happy upload), AC-5 (413 toast), AC-6 (415 toast).
- **Deps**: T2 (endpoint ready), T4 (EmbedCard optional — same sprint, sequence flexible).
- **Parallel**: no.

### Goal

- `useUpload(featureId)` TanStack Query mutation — POST multipart, returns UploadResponse.
- `UploadButton` component — `<input type="file" hidden>` + Button wrapper. Click button → `inputRef.current.click()`. onChange → mutate. Spinner during pending. Toasts 413/415/5xx.
- Extend SectionEditor: accept `featureId` + `sectionType` props. Conditional render UploadButton nếu `sectionType === "tech-notes" || sectionType === "screenshots"`.
- Cursor-preserve logic: snapshot `textareaRef.current.selectionStart` trước click, splice `![filename](/uploads/:id)` vào `body` tại vị trí đó sau 201.

### TDD cycle

**Red**:

```tsx
// apps/web/tests/components/UploadButton.test.tsx
it("opens file picker on click", async () => { ... });
it("POSTs multipart on file chosen, calls onUploaded(markdown)", async () => { ... });
it("413 → destructive toast 'File quá lớn'", async () => { ... });
it("415 → destructive toast 'Chỉ chấp nhận png, jpg, webp'", async () => { ... });

// apps/web/tests/components/SectionEditor.test.tsx (extend existing)
it("renders UploadButton cho tech-notes sectionType", () => { ... });
it("renders UploadButton cho screenshots sectionType", () => { ... });
it("does NOT render UploadButton cho business/user-flow/business-rules", () => { ... });
it("inserts markdown at cursor position on upload success", async () => { ... });
```

**Green**:

- `apps/web/src/queries/uploads.ts` — `useUpload(featureId)` mutation.
- `apps/web/src/components/features/UploadButton.tsx`.
- `apps/web/src/components/features/SectionEditor.tsx` — extend props + conditional render + cursor insert helper.

**Refactor**: extract `insertAtCursor(body, markdown, cursorPos)` pure util → `apps/web/src/lib/cursor.ts` (testable in isolation).

### DoD

- [x] UploadButton 4 test cases green (label render, happy upload + markdown, 413 toast, 415 toast).
- [x] SectionEditor extension 4 test cases green (3 gate types + cursor insert).
- [x] Cursor insert util tested separately (4 cases).
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): SectionEditor upload toolbar + useUpload mutation (US-003 / T5 / FR-UPLOAD-001)
```

---

## T6 — Section editable gate + ownership

### Metadata

- **Effort**: 2h
- **FR covered**: [FR-FEAT-002](../../02-requirements.md#fr-feat-002--5-section-template), [FR-FEAT-003](../../02-requirements.md#fr-feat-003--per-section-multi-author)
- **AC covered (US-003)**: AC-1 (Hùng mở feature thấy 5 sections editable), AC-7 (per-section ownership visible).
- **Deps**: T5 (SectionEditor với upload ready), T2 (for screenshots upload path).
- **Parallel**: no.

### Goal

1. **Enable edit cho 2 sections**: SectionCard hiện tại (US-002 T7) allow edit cho `business` / `user-flow` / `business-rules` only. Remove gate → cho phép all 5 sections enter edit mode. Upload toolbar chỉ hiện tại 2 (from T5).
2. **API response extension**: `SectionResponse` shape thêm `updatedByName: string | null` (join `users.display_name` via `sections.updated_by` FK). BE repo query update.
3. **FE render**: `FeatureSections.tsx` render subtitle `"cập nhật bởi @<updatedByName>, <relative time>"` dưới mỗi section h2 (khi section có body). Empty sections skip subtitle.

### TDD cycle

**Red**:

```ts
// apps/api/tests/routes/read.test.ts (extend)
it("GET feature detail includes updatedByName per section", async () => {
  // Seed: admin@local wrote business; dev@local wrote tech-notes
  const res = await agent.get("/api/v1/projects/demo/features/login-with-email");
  const sections = res.body.data.sections;
  expect(sections.find((s) => s.type === "business").updatedByName).toBeTruthy();
});
```

```tsx
// apps/web/tests/components/FeatureSections.test.tsx
it("renders 'cập nhật bởi @author, N trước' dưới section heading khi filled", () => { ... });
it("skips subtitle cho empty sections", () => { ... });
it("renders '(người dùng đã xóa)' khi updatedByName null + body not empty", () => { ... });

// apps/web/tests/pages/FeatureDetailPage.test.tsx (extend)
it("all 5 sections have 'Sửa' button for admin/author role (AC-1)", () => { ... });
```

**Green**:

- `apps/api/src/repos/sectionRepo.ts` — update query to JOIN users + return `updatedByName`.
- `packages/shared/src/schemas/feature.ts` — extend `SectionResponse` type với `updatedByName: string | null`.
- `apps/web/src/components/features/FeatureSections.tsx` — render subtitle.
- `apps/web/src/components/features/SectionCard.tsx` — drop business-only gate (or expand to all 5).

**Refactor**: section-type predicate util nếu logic repeats.

### DoD

- [x] API test 1 (JOIN updatedByName) + FE tests 2 subtitle + existing 5-button gate test updated.
- [x] Existing US-001 read path tests still green (no regression).
- [x] Existing US-002 edit path tests still green (now 5 sections editable per story intent).
- [x] `pnpm test`/`lint`/`typecheck` green.

### Commit example

```
feat(web): enable tech-notes/screenshots edit + per-section ownership UI (US-003 / T6 / FR-FEAT-003)
```

---

## T7 — E2E smoke + progress sync

### Metadata

- **Effort**: 2h
- **FR covered**: all US-003 scope
- **AC covered (US-003)**: cross-cutting (AC-1, AC-2, AC-4, AC-7, AC-8 smoke; 5xx paths covered bằng unit tests)
- **Deps**: T1-T6 all green
- **Parallel**: no (final task)

### Goal

1 Playwright E2E verify full happy path:

1. Login admin (Lan proxy) — seed 3 business sections của feature `login-with-email` (via existing US-002 test fixture or direct DB).
2. Logout, login dev@local (Hùng).
3. Mở feature detail → thấy 5 sections; business có "cập nhật bởi admin".
4. Click Sửa tech-notes → type `Xem PR: https://github.com/acme/repo/pull/42` → Lưu.
5. Read mode: assert EmbedCard visible + anchor href correct.
6. Click Sửa screenshots → click "Upload ảnh" → `setInputFiles(test-fixture.png)` → wait 201 → assert markdown inserted → Lưu.
7. Reload → assert `<img src="/uploads/...">` visible.
8. Assert section subtitles: business = admin, tech-notes/screenshots = dev.

Progress sync + CHANGELOG cut `[US-003]` block parity với US-002/US-004.

### TDD cycle

**Red**:

```ts
// e2e/us-003.spec.ts
test("US-003 happy path: login dev → edit tech-notes + embed → upload screenshot → ownership metadata", async ({
  page,
}) => {
  // ... full flow
});
```

**Green**:

- E2E spec complete.
- Fixture file `e2e/fixtures/test-screenshot.png` (tiny ~10 KiB image).
- Handle sonner toast assertions + `page.setInputFiles()` for upload.

**Refactor**: login helper `loginAs(page, email)` nếu chưa có.

### Progress sync (post-DoD)

Sau khi T7 merge, commit riêng `docs: sync progress markers after US-003 complete`:

- [README.md](../../../README.md) — status "M2 complete: US-002 + US-003 + US-004 ✅" + test stats update.
- [.specs/roadmap.md](../../roadmap.md) — M2 progress list thêm US-003 entries T1-T7; M2 overall status → ✅.
- [.specs/traceability.md](../../traceability.md) — FR-FEAT-003 + FR-EMBED-001 + FR-UPLOAD-001 rows flip ✅; reverse index thêm US-003 task table.
- [.specs/ui/feature-detail.md](../../ui/feature-detail.md) Status `Ready (US-003 …)` → `Implemented (US-003 / T5-T6 <hash>)`.
- [.specs/ui/design-system.md](../../ui/design-system.md) CHANGELOG row US-003 `(planned)` → ship hash.
- [.specs/releases/CHANGELOG.md](../../releases/CHANGELOG.md) cut `[US-003]` block (parity với `[US-002]` + `[US-004]` pattern).
- [.specs/stories/US-003.md](../US-003.md) Status `Ready` → `Done`.
- Flip DoD `[ ]` → `[x]` cho T1-T7.

### DoD

- [x] E2E test green locally (`pnpm test:e2e` — 4/4 pass incl. US-003).
- [x] Progress sync commit landed (this commit).
- [x] `pnpm test`/`lint`/`typecheck` green (81 api + 114 web + 24 shared).

### Commit example

```
test(web): US-003 E2E smoke — tech-notes embed + upload + ownership (US-003 / T7)
```

---

## Risks / open items

- **Upload filesystem persistence**: `UPLOAD_DIR` mặc định `./data/uploads` — Docker compose cần volume mount cho dev + M3 prod. Nếu infra dev không persist giữa container restart → test upload sẽ flaky. Mitigation: volume mount trong T2.
- **Brand icon SVG**: 3 custom SVG components (~60 LOC total). Có thể feedback "ugly" — acceptable v1, revisit sau pilot.
- **Magic-byte validation edge case**: `file-type` lib không detect SVG → SVG would fall through as "unknown" → 415. Acceptable — SVG out of scope (story §Scope out: png/jpg/webp only).
- **MarkdownView post-process**: swap `<a>` → EmbedCard sau DOMPurify có thể race với `dangerouslySetInnerHTML`. Alternative: custom markdown-it plugin or render as React components instead of HTML string. Decision defer → thử DOM traversal trước, migrate nếu perf/correctness issue.
- **AC-7 `updatedByName` join perf**: thêm `JOIN users` vào section query. V1 OK vì only 5 rows/feature. Index `sections.updated_by` (FK đã có) — query cost negligible.
- **Embed card trong preview pane**: preview dùng cùng MarkdownView pipeline → cards render trong preview cũng. OK UX.
