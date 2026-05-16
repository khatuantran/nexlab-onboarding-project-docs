# US-012 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-012 — Edit feature metadata](../US-012.md)
_Total estimate_: ~3-4h (solo, TDD pace)
_Last updated_: 2026-05-16

---

## Conventions

- **TDD**: failing test trước. Red → green → refactor.
- **Commit format**: `type(scope): subject (US-012 / T<N>)`.
- **DoD**: tests passing, lint + typecheck green, AC có automated coverage, commit landed.
- **Order**: T1 → T2 → T3 sequential.
- **Pattern reuse**: clone US-004 `EditProjectDialog` (`apps/web/src/components/projects/EditProjectDialog.tsx`), `updateProjectRequestSchema`, `projectRepo.updateMetadata`.

---

## Task Summary

| #                                           | Title                                                       | Effort | AC covered  | FR touched | UI spec                          | Status     |
| ------------------------------------------- | ----------------------------------------------------------- | ------ | ----------- | ---------- | -------------------------------- | ---------- |
| [T1](#t1--shared-schema--featurerepoupdate) | Shared `updateFeatureRequestSchema` + `featureRepo.update`  | 1h     | AC-1..5     | FEAT-001   | —                                | ✅ shipped |
| [T2](#t2--patch-route-extend)               | `PATCH /projects/:slug/features/:featureSlug` route + tests | 1h     | AC-1..7     | FEAT-001   | —                                | ✅ shipped |
| [T3](#t3--editfeaturedialog-fe)             | FE dialog + menu item + mutation hook + tests               | 1.5-2h | AC-8, 9, 10 | —          | project-landing / feature-detail | ✅ shipped |

---

## T1 — Shared schema + featureRepo.update

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered (US-012)**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Deps**: none
- **Parallel**: no — blocker for T2.

### Goal

Shared schema có `updateFeatureRequestSchema` (≥ 1 key required) + featureRepo có method `update(projectId, oldSlug, patch)` thay đổi atomically.

### TDD cycle

**Red**:

- `packages/shared/src/schemas/feature.test.ts`: assert empty obj reject với refine message; partial OK; trailing keys stripped.
- `apps/api/tests/repos/featureRepo.update.test.ts`: 4 cases (title only / slug only / both / slug conflict → throws).

**Green**:

- `packages/shared/src/schemas/feature.ts`:
  ```ts
  export const updateFeatureRequestSchema = z
    .object({
      title: z.string().min(1).max(160).optional(),
      slug: slugSchema.optional(),
    })
    .refine((v) => v.title !== undefined || v.slug !== undefined, {
      message: "Cần ít nhất 1 trường",
    });
  export type UpdateFeatureRequest = z.infer<typeof updateFeatureRequestSchema>;
  ```
- `apps/api/src/repos/featureRepo.ts`: add `update(projectId, oldSlug, patch): Promise<Feature | null>` — UPDATE row + bump `updated_at`; catch unique violation → throw `FeatureSlugConflictError`.

### DoD checklist

- [x] `pnpm --filter @onboarding/shared test` xanh.
- [x] `pnpm --filter @onboarding/api test repos/featureRepo.update` xanh.
- [x] AC-4 (empty body refine) test asserts message.
- [x] AC-5 (slug conflict) test asserts `FeatureSlugConflictError` thrown.
- [x] Commit `feat(shared,api): updateFeatureRequestSchema + featureRepo.update (US-012 / T1)`.

### Commit example

```
feat(shared,api): updateFeatureRequestSchema + featureRepo.update (US-012 / T1 / FR-FEAT-001)
```

---

## T2 — PATCH route extend

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-FEAT-001](../../02-requirements.md#fr-feat-001--feature-crud-within-project)
- **AC covered**: AC-1, AC-2, AC-3, AC-6, AC-7 (+ AC-5 via repo)
- **Deps**: T1
- **Parallel**: no

### Goal

`PATCH /api/v1/projects/:slug/features/:featureSlug` route admin-only nhận `{ title?, slug? }` → 200 / 404 / 409 / 403 / 400 đúng map.

### TDD cycle

**Red**:

- `apps/api/tests/routes/features.patch.test.ts` cover AC-1, AC-2, AC-3, AC-5, AC-6, AC-7 + 400 empty.

**Green**:

- `apps/api/src/routes/features.ts`:
  - Add `patch` handler dùng `featureRepo.update`.
  - Mount: `router.patch('/:featureSlug', requireAuth, requireAdmin, zodValidate({ params: getParams, body: updateFeatureRequestSchema }), patch)`.
  - Catch `FeatureSlugConflictError` → 409 `FEATURE_SLUG_TAKEN`.
- Refresh contributors qua `projectRepo.getContributorsForFeature` trong response.

### DoD checklist

- [x] `pnpm --filter @onboarding/api test routes/features.patch` xanh.
- [x] AC-1, AC-2, AC-3, AC-5, AC-6, AC-7 covered.
- [x] `.specs/api-surface.md` thêm row PATCH feature.
- [x] `.specs/error-codes.md` confirm FEATURE_SLUG_TAKEN row (already exists).
- [x] Commit `feat(api): PATCH feature title/slug (US-012 / T2)`.

### Commit example

```
feat(api): PATCH /projects/:slug/features/:featureSlug accept title + slug (US-012 / T2 / FR-FEAT-001)
```

---

## T3 — EditFeatureDialog FE

### Metadata

- **Effort**: 1.5-2h
- **FR covered**: —
- **AC covered**: AC-8, AC-9, AC-10
- **Deps**: T2 (PATCH live)
- **Parallel**: no

### Goal

`FeatureActionsMenu` có 2 item; `EditFeatureDialog` mở qua "Sửa feature", submit calls `useUpdateFeature` mutation, success → toast + invalidate + navigate on slug change.

### TDD cycle

**Red**:

- `apps/web/tests/components/EditFeatureDialog.test.tsx`: open dialog → type title → submit → assert PATCH body + dialog close + toast.
- `apps/web/tests/components/FeatureActionsMenu.test.tsx`: admin role → 2 menu item; author role → menu hidden (existing assertion).
- `apps/web/tests/pages/FeatureDetailPage.slug-rename.test.tsx` (optional or in existing file): slug rename → navigate.

**Green**:

- `apps/web/src/components/features/EditFeatureDialog.tsx`: clone EditProjectDialog skeleton; 2 input + form state + onSubmit.
- `apps/web/src/queries/projects.ts`: `useUpdateFeature(projectSlug, featureSlug)` returning mutation. onSuccess invalidates `["projects", projectSlug]` + sets cache for new slug; caller navigates qua callback (avoid coupling hook + router).
- `FeatureActionsMenu.tsx`: import `Pencil` icon, add menu item "Sửa feature" gated `useMe().data.user.role === 'admin'`. Wire `editOpen` state + `<EditFeatureDialog />`.
- Caller (`FeatureCard` and/or `FeatureDetailPage`) passes navigate callback on slug change.

### DoD checklist

- [x] `pnpm --filter @onboarding/web test` xanh full suite.
- [x] AC-8, 9, 10 covered.
- [x] UI spec `.specs/ui/project-landing.md` + `.specs/ui/feature-detail.md` note v4.8 overflow menu 2-item.
- [x] Commit `feat(web): EditFeatureDialog + menu item (US-012 / T3)`.

### Commit example

```
feat(web): EditFeatureDialog 2-field + FeatureActionsMenu admin item (US-012 / T3)
```
