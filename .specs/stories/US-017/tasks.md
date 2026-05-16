# US-017 — Task Breakdown

_Story_: [US-017](../US-017.md). Effort ~4h.

| #   | Title                                                           | Effort | AC   | Status     |
| --- | --------------------------------------------------------------- | ------ | ---- | ---------- |
| T1  | Shared `ActivityItem` + `ActivityPage` types + cursor schema    | 0.5h   | 1, 3 | ✅ shipped |
| T2  | BE repo `getActivityForUser` + route + cursor + tests           | 2h     | 1-7  | ✅ shipped |
| T3  | FE ProfilePage `ActivityFeedCard` + ActivityRail drawer + tests | 1.5h   | 8-9  | ✅ shipped |

## T1 — Shared types

- Extend `packages/shared/src/schemas/stats.ts` with:
  ```ts
  export interface ActivityItem {
    id: string;
    sectionType: SectionType;
    featureSlug: string;
    featureTitle: string;
    projectSlug: string;
    projectName: string;
    updatedAt: string;
    verbCode: "updated";
  }
  export interface ActivityPage {
    items: ActivityItem[];
    nextCursor: string | null;
  }
  export const activityQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().datetime().optional(),
  });
  ```

## T2 — BE

- `userStatsRepo.getActivityForUser(userId, { limit, cursor })`:
  ```sql
  SELECT s.id, s.type, s.updated_at,
         f.slug AS feature_slug, f.title AS feature_title,
         p.slug AS project_slug, p.name AS project_name
  FROM sections s
  INNER JOIN features f ON f.id = s.feature_id AND f.archived_at IS NULL
  INNER JOIN projects p ON p.id = f.project_id AND p.archived_at IS NULL
  WHERE s.updated_by = $1 AND ($cursor IS NULL OR s.updated_at < $cursor)
  ORDER BY s.updated_at DESC
  LIMIT $limit + 1;
  ```
  If rows.length > limit pop last + set nextCursor = popped.updatedAt.
- Route handler in `me.ts`: `router.get('/activity', requireAuth, zodValidate({ query: activityQuerySchema }), handler)`.
- Tests: 5 repo cases + integration (200 / cursor flow / 401 / 400 limit out-of-range).

## T3 — FE

- `useMyActivity()` in `apps/web/src/queries/activity.ts` (NEW). Returns first page only (no infinite query v1).
- `useFeatureActivityFromSections(sections)` — pure helper, no fetch; sorts + transforms `SectionResponse[]` → `FeatureActivityRow[]` for drawer.
- `ProfilePage.tsx` `ActivityFeedCard`: drop `ACTIVITY` literal; loop hook data; verb display = "cập nhật"; target = `featureTitle` clickable link to `/projects/:projectSlug/features/:featureSlug`.
- `ActivityRail.tsx`: replace `onClick={toast}` with `setDrawerOpen(true)`. Drawer (`Sheet`) shows all 5 sections sorted by `updated_at` desc. Drawer title "Toàn bộ hoạt động — <featureTitle>". Footer hint "Lịch sử chi tiết hơn sẽ ra mắt sau."
- Tests: ProfilePage adds 2 cases (rows + empty); ActivityRail adds 2 (drawer open + 5 rows visible).
