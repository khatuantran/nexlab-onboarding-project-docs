# US-015 — Task Breakdown

_Story_: [US-015 — /me/stats](../US-015.md). Effort ~2h.

| #   | Title                                                          | Effort | AC  | Status     |
| --- | -------------------------------------------------------------- | ------ | --- | ---------- |
| T1  | Shared `MeStats` type + repo `getStatsForUser` + route + tests | 1.5h   | 1-6 | ✅ shipped |
| T2  | FE Profile StatsCard reads `useMeStats()` + tests              | 0.5h   | 7   | ✅ shipped |

## T1 — BE

- `packages/shared/src/schemas/stats.ts` extend with `interface MeStats { projectsTouched: number; featuresDocumented: number; totalEdits: number; sectionsCompleted: number }`.
- New `apps/api/src/repos/userStatsRepo.ts` (`getStatsForUser(userId)`); or fold into `userRepo`. 3 small SQL queries; rely on existing `sections`+`features` join with `archived_at` filters.
- Mount handler in `apps/api/src/routes/me.ts` (`router.get('/stats', requireAuth, handler)`).
- Tests: `apps/api/tests/repos/userStatsRepo.test.ts` (5 cases), `apps/api/tests/routes/me-stats.test.ts` (200/401).

## T2 — FE

- Add `useMeStats` to `apps/web/src/queries/stats.ts`.
- Update `ProfilePage.tsx` `StatsCard` to consume the hook; replace `STATS` literal `v` strings with `meStats.X`. Loading: render `—`.
- Test: `apps/web/tests/pages/ProfilePage.test.tsx` add 2 cases (real values + zero state).
