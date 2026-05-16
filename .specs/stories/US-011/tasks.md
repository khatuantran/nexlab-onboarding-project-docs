# US-011 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-011 — Real contributors derivation](../US-011.md)
_Total estimate_: ~5-7h (solo, TDD pace)
_Last updated_: 2026-05-16

---

## Conventions

- **TDD**: failing test first, commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-011 / T<N>)`.
- **DoD**: tests passing, lint + typecheck green, AC có automated coverage.
- **Order**: T1 → T2 → T3 → T4 → T5 sequential. T4 + T5 đều FE, có thể song song nếu BE đã ship.

---

## Task Summary

| #                                           | Title                                                                     | Effort | AC covered    | FR touched | UI spec                         | Status     |
| ------------------------------------------- | ------------------------------------------------------------------------- | ------ | ------------- | ---------- | ------------------------------- | ---------- |
| [T1](#t1--shared-contributorsummary--types) | Shared `ContributorSummary` schema + extend project shapes                | 0.5h   | prereq        | PROJ-003   | —                               | 🟡 Planned |
| [T2](#t2--repo-aggregation-queries)         | Repo `getContributorsForProject/Feature` + batched variant                | 2h     | AC-1..5, AC-9 | PROJ-003   | —                               | 🟡 Planned |
| [T3](#t3--route-augmentation)               | Routes `/projects` + `/projects/:slug` + `/features/...` augment response | 1h     | AC-1..5       | PROJ-003   | —                               | 🟡 Planned |
| [T4](#t4--projectcard--featurecard-wire)    | FE `ProjectCard` + `FeatureCard` read real contributors                   | 1h     | AC-6, AC-7    | —          | home, project-landing           | 🟡 Planned |
| [T5](#t5--projecthero--activityrail-wire)   | FE `ProjectHero` + `ActivityRail` drop hardcoded data                     | 1h     | AC-7, AC-8    | —          | project-landing, feature-detail | 🟡 Planned |

---

## T1 — Shared `ContributorSummary` + types

**Goal**: shared Zod schema + extend project/feature response shapes.

### Subtasks

1. `packages/shared/src/schemas/projects.ts`:
   - Add `contributorSummarySchema = z.object({ userId: z.string().uuid(), displayName: z.string(), avatarUrl: z.string().nullable(), lastUpdatedAt: z.string() })`.
   - Extend `projectSummarySchema` + `projectResponseSchema` + `featureResponseSchema` với `contributors: z.array(contributorSummarySchema).max(5).default([])`.
2. Export `ContributorSummary` TS type.
3. Test: parse round-trip happy + reject when not array.

### DoD

- [ ] `pnpm --filter @onboarding/shared test` xanh.
- [ ] Commit `feat(shared): ContributorSummary schema + project/feature extend (US-011 / T1)`.

---

## T2 — Repo aggregation queries

**Goal**: efficient SQL to derive top-5 contributors per scope.

### Subtasks

1. `apps/api/src/db/repos/projectRepo.ts`:
   - `getContributorsForProject(projectId, limit=5)`: SQL:
     ```sql
     WITH ranked AS (
       SELECT DISTINCT ON (s.updated_by)
         s.updated_by AS user_id, MAX(s.updated_at) AS last_updated_at
       FROM sections s
       JOIN features f ON s.feature_id = f.id
       WHERE f.project_id = $1 AND f.archived_at IS NULL AND s.updated_by IS NOT NULL
       GROUP BY s.updated_by
     )
     SELECT u.id, u.display_name, u.avatar_url, r.last_updated_at
     FROM ranked r JOIN users u ON r.user_id = u.id
     ORDER BY r.last_updated_at DESC LIMIT $2;
     ```
   - `getContributorsForFeature(featureId, limit=5)`: similar, filter by `s.feature_id`.
   - `getContributorsForProjects(projectIds: string[], limit=5)`: batched variant for list endpoint — single query returns `{projectId, contributors}` map. Use `ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY last_updated_at DESC)` cap at `limit`.
2. Tests `apps/api/tests/unit/projectRepo.contributors.test.ts`:
   - AC-1: 3 editors sorted by recency.
   - AC-2: 7 editors → top 5.
   - AC-3: no edits → empty array.
   - AC-4: archived feature excluded from project scope.
   - AC-5: feature-scope isolation.

### DoD

- [ ] All 5 AC have a test case.
- [ ] `pnpm --filter @onboarding/api test unit/projectRepo` xanh.
- [ ] Commit `feat(api): contributor aggregation queries (US-011 / T2)`.

---

## T3 — Route augmentation

**Goal**: hook the repo queries into existing 3 read routes.

### Subtasks

1. `apps/api/src/routes/projects.ts`:
   - `GET /projects` handler: after fetching project list, gather `ids[]`, call `getContributorsForProjects(ids)`, merge into each row before response. Single batched query → AC-9 satisfied.
   - `GET /projects/:slug` handler: after fetching project + features, call `getContributorsForProject(project.id)`, attach to `data.project.contributors`.
2. `apps/api/src/routes/features.ts` (or `projects.ts` if feature read lives there): `GET /projects/:slug/features/:featureSlug` → call `getContributorsForFeature(feature.id)` → attach to `data.feature.contributors`.
3. Integration tests:
   - Extend `projects.list.test.ts` — assert `contributors` shape per row + N+1 audit (`SELECT count(*)` from `pg_stat_statements` or mock count via single test recorder).
   - Extend `projects.get.test.ts` — assert `data.project.contributors`.
   - Extend `features.get.test.ts` (or whichever covers feature read) — assert `data.feature.contributors`.

### DoD

- [ ] `pnpm --filter @onboarding/api test` xanh full suite.
- [ ] AC-9 covered explicitly (single-query batched or counted).
- [ ] Commit `feat(api): contributors aggregation on /projects + /features routes (US-011 / T3)`.

---

## T4 — ProjectCard + FeatureCard wire

**Goal**: drop hardcoded contributor arrays on grid cards.

### Subtasks

1. `apps/web/src/components/projects/ProjectCard.tsx`:
   - Remove `CONTRIBUTOR_POOL` const + `pickContributors` function.
   - Read `project.contributors` from props.
   - Map to AvatarStack input — if AvatarStack accepts `names: string[]`, pass `contributors.map(c => c.displayName)`; nếu accept `imageUrl` variant đã có sẵn, prefer image.
2. `apps/web/src/components/features/FeatureCard.tsx`:
   - Remove `const contributors = ["TM", "NL"]`.
   - Read `feature.contributors` from props. (Note: `FeatureListItem` schema may need `contributors` field added — covered by T1.)
3. Tests:
   - `ProjectCard.test.tsx`: mock `project.contributors = [{displayName: "Tester", ...}]` → assert AvatarStack renders initials "T".
   - Empty contributors → AvatarStack renders nothing (no fallback fake names).

### DoD

- [ ] `pnpm --filter @onboarding/web test components/ProjectCard components/FeatureCard` xanh.
- [ ] AC-6 + AC-7 covered.
- [ ] `.specs/ui/home.md` + `.specs/ui/project-landing.md` v4.7 note appended.
- [ ] Commit `feat(web): ProjectCard + FeatureCard read real contributors (US-011 / T4)`.

---

## T5 — ProjectHero + ActivityRail wire

**Goal**: drop hardcoded `["TM","NL","PT","HD"]` + `STATIC_PADDING`.

### Subtasks

1. `apps/web/src/components/projects/ProjectHero.tsx`:
   - Accept `contributors: ContributorSummary[]` prop.
   - Pass to AvatarStack instead of hardcoded array.
2. `apps/web/src/pages/ProjectLandingPage.tsx`:
   - Forward `project.contributors` từ API response to ProjectHero prop.
3. `apps/web/src/components/features/ActivityRail.tsx`:
   - Drop `STATIC_PADDING` const + its merge logic.
   - Render only real `sections.updated_*` projection (passed from FeatureDetailPage).
4. `apps/web/src/pages/FeatureDetailPage.tsx`: ensure ActivityRail call site already passes only real sections (probably does; verify).
5. Tests:
   - `ProjectLandingPage.test.tsx`: assert hero avatar stack reflects mocked contributors.
   - `ActivityRail.test.tsx`: assert no "Ngọc Linh" / "Phương Trâm" hardcoded strings present in DOM when sections list is short.

### DoD

- [ ] `pnpm --filter @onboarding/web test` xanh full suite.
- [ ] AC-7 + AC-8 covered.
- [ ] `.specs/ui/project-landing.md` + `.specs/ui/feature-detail.md` v4.7 note appended.
- [ ] Commit `feat(web): drop hardcoded contributors — ProjectHero + ActivityRail (US-011 / T5)`.
