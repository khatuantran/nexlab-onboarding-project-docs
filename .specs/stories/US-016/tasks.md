# US-016 — Task Breakdown

_Story_: [US-016](../US-016.md). Effort ~2h.

| #   | Title                                                                        | Effort | AC     | Status     |
| --- | ---------------------------------------------------------------------------- | ------ | ------ | ---------- |
| T1  | Shared `RecentProjectItem` + repo `getRecentProjectsForUser` + route + tests | 1.5h   | 1-4, 6 | ✅ shipped |
| T2  | FE `RecentProjectsCard` + tests                                              | 0.5h   | 5      | ✅ shipped |

## T1 — BE

- Shared: add `interface RecentProjectItem { slug: string; name: string; lastTouchedAt: string; sectionsTouched: number }` in stats.ts.
- `userStatsRepo.getRecentProjectsForUser(userId, limit)` — single SQL:
  ```sql
  SELECT p.slug, p.name, MAX(s.updated_at) AS last_touched_at, COUNT(s.id) AS sections_touched
  FROM sections s
  INNER JOIN features f ON f.id = s.feature_id
  INNER JOIN projects p ON p.id = f.project_id
  WHERE s.updated_by = $1 AND f.archived_at IS NULL AND p.archived_at IS NULL
  GROUP BY p.slug, p.name
  ORDER BY last_touched_at DESC
  LIMIT $2;
  ```
- Route: extend `me.ts` with `GET /recent-projects` parsing `limit` Zod query (`z.coerce.number().int().min(1).max(20).default(4)`).
- Tests: repo (4 cases) + integration (200/401/limit clamp).

## T2 — FE

- `useMyRecentProjects(limit = 4)` in `apps/web/src/queries/stats.ts`.
- `ProfilePage.tsx` `RecentProjectsCard`: drop `RECENT_PROJECTS` literal; loop over hook data; row shows `name` + `formatRelativeVi(lastTouchedAt)` + small `sectionsTouched` badge; link to `/projects/:slug`. Drop `pct` progress bar.
- Empty state row when `data.length === 0`.
- Test extends `ProfilePage.test.tsx` with mock list + zero state.
