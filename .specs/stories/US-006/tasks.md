# US-006 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level Conventions/Summary additional_sections_allowed) -->

_Story_: [US-006 — Search v2.1: prefix + accent-insensitive + fuzzy](../US-006.md)
_Total estimate_: ~8-10h (solo, TDD pace)
_Last updated_: 2026-05-01

---

## Conventions

- **TDD**: failing test trước. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-006 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **DoD** mỗi task:
  1. Tests passing (`pnpm test` + task test file).
  2. `pnpm lint` + `pnpm typecheck` root green.
  3. AC liên quan có automated coverage.
  4. Task commit landed on `main`.
- **Order**: tuần tự T1 → T5. T3 độc lập T2 (có thể parallel sau T1).
- **No FE change**: scope BE + DB + tests only.

---

## Task Summary

| #                                                         | Title                                             | Effort | AC covered             | FR touched | Layer | Status     |
| --------------------------------------------------------- | ------------------------------------------------- | ------ | ---------------------- | ---------- | ----- | ---------- |
| [T1](#t1--migration-unaccent--pg_trgm--rebuild-tsvectors) | Migration: unaccent + pg_trgm + rebuild tsvectors | 1.5h   | prereq                 | SEARCH-004 | BE/DB | 🟡 Planned |
| [T2](#t2--buildtsquery-helper--searchrepo-rewrite)        | buildTsQuery helper + searchRepo prefix/unaccent  | 3h     | AC-1, AC-2, AC-3, AC-7 | SEARCH-004 | BE    | 🟡 Planned |
| [T3](#t3--trigram-fuzzy-fallback--author-unaccent)        | Trigram fuzzy fallback + author display unaccent  | 2h     | AC-4, AC-5             | SEARCH-004 | BE    | 🟡 Planned |
| [T4](#t4--unit--integration-tests--regression)            | Unit + integration tests + regression suite       | 1.5h   | AC-1..AC-7, AC-6       | all        | test  | 🟡 Planned |
| [T5](#t5--e2e-extend--benchmark--progress-sync)           | E2E extend + benchmark + progress sync            | 1.5h   | AC-1 e2e, AC-6         | all        | test  | 🟡 Planned |

**Critical path**: T1 → T2 → T3 → T4 → T5.
**Parallel potential**: T3 (author unaccent) độc lập T2; có thể start sau T1 cùng T2.

---

## T1 — Migration: unaccent + pg_trgm + rebuild tsvectors

### Metadata

- **Effort**: 1.5h
- **FR covered**: [FR-SEARCH-004](../../02-requirements.md#fr-search-004--query-semantics)
- **AC covered**: prereq cho AC-1..AC-7.
- **Deps**: US-005 ship (migration `0001_fts_triggers.sql` + `0004_search_vectors_v2.sql`).
- **Parallel**: no — foundation cho T2/T3.

### Goal

New migration `apps/api/src/db/migrations/0005_search_unaccent_trgm.sql`:

- `CREATE EXTENSION IF NOT EXISTS unaccent;`
- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- `CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$ SELECT unaccent('unaccent', $1) $$;`
- `ALTER TABLE projects DROP COLUMN search_vector` + recreate dùng `immutable_unaccent`.
- Same cho `uploads.search_vector` (caption + filename).
- Update trigger `features_rebuild_search_vector` (define trong `0001_fts_triggers.sql`) → wrap content qua `immutable_unaccent`. Backfill: `UPDATE features SET title = title;` để re-fire trigger.
- `CREATE INDEX ... USING gin (immutable_unaccent(<col>) gin_trgm_ops)` cho 4 cols: `projects.name`, `features.title`, `users.display_name`, `uploads.filename`.

Update `apps/api/src/db/schema.ts` comment hint cho generated `search_vector` (no Drizzle change since generated cols not modeled).

### TDD cycle

**Red**: `apps/api/tests/db/search-vectors-v2.test.ts` extend — assert `pg_extension WHERE extname IN ('unaccent','pg_trgm')` returns 2 rows; `pg_proc WHERE proname='immutable_unaccent'` returns 1; trigram indexes exist trên 4 cols. Fails vì chưa có.

**Green**: write migration; `pnpm db:generate` (skip cho raw SQL); restart compose to apply.

**Refactor**: extract index creation pattern qua loop nếu lặp.

### DoD checklist

- [ ] Migration file landed; `pnpm db:up` clean run.
- [ ] DB test verify 2 extensions + 1 function + 4 trigram indexes.
- [ ] Existing US-005 search tests vẫn xanh (smoke regression).
- [ ] `pnpm lint` + `pnpm typecheck` xanh.

### Commit example

```
feat(api): unaccent + pg_trgm extensions + rebuild tsvectors (US-006 / T1 / FR-SEARCH-004)
```

---

## T2 — buildTsQuery helper + searchRepo rewrite

### Metadata

- **Effort**: 3h
- **FR covered**: FR-SEARCH-004.
- **AC covered**: AC-1, AC-2, AC-3, AC-7.
- **Deps**: T1.
- **Parallel**: no — anchor BE work.

### Goal

- New helper `apps/api/src/repos/search/buildTsQuery.ts`:
  ```ts
  export function buildTsQuery(q: string): string {
    // 1. Strip non-alphanumeric (keep Unicode letters via \p{L}\p{N})
    // 2. Tokenize on whitespace
    // 3. Per token: append ":*"
    // 4. Join with " & "
    // 5. Empty → throw / route handles upstream
  }
  ```
- Rewrite `apps/api/src/repos/searchRepo.ts`:
  - Replace `plainto_tsquery('simple', $q)` → `to_tsquery('simple', $tsq)` (where `$tsq` = output of `buildTsQuery(immutable_unaccent client-side or DB-side q)`).
  - Apply per 5 entity queries: projects, features, sections, uploads (tsquery on search_vector); authors uses ILIKE branch (T3).
  - Pass unaccented query to DB qua param; DB-side `immutable_unaccent` cho field side trong WHERE.
  - `ts_headline` reuse same tsquery.

### TDD cycle

**Red**: `apps/api/tests/repos/searchRepo.v2.test.ts` add cases:

- AC-1: seed project name "A3Solutions" + slug "a3solutions" + query "a" → expect project hit.
- AC-2: seed feature title "Đăng nhập SSO" + query "đăn" → feature hit.
- AC-3a: seed "Đăng nhập" + query "dang nhap" → hit.
- AC-3b: seed "Dang nhap" + query "đăng nhập" → hit.
- AC-7: query `"foo&|!bar"` → no error, treat as 2 tokens.

**Green**: write helper + update SQL queries.

**Refactor**: extract shared tsquery WHERE clause; benchmark spot-check.

### DoD checklist

- [ ] 5 entity prefix tests pass.
- [ ] AC-7 sanitize test pass.
- [ ] Existing US-005 AC-1..AC-15 tests vẫn xanh.
- [ ] `pnpm --filter @onboarding/api test` xanh.

### Commit example

```
feat(api): prefix + unaccent search query semantics (US-006 / T2 / FR-SEARCH-004)
```

---

## T3 — Trigram fuzzy fallback + author display unaccent

### Metadata

- **Effort**: 2h
- **FR covered**: FR-SEARCH-004.
- **AC covered**: AC-4, AC-5.
- **Deps**: T1.
- **Parallel**: yes — với T2 sau T1 done.

### Goal

- Update `searchRepo.ts` per "short field" entity (projects/features/uploads):
  - `WHERE` clause: `(search_vector @@ tsquery) OR (immutable_unaccent(<short_field>) % immutable_unaccent($q))`.
  - Rank: `greatest(ts_rank(search_vector, tsquery), similarity(immutable_unaccent(<short_field>), immutable_unaccent($q))) AS rank`.
  - Set `pg_trgm.similarity_threshold = 0.3` per session (or use `<%` operator with explicit threshold).
- Authors query: replace raw ILIKE chain với:
  ```sql
  WHERE immutable_unaccent(display_name) ILIKE immutable_unaccent($q || '%')
     OR immutable_unaccent(display_name) % immutable_unaccent($q)
  ORDER BY similarity(immutable_unaccent(display_name), immutable_unaccent($q)) DESC, ...
  ```

### TDD cycle

**Red**: extend `searchRepo.v2.test.ts`:

- AC-4: seed project "onboarding" + query "ondoarding" → trigram hit, rank ≤ pure-tsquery hit.
- AC-5: seed user display_name "Lê Văn Hùng" + query "hung" → author hit.

**Green**: SQL update per entity.

**Refactor**: extract `similarityRankExpr(field, q)` helper.

### DoD checklist

- [ ] Trigram fallback hit cho 4 short fields.
- [ ] Author unaccent + trgm hit work.
- [ ] Rank ordering verified (tsquery > trgm fallback).
- [ ] Tests xanh.

### Commit example

```
feat(api): pg_trgm fuzzy fallback + author unaccent (US-006 / T3 / FR-SEARCH-004)
```

---

## T4 — Unit + integration tests + regression

### Metadata

- **Effort**: 1.5h
- **FR covered**: all FR-SEARCH-004.
- **AC covered**: all (regression cover AC-6).
- **Deps**: T2, T3.
- **Parallel**: no.

### Goal

- Sanity sweep: ensure 7 AC test cases trong `searchRepo.v2.test.ts` đầy đủ.
- Add integration in `apps/api/tests/routes/search-v2.test.ts`:
  - `GET /api/v1/search?q=a` → 200, `data.projects[0].slug = "a3solutions"`.
  - `GET /api/v1/search?q=dang%20nhap` → 200, hit project "Đăng nhập".
- Run full `pnpm test` workspace; fix regressions nếu có.

### TDD cycle

**Red**: viết integration cases first; chạy → expect green nếu T2/T3 đúng. Nếu fail, fix repo.

**Green**: ensure routes pass.

**Refactor**: tidy fixtures.

### DoD checklist

- [ ] 2+ integration cases pass.
- [ ] `pnpm test` toàn workspace xanh.
- [ ] No `.skip` / `.only` leak.

### Commit example

```
test(api): US-006 unit + integration coverage (US-006 / T4)
```

---

## T5 — E2E extend + benchmark + progress sync

### Metadata

- **Effort**: 1.5h
- **FR covered**: all.
- **AC covered**: AC-1 e2e + AC-6 regression.
- **Deps**: T4.
- **Parallel**: no.

### Goal

- Extend `e2e/us-005.spec.ts` với scenario: login → AppHeader gõ "a" → SearchPage hiển thị ProjectResultCard "a3solutions".
- Manual benchmark: `EXPLAIN ANALYZE` query `q="a"` + `q="dang nhap"` < 500ms p95 trên seed corpus. Document trong PR comment.
- Progress sync commit (separate, post-T5):
  - README.md status line + Next task pointer.
  - .specs/roadmap.md (if M3 row affected).
  - .specs/stories/US-006/tasks.md DoD flips + Status column ✅.
  - .specs/traceability.md row US-006 🟡 → ✅.
  - .specs/api-surface.md `GET /search` row note "v2.1 prefix+unaccent+fuzzy".
  - .specs/releases/CHANGELOG.md `[Unreleased].Changed`.

### TDD cycle

**Red**: e2e assertion fails until selectors verified.
**Green**: fix data-testid / aria-labels nếu cần.
**Refactor**: tidy fixture seeding.

### DoD checklist

- [ ] `pnpm test:e2e` xanh (us-005 + extended scenario).
- [ ] Benchmark documented < 500ms p95.
- [ ] Progress-sync commit landed.

### Commit example

```
test(web): US-006 e2e prefix + benchmark (US-006 / T5)
```

then:

```
docs: sync progress markers after US-006 ship (US-006 / T5 follow-up)
```
