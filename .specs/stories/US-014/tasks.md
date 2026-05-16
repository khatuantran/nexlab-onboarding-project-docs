# US-014 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-014 — Workspace stats](../US-014.md)
_Total estimate_: ~4h
_Last updated_: 2026-05-16

---

## Task Summary

| #                                                 | Title                                                                                                | Effort | AC covered | Status     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ---------- | ---------- |
| [T1](#t1--be-workspace-stats--filledsectioncount) | Repo aggregation + `GET /workspace/stats` route + `ProjectSummary.filledSectionCount` extend + tests | 2.5h   | AC-1..6    | ✅ shipped |
| [T2](#t2--fe-home-3-tile-hero--filter)            | HomePage hero 3-tile + Đủ doc filter rewrite + tests                                                 | 1h     | AC-7..9    | ✅ shipped |
| [T3](#t3--shared-types)                           | `WorkspaceStats` shared type; `ProjectSummary` extend                                                | 0.5h   | AC-1, AC-6 | ✅ shipped |

## T3 — Shared types (foundation, do first)

- **Effort**: 0.5h. **AC**: 1, 6. **Deps**: none.
- Add `WorkspaceStats` interface to `packages/shared/src/schemas/stats.ts` (NEW) and re-export from index.
- Extend `ProjectSummary` in [packages/shared/src/schemas/project.ts](../../../packages/shared/src/schemas/project.ts) with `filledSectionCount: number`.
- **DoD**: `pnpm --filter @onboarding/shared test` green; typecheck workspace.

## T1 — BE workspace stats + filledSectionCount

- **Effort**: 2.5h. **AC**: 1-6. **Deps**: T3.
- `projectRepo.getWorkspaceStats(activeWindowDays = 30)` returning the 3 counts via 3 small SQL queries (acceptable v1; consider single CTE later).
- `projectRepo.listNonArchived` extend select with `filledSectionCount` via LEFT JOIN sections → COUNT(...) FILTER (WHERE length(body) > 0). Update `ProjectSummaryRow` type.
- New route `apps/api/src/routes/workspace.ts` with `GET /stats` handler; mount in `apps/api/src/app.ts` at `/api/v1/workspace`.
- Tests:
  - `apps/api/tests/repos/projectRepo.workspaceStats.test.ts` — 5 cases.
  - `apps/api/tests/routes/workspace-stats.test.ts` — 200 + 401.
- Update `apps/api/tests/routes/projects-list.test.ts` shape assertion + extend mock projects in web test fixtures to include `filledSectionCount: 0`.
- **DoD**: api test ≥ 245 green; commit `feat(api): GET /workspace/stats + ProjectSummary.filledSectionCount (US-014 / T1)`.

## T2 — FE Home 3-tile hero + filter

- **Effort**: 1h. **AC**: 7-9. **Deps**: T1.
- `apps/web/src/queries/stats.ts` (NEW): `useWorkspaceStats()` hook → react-query `/workspace/stats`.
- `apps/web/src/pages/HomePage.tsx`:
  - Drop `<StatTile icon={Clock} value="2.3h" label="Onboard TB" />`.
  - Change `Contributors` value from hardcoded `"8"` → `stats?.contributorsActive ?? "—"`; same for Projects/Đủ tài liệu.
  - Hero grid → `grid-cols-1 sm:grid-cols-3`.
  - Filter `"doc"` predicate → `p.filledSectionCount === p.featureCount * 5 && p.featureCount > 0`.
- Test: `apps/web/tests/pages/HomePage.test.tsx` add 2 cases: tiles render 3 real values; "Đủ doc" chip filter.
- **DoD**: web test ≥ 170 green; commit `feat(web): HomePage 3-tile hero + Đủ doc filter (US-014 / T2)`.
