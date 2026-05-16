# US-018 — Task Breakdown

_Story_: [US-018 — Profile skills CRUD](../US-018.md). Effort ~4-5h.

| #   | Title                                                                                 | Effort | AC       | Status     |
| --- | ------------------------------------------------------------------------------------- | ------ | -------- | ---------- |
| T1  | Migration 0012 + Drizzle `user_skills` + shared types/schema                          | 0.5h   | prereq   | ✅ shipped |
| T2  | BE `userSkillsRepo` + `GET/PUT /me/skills` + tests                                    | 1.5h   | AC-1..8  | ✅ shipped |
| T3  | FE `useMySkills`/`useUpdateMySkills` + `EditSkillsDialog` + `SkillsCard` wire + tests | 2.5h   | AC-9..12 | ✅ shipped |

## T1 — Migration + shared schema

- Migration `apps/api/src/db/migrations/0012_user_skills.sql`:
  ```sql
  CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX user_skills_user_label_uidx ON user_skills (user_id, lower(label));
  CREATE INDEX user_skills_user_idx ON user_skills (user_id, sort_order);
  ```
- Drizzle schema: `userSkills` table with `lower(label)` unique via `uniqueIndex().on(...sql\`lower(\${userSkills.label})\`)`.
- Journal `_journal.json` entry idx 12.
- `packages/shared/src/schemas/skills.ts` (NEW) exports `SkillColor` enum (7 values), `SkillItem` interface, `updateSkillsRequestSchema` with `.max(12)` + `.refine(skills => unique by lower(label))`.
- Re-export from `packages/shared/src/index.ts`.
- DoD: `pnpm --filter @onboarding/shared test` green (≥ 3 new cases); `APP_ENV=test pnpm db:migrate` applies 0012.

## T2 — BE repo + 2 endpoints

- `apps/api/src/repos/userSkillsRepo.ts`:
  - `getForUser(userId): Promise<SkillRow[]>` — SELECT ordered by sort_order.
  - `replaceAll(userId, skills): Promise<SkillRow[]>` — `db.transaction()`: DELETE existing + INSERT new with `sort_order = index`. Catch 23505 → throw `SkillsDuplicateError`.
- `apps/api/src/routes/me.ts` add 2 handlers + mount routes with `zodValidate({ body: updateSkillsRequestSchema })`.
- `apps/api/src/index.ts` wire `userSkillsRepo` into `createMeRouter`.
- Tests:
  - `apps/api/tests/repos/userSkillsRepo.test.ts` — 4 cases.
  - `apps/api/tests/routes/me-skills.test.ts` — 7 cases covering AC-1..8.
- Update existing 4 me-\* test files to inject `userSkillsRepo` via `createUserSkillsRepo(db)` (mirror pattern from S2 of Sprint 3).
- DoD: api test ≥ 257 green; commit `feat(shared,api): user_skills table + GET/PUT /me/skills (US-018 / T1-T2)`.

## T3 — FE dialog + SkillsCard wire

- `apps/web/src/queries/skills.ts` (NEW): `useMySkills()` (GET) + `useUpdateMySkills()` (PUT mutation invalidates `["skills","me"]`).
- `apps/web/src/components/profile/EditSkillsDialog.tsx` (NEW):
  - State: `rows: { label: string; color: SkillColor }[]` (omit sortOrder — computed on submit).
  - Render row list + per-row controls (up/down, remove X). "+ Thêm skill" appends `{label:"", color:"primary"}` (disabled when `rows.length >= 12`).
  - Submit: filter empty labels → client dedupe check → mutate.
- `apps/web/src/pages/ProfilePage.tsx` `SkillsCard`:
  - Drop SKILLS array.
  - Read `useMySkills().data ?? []`.
  - Render chips with `style` matching the 7 hue → hex map (shared with dialog).
  - "Thêm" outline-dashed button opens `<EditSkillsDialog />`.
- Tests:
  - Extend `apps/web/tests/pages/ProfilePage.test.tsx` — 2 cases (real chips + empty state).
  - New `apps/web/tests/components/EditSkillsDialog.test.tsx` — 3 cases (add row / cap 12 disables Add / submit body shape).
- DoD: web test ≥ 178 green; commit `feat(web): EditSkillsDialog + SkillsCard real chips (US-018 / T3)`.
