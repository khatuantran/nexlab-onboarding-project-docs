# US-010 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-010 — Profile enrichment](../US-010.md)
_Total estimate_: ~3-4h (solo, TDD pace)
_Last updated_: 2026-05-16

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor.
- **Commit format**: `type(scope): subject (US-010 / T<N>)`.
- **DoD**: tests passing, lint + typecheck green, AC có automated coverage, commit landed.
- **Order**: T1 → T2 → T3 → T4 sequential.
- **Reuse-heavy**: clone US-009 pattern. Reference: [me.ts](../../../apps/api/src/routes/me.ts), [userRepo.ts](../../../apps/api/src/db/repos/userRepo.ts), [EditProfileDialog.tsx](../../../apps/web/src/components/profile/EditProfileDialog.tsx).

---

## Task Summary

| #                                     | Title                                              | Effort | AC covered                   | FR touched | UI spec | Status     |
| ------------------------------------- | -------------------------------------------------- | ------ | ---------------------------- | ---------- | ------- | ---------- |
| [T1](#t1--migration--shared-schemas)  | Migration `0010` + shared `AuthUser` + Zod extend  | 0.5h   | prereq                       | USER-003   | —       | ✅ shipped |
| [T2](#t2--patchme-route-extend)       | `PATCH /me` accept 4 new fields + tests            | 1h     | AC-2, AC-3, AC-4, AC-5, AC-6 | USER-003   | —       | ✅ shipped |
| [T3](#t3--personalinfocard-real-data) | FE `PersonalInfoCard` reads real fields + empty UX | 0.5h   | AC-1, AC-7, AC-8             | —          | profile | ✅ shipped |
| [T4](#t4--editprofiledialog-extend)   | FE `EditProfileDialog` 4-input form + test         | 1h     | AC-9                         | —          | profile | ✅ shipped |

---

## T1 — Migration + shared schemas

**Goal**: schema thay đổi và shared Zod schemas extend trước khi route đụng.

### Subtasks

1. Migration `apps/api/src/db/migrations/0010_users_profile_enrichment.sql`:
   ```sql
   ALTER TABLE users ADD COLUMN phone TEXT;
   ALTER TABLE users ADD COLUMN department TEXT;
   ALTER TABLE users ADD COLUMN location TEXT;
   ALTER TABLE users ADD COLUMN bio TEXT;
   ```
2. Update `apps/api/src/db/schema.ts` `users` table — 4 nullable text cột mới.
3. Update `packages/shared/src/schemas/auth.ts`:
   - `authUserSchema` thêm 4 field `.nullable().optional()` cho serialized response.
   - `updateProfileSchema` thêm 4 field optional với:
     - `phone: z.string().regex(/^[0-9 +\-()]{1,30}$/).nullable().optional()`
     - `department: z.string().min(1).max(120).nullable().optional()`
     - `location: z.string().min(1).max(120).nullable().optional()`
     - `bio: z.string().max(500).nullable().optional()`
   - Behavior: missing key = leave unchanged; explicit `null` = clear.

### DoD checklist

- [x] `pnpm db:generate` không sinh diff (manual SQL match Drizzle infer).
- [x] `pnpm --filter @onboarding/shared test` xanh với 4 field round-trip + regex reject.
- [x] No TS error trong shared / api / web sau extend.

---

## T2 — PATCH /me route extend

**Goal**: route `PATCH /me` accept 4 field optional, persist qua repo, return AuthUser.

### Subtasks

1. Update `apps/api/src/db/repos/userRepo.ts` `updateProfile(id, patch)`:
   - Accept `phone?, department?, location?, bio?` (cùng kiểu `string | null | undefined`).
   - SQL builds `SET` clause với những key explicitly present (not undefined). `null` → `SET col = NULL`; missing → skip.
   - Return full user row.
2. Update `apps/api/src/routes/me.ts` `PATCH /me` handler:
   - Parse body qua updated `updateProfileSchema`.
   - Pass 4 field qua `userRepo.updateProfile`.
   - Response shape unchanged: `{ data: AuthUser }`.
3. Tests trong `apps/api/tests/integration/me.patch.test.ts`:
   - AC-2: 4-field happy patch.
   - AC-3: partial update preserves other 3.
   - AC-4: explicit null clears.
   - AC-5: invalid phone → 400 VALIDATION_ERROR.
   - AC-6: bio > 500 → 400.

### DoD checklist

- [x] `pnpm --filter @onboarding/api test integration/me.patch` xanh.
- [x] AC-2..AC-6 đều có 1+ test case.
- [x] Commit `feat(api): extend PATCH /me with phone/department/location/bio (US-010 / T1-T2)`.

---

## T3 — PersonalInfoCard real data

**Goal**: FE đọc 4 field real từ `useMe()` response thay vì hardcoded.

### Subtasks

1. Update `apps/web/src/pages/ProfilePage.tsx` `PersonalInfoCard`:
   - Drop hardcoded `"0901 234 567"`, `"Product · BA Team"`, `"TP. Hồ Chí Minh"`.
   - Read `user.phone / department / location` từ `useMe().data.user`.
   - Empty value (null hoặc empty string) → render dash `—` với class `italic text-muted-foreground` + text `"Chưa cập nhật"`.
2. Bio optional render: nếu `user.bio` không null → hiển thị dưới h1 Hồ sơ trong profile card; nếu null → skip.
3. Tests `apps/web/tests/pages/ProfilePage.test.tsx`:
   - AC-7: mock `/auth/me` với 3 field non-null → assert visible.
   - AC-8: mock với 3 field null → assert "Chưa cập nhật" appears 3x.

### DoD checklist

- [x] `pnpm --filter @onboarding/web test pages/ProfilePage` xanh.
- [x] AC-1 (response shape) implicit via AC-7 test.
- [x] Commit `feat(web): PersonalInfoCard reads real phone/department/location (US-010 / T3)`.

---

## T4 — EditProfileDialog extend

**Goal**: dialog `Cập nhật hồ sơ` extend 4 input field + form state + submit.

### Subtasks

1. Update `apps/web/src/components/profile/EditProfileDialog.tsx` (or wherever it lives — may be inline in ProfilePage.tsx):
   - Form state extends 4 field, prefilled từ `user.phone / department / location / bio`.
   - 5 input rows stacked vertical: Tên hiển thị (existing) / Điện thoại / Phòng ban / Địa chỉ / Bio (textarea 3 row, optional `maxLength=500`).
   - Submit: pass all 5 field qua `useUpdateMyProfile.mutate()`.
   - Empty input → submit as `null` (explicit clear) only if user actually cleared a previously-set value; if always-empty → submit as missing key (leave untouched).
   - Validate: phone regex client-side mirror server; bio max 500.
2. Tests:
   - AC-9: open dialog → type Phone "0912345678" → click Lưu → assert PATCH body contains phone → assert dialog closes + toast.

### DoD checklist

- [x] `pnpm --filter @onboarding/web test` xanh full suite.
- [x] AC-9 covered.
- [x] UI spec `.specs/ui/profile.md` extend v4.7 note (EditProfileDialog 4-field).
- [x] Commit `feat(web): EditProfileDialog 4-field form (US-010 / T4)`.
