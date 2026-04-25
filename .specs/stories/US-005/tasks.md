# US-005 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level sections Conventions/Summary are additional_sections_allowed) -->

_Story_: [US-005 — Search v2: multi-entity + filters](../US-005.md)
_Total estimate_: ~14-18h (solo, TDD pace)
_Last updated_: 2026-04-25 (Draft — Phase 0 spec artifacts in progress)

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-005 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **DoD** mỗi task:
  1. Tests passing (`pnpm test` + task test file).
  2. `pnpm lint` + `pnpm typecheck` root green.
  3. AC liên quan có automated coverage.
  4. Task commit landed on `main`.
- **Order**: tuần tự T1 → T10. Một số có parallel potential (xem Summary).
- **UI spec prerequisite**: T7-T9 chạm FE → `.specs/ui/search.md` rewrite phải `Ready` trước (Phase 0.2).

---

## Task Summary

| #                                                      | Title                                                 | Effort | AC covered                          | FR touched             | Layer  | Status     |
| ------------------------------------------------------ | ----------------------------------------------------- | ------ | ----------------------------------- | ---------------------- | ------ | ---------- |
| [T1](#t1--db-migration-tsvector-projects--uploads)     | DB migration tsvector projects + uploads + caption    | 1.5h   | prereq                              | SEARCH-002             | BE     | 🟡 Planned |
| [T2](#t2--searchrepo-multi-entity-rewrite)             | searchRepo multi-entity `searchAll(q, opts)` rewrite  | 3h     | AC-1, AC-2, AC-3, AC-4, AC-5, AC-10 | SEARCH-002, SEARCH-003 | BE     | 🟡 Planned |
| [T3](#t3--shared-schemas-searchresultsv2)              | Shared schemas: `SearchResultsV2` + filter types      | 1h     | AC-1                                | SEARCH-002, SEARCH-003 | shared | 🟡 Planned |
| [T4](#t4--search-route-v2-with-filters)                | `GET /api/v1/search` route v2 with filter params      | 2h     | AC-1, AC-6, AC-7, AC-8, AC-9        | SEARCH-002, SEARCH-003 | BE     | 🟡 Planned |
| [T5](#t5--get-users-endpoint--user-list-repo)          | `GET /api/v1/users` endpoint + `userRepo.listUsers()` | 1.5h   | AC-11                               | USER-001               | BE     | 🟡 Planned |
| [T6](#t6--frontend-query-hooks-usesearch-v2--useusers) | FE query hooks: useSearch v2 + useUsers               | 1h     | AC-1, AC-11                         | SEARCH-002, USER-001   | FE     | 🟡 Planned |
| [T7](#t7--filterbar-component--sub-filters)            | FilterBar + 4 sub-filter components + URL state       | 3h     | AC-6, AC-7, AC-8, AC-9, AC-13       | SEARCH-003             | FE     | 🟡 Planned |
| [T8](#t8--per-entity-result-cards)                     | 5 per-entity result cards + sanitize roundtrip        | 2.5h   | AC-2, AC-3, AC-4, AC-5, AC-15       | SEARCH-002             | FE     | 🟡 Planned |
| [T9](#t9--searchpage-grouped-layout--anchors)          | SearchPage grouped layout + section anchor verify     | 2h     | AC-3, AC-12, AC-14                  | SEARCH-002             | FE     | 🟡 Planned |
| [T10](#t10--tests--e2e--progress-sync)                 | Tests + E2E us-005.spec + progress sync               | 1.5h   | all                                 | all                    | test   | 🟡 Planned |

**Critical path**: T1 → T2 → T3 → T4 → T6 → T7/T8 → T9 → T10.

**Parallel potential**:

- T3 (shared schemas) start sau T2 outline confirmed; có thể song song với T4 implementation.
- T5 (users endpoint) độc lập T1-T4; có thể start ngay sau T1.
- T7 + T8 (FE filter bar + result cards) song song được sau T6.

---

## T1 — DB migration: tsvector projects + uploads

### Metadata

- **Effort**: 1.5h
- **FR covered**: [FR-SEARCH-002](../../02-requirements.md#fr-search-002--multi-entity-search)
- **AC covered (US-005)**: prereq cho AC-2 (project hit) + AC-5 (upload hit).
- **Deps**: US-001 ship (initial 0001 FTS migration), pgcrypto extension.
- **Parallel**: no — foundation cho T2.

### Goal

- New migration `apps/api/src/db/migrations/0002_search_vectors_v2.sql`:
  - `ALTER TABLE projects ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (...)` — bao name + description.
  - `ALTER TABLE uploads ADD COLUMN caption text` (nullable).
  - `ALTER TABLE uploads ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (...)` — bao filename + caption.
  - GIN indexes per cột vector mới.
- Update `apps/api/src/db/schema.ts`: add `caption: text("caption")` cột uploads. Comment hint cho generated `search_vector`.

### TDD cycle

**Red**: `apps/api/src/repos/__tests__/searchRepo.v2.spec.ts` — seed project name "Đăng nhập SSO", search "đăng nhập" → expect ≥1 project hit. Fails vì column chưa có.

**Green**: write migration + schema update; run `pnpm db:generate` + commit migration; restart compose to apply.

**Refactor**: extract migration constants nếu lặp.

### DoD checklist

- [ ] Migration file landed; `pnpm db:up` clean run.
- [ ] Schema.ts reflect cột mới.
- [ ] Repo test red → green.
- [ ] `pnpm lint` + `pnpm typecheck` xanh.

### Commit example

```
feat(api): tsvector indexes for projects + uploads (US-005 / T1 / FR-SEARCH-002)
```

---

## T2 — searchRepo multi-entity rewrite

### Metadata

- **Effort**: 3h
- **FR covered**: [FR-SEARCH-002](../../02-requirements.md#fr-search-002--multi-entity-search), [FR-SEARCH-003](../../02-requirements.md#fr-search-003--search-filters)
- **AC covered**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10.
- **Deps**: T1.
- **Parallel**: no — anchor BE work.

### Goal

Rewrite `apps/api/src/repos/searchRepo.ts`:

- New interface:
  ```ts
  interface SearchRepo {
    searchAll(q: string, opts: SearchOpts): Promise<SearchResultsV2Row>;
  }
  ```
- 5 sub-queries chạy `Promise.all`. Mỗi query dùng `tsvector @@ plainto_tsquery('simple', q)` (project + feature.search_vector + sections.body's tsvector + uploads.search_vector). Author dùng ILIKE display_name.
- Apply filters per-entity (sectionTypes, authorId, updatedSince, status, projectSlug). Archived projects loại qua join.
- Limit 5 per group, sort `ts_rank` desc.
- Snippet via `ts_headline` + `<mark>` tags.

### TDD cycle

**Red**: ≥8 cases trong `searchRepo.v2.spec.ts`:

- happy 5 group có hit
- archived project loại
- sectionTypes=user-flow narrows
- authorId narrows sections + uploads
- updatedSince narrows
- status=filled narrows features
- projectSlug scope narrows
- empty query keep cases (handled at route layer; repo expects non-empty)

**Green**: implement queries; ts_headline params reuse cũ.

**Refactor**: extract per-entity query helpers; share filter clause builder.

### DoD checklist

- [ ] 5 entity queries pass.
- [ ] 8+ filter combo cases pass.
- [ ] `pnpm --filter @onboarding/api test` xanh.
- [ ] Manual benchmark seeded 100 features < 200ms p95 (note in PR comment).

### Commit example

```
feat(api): multi-entity search repo (US-005 / T2 / FR-SEARCH-002,003)
```

---

## T3 — Shared schemas: SearchResultsV2

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-SEARCH-002](../../02-requirements.md#fr-search-002--multi-entity-search), [FR-SEARCH-003](../../02-requirements.md#fr-search-003--search-filters)
- **AC covered**: AC-1.
- **Deps**: T2 outline confirmed.
- **Parallel**: yes — với T4 implementation.

### Goal

Update `packages/shared/src/search.ts`:

- Zod schemas: `projectHitSchema`, `featureHitSchema`, `sectionHitSchema`, `authorHitSchema`, `uploadHitSchema`, `searchResultsV2Schema`.
- Filter types: `searchOptsSchema` với `sectionTypes`, `authorId`, `updatedSince`, `status`.
- Reuse `sectionTypeSchema` từ feature.
- Keep `SearchHit` deprecated alias để 1 commit migrate atomic; xoá sau T9.

### TDD cycle

**Red**: `packages/shared/tests/schemas/search-v2.test.ts` — parse sample SearchResultsV2 happy + reject extra keys + reject invalid sectionType.
**Green**: write Zod schemas; export.
**Refactor**: dedupe enum imports.

### DoD checklist

- [ ] Schemas parse/reject expected.
- [ ] `pnpm --filter @onboarding/shared test` xanh.

### Commit example

```
feat(shared): SearchResultsV2 schema + filter types (US-005 / T3 / FR-SEARCH-002,003)
```

---

## T4 — Search route v2 with filters

### Metadata

- **Effort**: 2h
- **FR covered**: SEARCH-002, SEARCH-003.
- **AC covered**: AC-1, AC-6, AC-7, AC-8, AC-9.
- **Deps**: T2, T3.
- **Parallel**: no.

### Goal

Update `apps/api/src/routes/search.ts`:

- Extend Zod query schema: `sectionTypes` CSV (parse → `SectionType[]`), `authorId` UUID, `updatedSince` ISO date, `status` enum, `projectSlug` keep.
- Call `searchRepo.searchAll(q, opts)`, return `{ data: SearchResultsV2 }`.
- Reuse SEARCH_QUERY_EMPTY / TOO_LONG.
- Invalid filter → 400 VALIDATION_ERROR.

### TDD cycle

**Red**: `apps/api/src/routes/__tests__/search.test.ts` — full grouped happy, sectionTypes filter, authorId filter, updatedSince filter, status filter, invalid sectionTypes 400.

**Green**: route handler + Zod parse.

**Refactor**: extract filter parser if reused.

### DoD checklist

- [ ] Integration tests pass.
- [ ] api-surface.md row updated trong cùng commit.

### Commit example

```
feat(api): search v2 route with filters (US-005 / T4 / FR-SEARCH-002,003)
```

---

## T5 — `GET /users` endpoint + userRepo.listUsers()

### Metadata

- **Effort**: 1.5h
- **FR covered**: [FR-USER-001](../../02-requirements.md#fr-user-001--user-list-endpoint).
- **AC covered**: AC-11.
- **Deps**: T1.
- **Parallel**: yes — độc lập T2-T4.

### Goal

- New `apps/api/src/repos/userRepo.ts`: `listUsers({ q?, role? })`.
- New `apps/api/src/routes/users.ts`: `GET /api/v1/users?q=&role=` requireAuth (any role read).
- Wire `apps/api/src/app.ts`.
- Response excludes email + passwordHash + createdAt.

### TDD cycle

**Red**: `users.test.ts` — 200 happy, exclude email field, q ILIKE narrow, role filter, sort displayName asc, limit 50.

**Green**: repo + route + Zod parse.

**Refactor**: shared response shape helper if exists.

### DoD checklist

- [ ] Tests pass; response shape verified excludes sensitive fields.
- [ ] api-surface.md row added.

### Commit example

```
feat(api): GET /users for author filter (US-005 / T5 / FR-USER-001)
```

---

## T6 — FE query hooks: useSearch v2 + useUsers

### Metadata

- **Effort**: 1h
- **FR covered**: SEARCH-002, USER-001.
- **AC covered**: AC-1, AC-11.
- **Deps**: T4, T5.
- **Parallel**: no.

### Goal

- Update `apps/web/src/queries/search.ts`: extend params (filter opts), return `SearchResultsV2`. Query key includes filter object stringified.
- New `apps/web/src/queries/users.ts`: `useUsers({ q?, role? })`.

### TDD cycle

**Red**: `search.test.tsx` — useSearch fires correct URL with filters; useUsers fires + returns shape.

**Green**: hook impl with QueryClient mock + msw.

**Refactor**: extract query key factory.

### DoD checklist

- [ ] Hook tests pass.
- [ ] No leftover `SearchHit` consumer.

### Commit example

```
feat(web): search v2 query hooks (US-005 / T6)
```

---

## T7 — FilterBar component + sub-filters

### Metadata

- **Effort**: 3h
- **FR covered**: SEARCH-003.
- **AC covered**: AC-6, AC-7, AC-8, AC-9, AC-13.
- **Deps**: T6.
- **Parallel**: yes — với T8.

### Goal

New components in `apps/web/src/components/search/`:

- `FilterBar.tsx` composite.
- `SectionTypeChips.tsx` multi-select (5 toggles).
- `AuthorPicker.tsx` combobox + `useUsers` debounced (300ms).
- `TimeRangeDropdown.tsx` preset 4 options.
- `StatusChips.tsx` 3 toggle single-clear.

URL state: `useSearchParams` round-trip; only non-default values serialize.

### TDD cycle

**Red**: per-component test (toggle multi, debounce, dropdown selection); URL state roundtrip integration test.

**Green**: implement; reuse shadcn primitives (DropdownMenu, Combobox).

**Refactor**: extract `useFilterState` hook.

### DoD checklist

- [ ] Component unit tests pass.
- [ ] URL state roundtrip test pass (AC-13).
- [ ] aria-labels on all interactive triggers.

### Commit example

```
feat(web): search filter bar (US-005 / T7 / FR-SEARCH-003)
```

---

## T8 — Per-entity result cards

### Metadata

- **Effort**: 2.5h
- **FR covered**: SEARCH-002.
- **AC covered**: AC-2, AC-3, AC-4, AC-5, AC-15.
- **Deps**: T6.
- **Parallel**: yes — với T7.

### Goal

5 cards trong `apps/web/src/components/search/`:

- `ProjectResultCard.tsx`
- `FeatureResultCard.tsx` (rename + refactor existing `SearchResultRow.tsx`)
- `SectionResultCard.tsx` (icon + breadcrumb + snippet + author/time meta + anchor link `#section-{type}`)
- `AuthorResultCard.tsx` (avatar + name + role badge + touched count + placeholder click toast)
- `UploadResultCard.tsx` (file icon + filename + parent feature + uploadedBy + time)

Reuse `sanitizeSnippet`, `ProjectAvatar`, `Avatar`, `Badge`, `RelativeTime`.

### TDD cycle

**Red**: per-card render test với fixture hit; XSS sanitize regression test (AC-15).

**Green**: implement cards; cn utility classes per UI spec.

**Refactor**: extract `<EntityCard>` shell if duplication > 3.

### DoD checklist

- [ ] All 5 cards render expected.
- [ ] Sanitize regression pass.
- [ ] Section card href = `/projects/:p/features/:f#section-:t`.

### Commit example

```
feat(web): per-entity result cards (US-005 / T8 / FR-SEARCH-002)
```

---

## T9 — SearchPage grouped layout + section anchor verify

### Metadata

- **Effort**: 2h
- **FR covered**: SEARCH-002.
- **AC covered**: AC-3, AC-12, AC-14.
- **Deps**: T7, T8.
- **Parallel**: no — final page assembly.

### Goal

Rewrite `apps/web/src/pages/SearchPage.tsx`:

- Hero block giữ.
- FilterBar render.
- 5 group sections render conditional skip nếu count=0; group header `{icon}+title+count`.
- Idle / loading / zero-result variants.
- Zero-result list filter active chips removable.

Verify FeatureDetailPage section heading có `id="section-{type}"`. Nếu chưa, fix in-scope.

### TDD cycle

**Red**: `SearchPage.test.tsx` — grouped render gating (AC-12); zero-result with filter active list (AC-14); E2E snippet of section deep-link (AC-3).

**Green**: page implementation; SectionToc/heading anchor patch nếu cần.

**Refactor**: extract `EntityGroup<T>` wrapper component.

### DoD checklist

- [ ] All Page tests pass.
- [ ] Browser smoke 5 groups visible với seed data.
- [ ] Section anchor scroll work in browser.

### Commit example

```
feat(web): SearchPage grouped multi-entity (US-005 / T9 / FR-SEARCH-002)
```

---

## T10 — Tests + E2E + progress sync

### Metadata

- **Effort**: 1.5h
- **FR covered**: all.
- **AC covered**: all (regression).
- **Deps**: T9.
- **Parallel**: no.

### Goal

- New `e2e/us-005.spec.ts`: login → AppHeader search → grouped UI 4+ groups → toggle SectionType `user-flow` → list narrows → toggle Author Lan → list narrows → click section → deep-link anchor scroll.
- Run full suite; ensure no regressions.
- Phase 3 progress sync commit (separate, post-T10): README, SETUP.md, roadmap, US-005/tasks.md DoD flips, traceability flip 🟡 → ✅, api-surface, ui/search.md Status `Implemented`, CHANGELOG `[Unreleased]` Added.

### TDD cycle

**Red**: e2e spec assertions per AC.
**Green**: fix selectors / aria-labels / data-testid nếu spec tests fail vì FE.
**Refactor**: tidy fixture seeding nếu cần.

### DoD checklist

- [ ] `pnpm test:e2e` xanh (us-005 + existing 4 specs).
- [ ] `pnpm test` toàn bộ workspaces xanh.
- [ ] Progress-sync commit landed.

### Commit example

```
test(web): US-005 unit + e2e coverage (US-005 / T10)
```

then:

```
docs: sync progress markers after US-005 ship (US-005 / Phase 3)
```
