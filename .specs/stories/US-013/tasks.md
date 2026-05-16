# US-013 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-013 — Repo URL + PR URL linking](../US-013.md)
_Total estimate_: ~4-5h (solo, TDD pace)
_Last updated_: 2026-05-16

---

## Conventions

- **TDD**: failing test trước.
- **Commit format**: `type(scope): subject (US-013 / T<N>)`.
- **DoD**: tests passing + lint + typecheck + AC coverage.
- **Order**: T1 → T2 → T3 sequential.

---

## Task Summary

| #                                         | Title                                                                              | Effort | AC covered | FR touched                   | Status     |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | ------ | ---------- | ---------------------------- | ---------- |
| [T1](#t1--migration--shared-schemas)      | Migration `0011` + Zod `urlSchema` + extend update schemas + response types        | 1h     | prereq     | LINK-001                     | ✅ shipped |
| [T2](#t2--be-routes-extend)               | Wire `repoUrl` vào PATCH project + `prUrl` vào PATCH feature + tests + repo update | 1.5h   | AC-1..9    | LINK-001, PROJ-002, FEAT-001 | ✅ shipped |
| [T3](#t3--fe-wire-buttons--dialog-fields) | Repo / Xem PR buttons real link, EditProject + EditFeature dialog field, tests     | 2-2.5h | AC-10..14  | —                            | ✅ shipped |

---

## T1 — Migration + shared schemas

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-LINK-001](../../02-requirements.md#fr-link-001--external-repo--pr-url-linking)
- **AC covered (US-013)**: prereq (no AC asserted directly; foundation cho T2-T3).
- **Deps**: none
- **Parallel**: no

### Goal

DB có 2 nullable text cột mới; shared types + Zod schemas reflect; api compiles.

### TDD cycle

**Red**:

- `packages/shared/src/schemas/url.test.ts` (mới): `urlSchema` accept `https://x.y`, `http://localhost:3000/x`, reject `not-a-url`, `ftp://x`, string > 500.

**Green**:

- Migration `apps/api/src/db/migrations/0011_projects_repo_url_features_pr_url.sql`:
  ```sql
  ALTER TABLE projects ADD COLUMN repo_url TEXT;
  ALTER TABLE features ADD COLUMN pr_url TEXT;
  ```
- `apps/api/src/db/schema.ts`: thêm `repoUrl: text('repo_url')` trên `projects`, `prUrl: text('pr_url')` trên `features`.
- `packages/shared/src/schemas/common.ts` (hoặc inline trong project.ts): export `urlSchema`.
- `packages/shared/src/schemas/project.ts`: `updateProjectRequestSchema` thêm `repoUrl: urlSchema.nullable().optional()`; `ProjectSummary` + (in feature.ts) `ProjectResponse` thêm `repoUrl: string | null`.
- `packages/shared/src/schemas/feature.ts`: `updateFeatureRequestSchema` (US-012) thêm `prUrl: urlSchema.nullable().optional()` + refine update để chấp nhận key này; `FeatureResponse` + `FeatureListItem` thêm `prUrl: string | null`.

### DoD checklist

- [x] `pnpm db:generate` không sinh extra diff (manual SQL match Drizzle infer) hoặc generated file checked in.
- [x] `APP_ENV=test pnpm db:migrate` áp dụng 0011.
- [x] `pnpm --filter @onboarding/shared test` xanh.
- [x] `pnpm --filter @onboarding/api typecheck` xanh.
- [x] Commit `feat(shared,api): migration 0011 repo_url + pr_url + urlSchema (US-013 / T1)`.

### Commit example

```
feat(shared,api): migration 0011 repo_url + pr_url + urlSchema (US-013 / T1 / FR-LINK-001)
```

---

## T2 — BE routes extend

### Metadata

- **Effort**: 1.5h
- **FR covered**: FR-LINK-001 + FR-PROJ-002 amend + FR-FEAT-001 amend
- **AC covered**: AC-1..AC-9
- **Deps**: T1
- **Parallel**: no

### Goal

PATCH project + PATCH feature accept new URL field với undefined-skip / null-clear / string-update semantics. GET responses include new fields.

### TDD cycle

**Red**:

- `apps/api/tests/routes/projects.patch.test.ts` (extend): cases cho AC-1, AC-2, AC-3, AC-4, AC-8.
- `apps/api/tests/routes/features.patch.test.ts` (extend US-012 file): cases AC-5, AC-6, AC-7, AC-9.

**Green**:

- `projectRepo.updateMetadata` signature extend: input `{ name, description, repoUrl?: string | null | undefined }`. SQL builder skip when `repoUrl === undefined`; set NULL on `null`; set string otherwise.
- `featureRepo.update` same pattern cho `prUrl`.
- `routes/projects.ts` `patch` handler: pass `body.repoUrl` qua repo (giữ undefined nếu missing). Response: `toProjectResponse` include `repoUrl` field từ row.
- `routes/features.ts`: similar.
- Update `toProjectSummary` + `toProjectResponse` + `toFeatureResponse` helpers + list endpoint mapping.

### DoD checklist

- [x] AC-1..AC-9 đều có test.
- [x] `pnpm --filter @onboarding/api test` xanh.
- [x] `.specs/api-surface.md` row PATCH project + PATCH feature cập nhật body shape.
- [x] Commit `feat(api): PATCH project repoUrl + PATCH feature prUrl (US-013 / T2)`.

### Commit example

```
feat(api): PATCH project repoUrl + PATCH feature prUrl (US-013 / T2 / FR-LINK-001)
```

---

## T3 — FE wire buttons + dialog fields

### Metadata

- **Effort**: 2-2.5h
- **FR covered**: —
- **AC covered**: AC-10..AC-14
- **Deps**: T2
- **Parallel**: no

### Goal

`/projects/:slug` Repo button + `/projects/:slug/features/:fSlug` "Xem PR" button trở thành real anchor khi có URL, disabled khi null. Edit dialogs có input mới + submit truyền field.

### TDD cycle

**Red**:

- `apps/web/tests/pages/ProjectLandingPage.test.tsx`: assert Repo button is anchor with correct `href` khi `repoUrl` set; disabled button khi null.
- `apps/web/tests/pages/FeatureDetailPage.test.tsx`: same for "Xem PR".
- `apps/web/tests/components/EditProjectDialog.test.tsx`: input "Repo URL" + submit body shape.
- `apps/web/tests/components/EditFeatureDialog.test.tsx` (US-012): extend với PR URL field.

**Green**:

- `apps/web/src/components/projects/ProjectHero.tsx`: nhận `repoUrl: string | null`; render `<a>` hoặc `<button disabled>`.
- `apps/web/src/pages/ProjectLandingPage.tsx`: drop `placeholderToast("Mở repo")`; forward `repoUrl`.
- `apps/web/src/pages/FeatureDetailPage.tsx`: render PR button conditional; drop placeholder.
- `EditProjectDialog.tsx`: thêm input + form state diff.
- `EditFeatureDialog.tsx`: thêm input prUrl.

### DoD checklist

- [x] AC-10..AC-14 covered.
- [x] `pnpm --filter @onboarding/web test` xanh full suite.
- [x] UI spec `.specs/ui/project-landing.md` + `.specs/ui/feature-detail.md` v4.9 note Repo / PR buttons real link.
- [x] Commit `feat(web): Repo + PR buttons real link + dialog inputs (US-013 / T3)`.

### Commit example

```
feat(web): Repo + PR buttons real link + EditProject/Feature URL inputs (US-013 / T3)
```
