# US-008 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-008 — Admin archive feature](../US-008.md)
_Total estimate_: ~5-6h (solo, TDD pace)
_Last updated_: 2026-05-15

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-008 / T<N>)` — xem [CLAUDE.md §Commit message convention](../../../CLAUDE.md).
- **DoD** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific file).
  2. `pnpm lint` + `pnpm typecheck` ở root xanh.
  3. AC liên quan trong [US-008](../US-008.md) đã có automated test coverage.
  4. Commit landed trên `main`.
- **Order**: tasks tuần tự — T<N+1> không start khi T<N> chưa DoD.
- **Reuse-heavy**: 80% pattern clone từ US-004 (project archive). Reference: [ProjectActionsMenu.tsx](../../../apps/web/src/components/projects/ProjectActionsMenu.tsx), [useArchiveProject](../../../apps/web/src/queries/projects.ts), [projectRepo.archive](../../../apps/api/src/repos/projectRepo.ts).

---

## Task Summary

| #                                    | Title                                              | Effort | AC covered             | FR touched | UI spec                                           | Status     |
| ------------------------------------ | -------------------------------------------------- | ------ | ---------------------- | ---------- | ------------------------------------------------- | ---------- |
| [T1](#t1--migration--schema)         | DB migration `archived_at` + Drizzle schema        | 0.5h   | prereq                 | FEAT-001   | —                                                 | 🟡 Planned |
| [T2](#t2--repo--listfeatures-filter) | featureRepo.archive + filter active rows           | 1h     | AC-4, AC-5, AC-6       | FEAT-001   | —                                                 | 🟡 Planned |
| [T3](#t3--archive-route)             | Archive endpoint + tests                           | 1.5h   | AC-4, AC-6, AC-7, AC-8 | FEAT-001   | —                                                 | 🟡 Planned |
| [T4](#t4--mutation-hook)             | `useArchiveFeature` mutation hook                  | 0.5h   | AC-4                   | —          | —                                                 | 🟡 Planned |
| [T5](#t5--fe-component-wire)         | `FeatureActionsMenu` + FeatureCard overlay + tests | 1.5h   | AC-1, AC-2, AC-3, AC-7 | —          | [project-landing.md](../../ui/project-landing.md) | 🟡 Planned |
| [T6](#t6--e2e--progress-sync)        | Playwright E2E + progress sync                     | 1h     | AC-1, AC-4, AC-5       | all        | —                                                 | 🟡 Planned |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6.

---

## T1 — Migration + schema

### Metadata

- **Effort**: 0.5h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered**: prereq (no AC directly).
- **Deps**: none — schema-only.
- **Parallel**: no — foundation.

### Goal

Add `archived_at TIMESTAMPTZ NULL` to `features` + partial index for active rows. Drizzle schema match.

### TDD cycle

#### Red

`apps/api/tests/db/features-archived-column.test.ts` (new): query `\d features` style → expect `archived_at` exists + nullable. Initially fails.

#### Green

- `apps/api/src/db/migrations/0007_features_archived_at.sql`:
  ```sql
  ALTER TABLE features ADD COLUMN archived_at TIMESTAMPTZ;
  CREATE INDEX features_active_idx ON features (project_id) WHERE archived_at IS NULL;
  ```
- `apps/api/src/db/schema.ts`: `archivedAt: timestamp("archived_at", { withTimezone: true })` on features.
- Run `pnpm db:migrate` để apply local.

#### Refactor

- N/A — schema-only.

### DoD checklist

- [ ] Migration applied trên dev DB (`pnpm db:migrate`).
- [ ] Test green.
- [ ] `pnpm typecheck` xanh.
- [ ] Commit `feat(api): add features.archived_at column + partial index (US-008 / T1)`.

### Commit example

```
feat(api): add features.archived_at column + partial index (US-008 / T1 / FR-FEAT-001)
```

---

## T2 — Repo + listFeatures filter

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered**: AC-4 (excluded from list), AC-5 (404 on archived), AC-6 (idempotent).
- **Deps**: T1.

### Goal

`featureRepo.archive(projectSlug, featureSlug)` returns boolean (mirror `projectRepo.archive`). `featureRepo.findByProjectAndSlug` filters `archived_at IS NULL`. `projectRepo.listFeatures` filters archived rows.

### TDD cycle

#### Red

Extend `apps/api/tests/repos/featureRepo.test.ts`:

- `archive sets archived_at + returns true`.
- `archive idempotent (called twice → returns true twice, archived_at chỉ giữ giá trị đầu)`.
- `archive returns false on unknown slug`.
- `findByProjectAndSlug returns null for archived feature`.

Plus `apps/api/tests/repos/projectRepo.test.ts`: `listFeatures excludes archived`.

#### Green

- `apps/api/src/repos/featureRepo.ts`: add `archive(projectSlug, featureSlug)` method (interface + impl). Add `isNull(features.archivedAt)` in `findByProjectAndSlug` WHERE clause.
- `apps/api/src/repos/projectRepo.ts:120-137`: `listFeatures` WHERE thêm `and(isNull(features.archivedAt))`.

#### Refactor

- Reuse `and()` import — đã có.

### DoD checklist

- [ ] 5+ test cases green.
- [ ] `pnpm typecheck` + `pnpm lint` xanh.
- [ ] Commit `feat(api): featureRepo.archive + filter archived in listFeatures (US-008 / T2)`.

### Commit example

```
feat(api): featureRepo.archive + filter archived in listFeatures (US-008 / T2 / FR-FEAT-001)
```

---

## T3 — Archive route

### Metadata

- **Effort**: 1.5h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered**: AC-4, AC-6 (idempotent), AC-7 (403), AC-8 (401).
- **Deps**: T2.

### Goal

`POST /api/v1/projects/:slug/features/:featureSlug/archive` — admin-only, idempotent, 204/404/403/401.

### TDD cycle

#### Red

`apps/api/tests/routes/features-archive.test.ts` (new):

- 204 happy path (admin + existing feature).
- 401 no session.
- 403 author session.
- 404 unknown feature.
- 204 idempotent (second call).
- `GET /projects/:slug` after archive → response không có feature.
- `GET /projects/:slug/features/:fSlug` after archive → 404.

#### Green

- `apps/api/src/routes/features.ts`: thêm handler `archive` (mirror [projects.ts:125-137](../../../apps/api/src/routes/projects.ts#L125-L137)).
- `FeaturesRouterDeps` thêm `requireAdmin: RequestHandler`.
- Route: `router.post("/:featureSlug/archive", requireAuth, requireAdmin, zodValidate({ params: getParams }), archive)`.
- `apps/api/src/index.ts`: pass `requireAdmin` vào `createFeaturesRouter`.

#### Refactor

- Confirm error mapping consistent với project archive.

### DoD checklist

- [ ] 7 test cases green.
- [ ] `pnpm test` toàn api package xanh.
- [ ] Commit `feat(api): POST /projects/:slug/features/:fSlug/archive (US-008 / T3)`.

### Commit example

```
feat(api): admin archive feature endpoint (US-008 / T3 / FR-FEAT-001)
```

---

## T4 — Mutation hook

### Metadata

- **Effort**: 0.5h
- **AC covered**: AC-4 (cache invalidate).
- **Deps**: T3.

### Goal

`useArchiveFeature(projectSlug, featureSlug)` hook in `apps/web/src/queries/projects.ts`.

### TDD cycle

#### Red

`apps/web/tests/queries/archive-feature.test.tsx` (new): mock POST → useArchiveFeature.mutate → assert invalidate được call cho `projectKeys.byId(projectSlug)` + `projectKeys.feature(projectSlug, featureSlug)`.

#### Green

Mirror `useArchiveProject`:

```ts
export function useArchiveFeature(
  projectSlug: string,
  featureSlug: string,
): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>(`/projects/${projectSlug}/features/${featureSlug}/archive`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(projectSlug) });
      qc.invalidateQueries({ queryKey: projectKeys.feature(projectSlug, featureSlug) });
    },
  });
}
```

#### Refactor

- N/A.

### DoD checklist

- [ ] Hook test green.
- [ ] `pnpm typecheck` xanh.
- [ ] Commit `feat(web): useArchiveFeature mutation hook (US-008 / T4)`.

### Commit example

```
feat(web): useArchiveFeature mutation hook (US-008 / T4)
```

---

## T5 — FE component wire

### Metadata

- **Effort**: 1.5h
- **AC covered**: AC-1 (admin sees ⋯), AC-2 (menu opens), AC-3 (confirm cancel), AC-7 (author không thấy).
- **Deps**: T4.

### Goal

`FeatureActionsMenu` component + overlay vào FeatureCard với admin/chevron split per BUG-004.

### TDD cycle

#### Red

- `apps/web/tests/components/FeatureActionsMenu.test.tsx` (new): trigger render, menu open shows "Lưu trữ feature", confirm cancel = no POST, confirm OK = POST + toast + invalidate.
- `apps/web/tests/components/FeatureCard.test.tsx` (new): admin role → ⋯ visible, chevron absent; author → ⋯ absent, chevron visible. (Cùng contract như BUG-004 `ProjectCard.test.tsx`.)

#### Green

- `apps/web/src/components/features/FeatureActionsMenu.tsx` (new): clone `ProjectActionsMenu.tsx` shape, 1 item only, props `{ projectSlug, feature: { slug, title } }`.
- `apps/web/src/components/features/FeatureCard.tsx`: add `useMe()` role check, conditional overlay (`absolute right-2 top-2 z-10` + stopPropagation), hide `ChevronRight` khi admin.

#### Refactor

- Extract confirm copy if shared format with ProjectActionsMenu? Defer — strings have different nouns (project vs feature).

### DoD checklist

- [ ] FeatureActionsMenu + FeatureCard tests green.
- [ ] Full `pnpm --filter @onboarding/web test` xanh (134+ tests).
- [ ] Commit `feat(web): FeatureActionsMenu + archive overlay on FeatureCard (US-008 / T5)`.

### Commit example

```
feat(web): FeatureActionsMenu + admin overlay on FeatureCard (US-008 / T5)
```

---

## T6 — E2E + progress sync

### Metadata

- **Effort**: 1h
- **AC covered**: AC-1, AC-4, AC-5 (end-to-end happy path).
- **Deps**: T5.

### Goal

Playwright E2E happy path + progress-sync commit covering markers files.

### TDD cycle

#### Red

`e2e/us-008.spec.ts` (new):

- Login admin → tạo project + feature (or use seed) → navigate `/projects/:slug` → click ⋯ trên FeatureCard → click "Lưu trữ feature" → accept confirm → assert feature card disappears → navigate direct `/projects/:slug/features/:fSlug` → assert 404 page.

#### Green

Run + verify pass. No additional production code expected.

#### Refactor

- Move repeated login + factory logic to e2e helpers if duplicate >2x.

### DoD checklist

- [ ] `pnpm test:e2e e2e/us-008.spec.ts` green.
- [ ] Progress sync commit covers: README.md, .specs/roadmap.md, US-008/tasks.md (DoD flips), traceability.md, api-surface.md, design-system.md CHANGELOG.
- [ ] Commit `test(e2e): US-008 archive feature flow + progress sync (US-008 / T6)`.

### Commit example

```
test(e2e): US-008 archive feature flow + progress sync (US-008 / T6)
```
