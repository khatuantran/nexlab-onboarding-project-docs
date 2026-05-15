# US-009 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block) -->

_Story_: [US-009 — Self-service profile](../US-009.md)
_Total estimate_: ~7-9h (solo, TDD pace)
_Last updated_: 2026-05-15

---

## Conventions

- **TDD**: mỗi task bắt đầu bằng failing test. Red → green → refactor. Commit ở mỗi green.
- **Commit format**: `type(scope): subject (US-009 / T<N>)`.
- **DoD** cho mỗi task:
  1. Tests passing (`pnpm test` + task-specific file).
  2. `pnpm lint` + `pnpm typecheck` ở root xanh.
  3. AC liên quan trong [US-009](../US-009.md) đã có automated test coverage.
  4. Commit landed trên `main`.
- **Order**: tasks tuần tự — T<N+1> không start khi T<N> chưa DoD.
- **Reuse-heavy**: 70% pattern clone từ US-007 (admin user lifecycle) + CR-004 Phase 2 (Cloudinary). Reference: [users.ts](../../../apps/api/src/routes/users.ts), [cloudinary.ts](../../../apps/api/src/lib/cloudinary.ts), [sessionPurge.ts](../../../apps/api/src/lib/sessionPurge.ts).

---

## Task Summary

| #                                           | Title                                           | Effort | AC covered             | FR touched | UI spec                                    | Status     |
| ------------------------------------------- | ----------------------------------------------- | ------ | ---------------------- | ---------- | ------------------------------------------ | ---------- |
| [T1](#t1--migration--shared-schemas)        | Migration `avatar_url` + shared schemas extend  | 1h     | prereq                 | USER-003   | —                                          | 🟡 Planned |
| [T2](#t2--get--patch-me)                    | `GET /me` + `PATCH /me` + tests                 | 1.5h   | AC-2, AC-3, AC-10      | USER-003   | —                                          | 🟡 Planned |
| [T3](#t3--password--avatar-endpoints)       | `POST /me/password` + `POST /me/avatar` + tests | 2h     | AC-4, AC-5, AC-7..AC-9 | USER-003   | —                                          | 🟡 Planned |
| [T4](#t4--mutation-hooks--avatar-component) | 4 query hooks + Avatar imageUrl extend + tests  | 1h     | AC-3, AC-7             | —          | [design-system](../../ui/design-system.md) | 🟡 Planned |
| [T5](#t5--profilepage--usermenu-wire)       | ProfilePage + UserMenu link + tests             | 2h     | AC-1..AC-8             | —          | [profile.md](../../ui/profile.md)          | 🟡 Planned |
| [T6](#t6--e2e--progress-sync)               | Playwright E2E + progress sync                  | 1h     | AC-1, AC-3, AC-4, AC-7 | all        | —                                          | 🟡 Planned |

**Critical path**: T1 → T2 → T3 → T4 → T5 → T6.

---

## T1 — Migration + shared schemas

### Metadata

- **Effort**: 1h
- **FR covered**: [FR-USER-003](../../02-requirements.md#fr-user-003--self-service-profile-management)
- **Deps**: none.

### Goal

Add `users.avatar_url TEXT` nullable. Extend `AuthUser` shape với `avatarUrl: string | null`. Add `updateMyProfileSchema` + `changePasswordSchema`.

### TDD cycle

#### Red

- `packages/shared/tests/schemas/user.test.ts` (extend) — `updateMyProfileSchema` parses `{ displayName: "X" }`; rejects extras + empty.
- `apps/api/tests/db/users-avatar-column.test.ts` (new) — `SELECT avatar_url FROM users LIMIT 1` không lỗi cột.

#### Green

- Migration `apps/api/src/db/migrations/0009_users_avatar_url.sql`: `ALTER TABLE users ADD COLUMN avatar_url TEXT;`
- `apps/api/src/db/schema.ts`: `avatarUrl: text("avatar_url")` on users.
- `packages/shared/src/schemas/user.ts`: extend `AuthUser` interface, add 2 Zod schemas.

### DoD checklist

- [ ] Migration applied dev + test DB.
- [ ] Shared + api tests green.
- [ ] Commit `feat(api): users.avatar_url + self-profile shared schemas (US-009 / T1)`.

---

## T2 — GET + PATCH /me

### Metadata

- **Effort**: 1.5h
- **AC covered**: AC-2, AC-3, AC-10.
- **Deps**: T1.

### Goal

`GET /api/v1/me` returns full profile shape. `PATCH /api/v1/me` updates displayName via session userId (anti-IDOR).

### TDD cycle

#### Red

- `apps/api/tests/routes/me-get.test.ts` (new) — 200 happy + 401.
- `apps/api/tests/routes/me-patch.test.ts` (new) — 200 happy displayName change; 400 empty body; 401 no session; assert other-user row unchanged.

#### Green

- `apps/api/src/repos/userRepo.ts`: ensure `findAuthUserById` returns avatarUrl. Add `updateAvatarUrl(id, url)`.
- `apps/api/src/routes/me.ts` (new): `createMeRouter({ userRepo, requireAuth })` with `GET /` + `PATCH /` handlers (read `req.session.userId`).
- `apps/api/src/index.ts`: mount `/api/v1/me`.

### DoD checklist

- [ ] 2 test files green.
- [ ] `pnpm --filter @onboarding/api test` toàn package xanh.
- [ ] Commit `feat(api): GET/PATCH /me self-profile endpoints (US-009 / T2)`.

---

## T3 — Password + avatar endpoints

### Metadata

- **Effort**: 2h
- **AC covered**: AC-4, AC-5, AC-7, AC-8, AC-9.
- **Deps**: T2.

### Goal

`POST /me/password` + `POST /me/avatar` with full validation + session purge + Cloudinary upload.

### TDD cycle

#### Red

- `apps/api/tests/routes/me-password.test.ts` (new) — 204 happy + other sid destroyed + current sid stays; 401 wrong old; 400 short new.
- `apps/api/tests/routes/me-avatar.test.ts` (new, mirror uploads-create.test.ts) — 200 happy (FakeCloudinaryClient); 413 too large; 415 wrong mime; 503 disabled.
- `apps/api/tests/lib/sessionPurge.test.ts` (extend) — `purgeSessionsForUserExcept` keeps target sid.

#### Green

- `apps/api/src/lib/sessionPurge.ts`: add `purgeSessionsForUserExcept(redis, userId, exceptSid)`.
- `apps/api/src/routes/me.ts` extend:
  - `POST /password`: bcrypt.compare oldPassword → bcrypt.hash newPassword → updatePasswordHash → purgeOtherSessions.
  - `POST /avatar`: multer single ≤ 2 MB → file-type sniff → cloudinary.uploadImage({folder: avatars}) → updateAvatarUrl.
- Wire deps in `index.ts`: pass `cloudinary` + `redis` + `cloudinaryAvatarsFolder` into createMeRouter.

### DoD checklist

- [ ] 2 + 1 extend test file green.
- [ ] Manual smoke curl: 4 scenarios pass.
- [ ] Commit `feat(api): self password change + avatar upload (US-009 / T3)`.

---

## T4 — Mutation hooks + Avatar component

### Metadata

- **Effort**: 1h
- **AC covered**: AC-3 cache invalidate, AC-7 avatar render.
- **Deps**: T3.

### Goal

FE query hooks + Avatar component supports `imageUrl` prop.

### TDD cycle

#### Red

- `apps/web/tests/queries/me.test.tsx` (new) — 4 mutations invalidate `authKeys.me`.
- Extend `apps/web/tests/components/Avatar.test.tsx` (or create) — `imageUrl` renders `<img>`, no imageUrl renders initials.

#### Green

- `apps/web/src/queries/me.ts` (new): `useMyProfile` (alias `useMe` extended), `useUpdateMyProfile`, `useChangePassword`, `useUploadAvatar`.
- `apps/web/src/components/common/Avatar.tsx` extend: optional `imageUrl?: string | null` prop. Render `<img>` if present (with alt fallback name), else current initials gradient.

### DoD checklist

- [ ] Hook + component tests green.
- [ ] No regression in existing Avatar callers (ProjectActionsMenu, UserMenu, AvatarStack).
- [ ] Commit `feat(web): self-profile mutations + Avatar imageUrl (US-009 / T4)`.

---

## T5 — ProfilePage + UserMenu wire

### Metadata

- **Effort**: 2h
- **AC covered**: AC-1..AC-8 (UI happy paths + validation).
- **Deps**: T4.

### Goal

`/profile` page with 3 sections + UserMenu "Hồ sơ của tôi" link enabled.

### TDD cycle

#### Red

- `apps/web/tests/pages/ProfilePage.test.tsx` (new): render 5 fields, inline edit displayName happy, 3-field password form (validate mismatch + short pw + wrong old toast), avatar upload (mock URL response).
- `apps/web/tests/components/UserMenu.test.tsx` (new): "Hồ sơ của tôi" item NOT disabled, `<a href="/profile">` present.

#### Green

- `apps/web/src/pages/ProfilePage.tsx` (new): 3 section card (Profile / Security / Avatar) using shadcn primitives + sonner toast.
- `apps/web/src/routes/index.tsx`: add `<Route path="/profile" element={<ProfilePage/>} />`.
- `apps/web/src/components/layout/UserMenu.tsx`: replace disabled "Hồ sơ của tôi" with `DropdownMenuItem asChild → Link to="/profile"`; pass `imageUrl={user.avatarUrl}` into Avatar.
- `apps/web/src/lib/errorMessages.ts`: add password-change context for INVALID_CREDENTIALS.

### DoD checklist

- [ ] FE tests green (~155 total).
- [ ] `pnpm typecheck` + `pnpm lint` clean.
- [ ] Commit `feat(web): ProfilePage + UserMenu profile link (US-009 / T5)`.

---

## T6 — E2E + progress sync

### Metadata

- **Effort**: 1h
- **AC covered**: AC-1, AC-3, AC-4, AC-7 end-to-end.
- **Deps**: T5.

### Goal

Playwright happy path + progress sync commit across markers files.

### TDD cycle

#### Red

`e2e/us-009.spec.ts` (new):

- Login → click UserMenu trigger → click "Hồ sơ của tôi" → URL `/profile`.
- Edit displayName → save → reload → name persist + UserMenu trigger updated.
- Change password (correct old + valid new) → toast → reset back to old password via second mutation (cleanup for test re-runs).
- Upload `e2e/fixtures/avatar.png` (small 1x1 PNG) → toast → header avatar `<img src>` not empty.

#### Green

Run + verify pass. No production code expected unless E2E surfaces bug.

#### Refactor

- Helper for login factory if duplicate.

### DoD checklist

- [ ] `pnpm test:e2e e2e/us-009.spec.ts` green.
- [ ] Progress sync commit covers: README, .specs/roadmap.md, US-009/tasks.md DoD flips, traceability, api-surface, design-system CHANGELOG, releases CHANGELOG.
- [ ] Commit `test(e2e): US-009 profile flow + progress sync (US-009 / T6)`.
