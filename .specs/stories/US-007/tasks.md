# US-007 — Task Breakdown

<!-- template: 03-task-template.md@0.2 (applied per-task block; doc-level Conventions/Summary additional_sections_allowed) -->

_Story_: [US-007 — Admin quản lý user hệ thống](../US-007.md)
_Total estimate_: ~14-18h (solo, TDD pace)
_Last updated_: 2026-05-15 (Draft — 0/7 tasks)

---

## Conventions

- **TDD**: failing test trước. Red → green → refactor.
- **Commit format**: `type(scope): subject (US-007 / T<N>)`.
- **DoD** mỗi task: tests passing, lint + typecheck green, AC liên quan có automated coverage, task commit landed.
- **Order**: T1 → T2 → T3 → T4 → T5 → T6 → T7. T6 (FE) phụ thuộc T2..T5 BE đã land.

---

## Task Summary

| #                                                      | Title                                               | Effort | AC covered        | FR                       | Layer | Status     |
| ------------------------------------------------------ | --------------------------------------------------- | ------ | ----------------- | ------------------------ | ----- | ---------- |
| [T1](#t1--migration--shared-schemas)                   | Migration archived_at + last_login_at + schemas     | 1.5h   | prereq AC-6       | USER-002                 | BE/DB | ✅ shipped |
| [T2](#t2--get-users-list-extend--get-usersid)          | GET /users list extend (status, lastLogin) + detail | 2.5h   | AC-1, AC-2        | USER-001 amend           | BE    | ✅ shipped |
| [T3](#t3--post-users-invite--temp-password)            | POST /users invite + temp password helper           | 2.5h   | AC-3, AC-4        | USER-002                 | BE    | ✅ shipped |
| [T4](#t4--patch-usersid--archive--login-gate)          | PATCH /users/:id + archive/unarchive + login gate   | 3h     | AC-5, AC-6, AC-8  | USER-002, AUTH-001 amend | BE    | ✅ shipped |
| [T5](#t5--reset-password-endpoint--session-invalidate) | POST /users/:id/reset-password + session purge      | 1.5h   | AC-7              | USER-002                 | BE    | ✅ shipped |
| [T6](#t6--admin-users-fe-page)                         | FE /admin/users page (table + filters + 3 dialogs)  | 4h     | AC-1..AC-7 UI     | all                      | FE    | ✅ shipped |
| [T7](#t7--e2e--progress-sync)                          | Playwright E2E + progress sync                      | 1h     | all AC end-to-end | all                      | test  | ✅ shipped |

**Critical path**: T1 → T2 → (T3 ‖ T4 ‖ T5) → T6 → T7.

---

## T1 — Migration + shared schemas

- **Effort**: 1.5h
- **FR covered**: [FR-USER-002](../../02-requirements.md#fr-user-002--admin-user-lifecycle)
- **AC covered**: prereq for AC-2, AC-6
- **Deps**: none
- **Parallel**: no

### Goal

Schema users có 2 column mới `archived_at` (timestamp, nullable) + `last_login_at` (timestamp, nullable). Shared `User` schema extend optional fields. Migration `0007_users_lifecycle.sql` runnable + idempotent.

### TDD cycle

**Red**: `apps/api/tests/db/users-lifecycle.test.ts` assert `pgClient.query("SELECT archived_at, last_login_at FROM users LIMIT 1")` không throw + return null. Chạy → fail vì column missing.

**Green**: Tạo `0007_users_lifecycle.sql`:

```sql
ALTER TABLE users ADD COLUMN archived_at timestamptz;
ALTER TABLE users ADD COLUMN last_login_at timestamptz;
CREATE INDEX users_archived_at_idx ON users (archived_at) WHERE archived_at IS NULL;
```

Update `apps/api/src/db/schema.ts` users table với 2 column. Update `packages/shared/src/schemas/user.ts` thêm optional `archivedAt`, `lastLoginAt` (only returned khi caller là admin).

### DoD checklist

- [ ] Migration apply clean trên fresh DB + existing DB (idempotent: `ALTER TABLE IF NOT EXISTS COLUMN` không support → ưu tiên migration version table track).
- [ ] Schema test pass.
- [ ] Shared schemas type-check.

### Commit example

`feat(api): add users.archived_at + last_login_at (US-007 / T1)`

---

## T2 — GET /users list extend + GET /users/:id

- **Effort**: 2.5h
- **FR covered**: FR-USER-001 amend
- **AC covered**: AC-1, AC-2
- **Deps**: T1
- **Parallel**: no

### Goal

`GET /api/v1/users` thêm query params `status=active|archived|all` (default active) + admin-only fields (email, archivedAt, lastLoginAt) khi caller là admin. `GET /api/v1/users/:id` mới — admin-only.

### TDD cycle

**Red**: Integration test `apps/api/tests/routes/users-list-admin.test.ts`:

- non-admin call `GET /users?status=archived` → 403.
- admin call → 200, response items có `email` + `archivedAt` + `lastLoginAt`.
- non-admin call default → 200, response items KHÔNG có `email`.

**Green**: Update `userRepo.listUsers` thêm filter status + select admin fields conditionally. Route nhận `req.user.role` → branch response shape. Detail route `GET /:id` admin gate.

### DoD checklist

- [ ] List + detail endpoints pass tests.
- [ ] FR-USER-001 amendment merged in `02-requirements.md` (added admin field gating).
- [ ] `api-surface.md` row updated.

### Commit example

`feat(api): admin list/detail user endpoints (US-007 / T2)`

---

## T3 — POST /users invite + temp password

- **Effort**: 2.5h
- **FR covered**: FR-USER-002
- **AC covered**: AC-3, AC-4
- **Deps**: T1
- **Parallel**: với T4 (sau T2 land).

### Goal

`POST /api/v1/users` admin-only. Body `{ email, displayName, role }`. BE sinh temp password 12-char alphanumeric (no I/l/0/O ambiguity), hash bcrypt cost 12, insert user, return `{ data: { user, tempPassword } }`. Email duplicate → 409 `USER_EMAIL_EXISTS`.

### TDD cycle

**Red**: `apps/api/tests/routes/users-create.test.ts` cover happy + duplicate + non-admin.

**Green**:

- `apps/api/src/lib/tempPassword.ts` — `generateTempPassword(): string` dùng `crypto.randomInt`.
- `userRepo.createUser({email, displayName, role, passwordHash})`.
- Route POST với Zod validate + admin gate.

### DoD checklist

- [ ] All 3 cases pass.
- [ ] `error-codes.md` row `USER_EMAIL_EXISTS` thêm.
- [ ] Audit log line `pino.info({event:"user.invited", actorId, newUserId, role})`.

### Commit example

`feat(api): admin invite user with temp password (US-007 / T3)`

---

## T4 — PATCH /users/:id + archive + login gate

- **Effort**: 3h
- **FR covered**: FR-USER-002, FR-AUTH-001 amend
- **AC covered**: AC-5, AC-6, AC-8
- **Deps**: T1
- **Parallel**: với T3, T5.

### Goal

3 endpoint mới:

- `PATCH /api/v1/users/:id` — body `{ displayName?, role? }` admin-only.
- `POST /api/v1/users/:id/archive` — set archived_at = NOW().
- `POST /api/v1/users/:id/unarchive` — set archived_at = NULL.

Self-protect: admin không đổi role / disable chính mình + last-admin guard (`countActiveAdmins() == 1` && target = admin → 409 `LAST_ADMIN_PROTECTED`).

Login flow amend: `POST /auth/login` reject với 403 `USER_DISABLED` khi `archived_at != NULL`. Session middleware refresh check `archived_at` mỗi request → khi user bị archive, request tiếp theo → 401 + destroy session.

### TDD cycle

**Red**: `apps/api/tests/routes/users-update.test.ts`:

- PATCH happy + self-target 409 + last-admin 409.
- archive flips archived_at; login sau đó → 403.
- unarchive flips về NULL; login pass.
- Middleware: session đang valid, archive user → next request 401.

**Green**: Implement endpoints + amend `requireAuth` middleware.

### DoD checklist

- [ ] All cases pass.
- [ ] Error codes `LAST_ADMIN_PROTECTED`, `CANNOT_MODIFY_SELF`, `USER_DISABLED` đăng ký trong `error-codes.md`.
- [ ] FR-AUTH-001 amended ("login reject if archived").
- [ ] Audit log per action.

### Commit example

`feat(api): user patch + archive lifecycle + login gate (US-007 / T4)`

---

## T5 — Reset password + session invalidate

- **Effort**: 1.5h
- **FR covered**: FR-USER-002
- **AC covered**: AC-7
- **Deps**: T1, T3 (reuse `generateTempPassword`).
- **Parallel**: với T4.

### Goal

`POST /api/v1/users/:id/reset-password` admin-only. Sinh temp password mới, update `password_hash`, flush Redis sessions của target user (pattern `sid:*` scan by userId stored in session data — or simpler: bump a `password_changed_at` field + middleware compare; pilot dùng scan approach OK).

### TDD cycle

**Red**: `apps/api/tests/routes/users-reset-password.test.ts`:

- admin reset → 200, response `{ data: { tempPassword } }`.
- user's existing session sau reset → 401 next request.
- target user login với new tempPassword → 200.

**Green**: Add `userRepo.updatePasswordHash` + reset route + sessionStore.purgeByUserId helper.

### DoD checklist

- [ ] All cases pass.
- [ ] Audit log line.

### Commit example

`feat(api): admin reset user password + invalidate sessions (US-007 / T5)`

---

## T6 — Admin /admin/users FE page

- **Effort**: 4h
- **FR covered**: all 3 FR (UI cover)
- **AC covered**: AC-1..AC-7 UI side
- **Deps**: T2..T5 (BE endpoints land).
- **Parallel**: no

### Goal

Trang `/admin/users` admin-only. Reuse Layout của HomePage. Components mới:

- `pages/AdminUsersPage.tsx` — main page với filter bar + table.
- `components/users/UsersTable.tsx` — table với 6 col + action menu.
- `components/users/InviteUserDialog.tsx` — invite form + temp password reveal modal.
- `components/users/EditUserDialog.tsx` — edit displayName + role.
- `components/users/ResetPasswordDialog.tsx` — confirm + reveal modal.
- `components/users/UserStatusBadge.tsx` — Active / Disabled pill.
- Hooks: `queries/users.ts` thêm `useInviteUser`, `useUpdateUser`, `useArchiveUser`, `useUnarchiveUser`, `useResetUserPassword`, `useUsersAdmin` (admin list with status filter).
- Route: thêm `/admin/users` vào router với admin gate.
- AppHeader: thêm link "Quản lý user" trong admin menu (visible khi role=admin).

Vietnamese copy cho USER\_\* error codes thêm trong `errorMessages.ts`.

### TDD cycle

**Red**: component test cho UsersTable render rows + InviteUserDialog submit happy + reveal temp password modal.

**Green**: implement.

### DoD checklist

- [ ] AdminGate redirect non-admin về `/`.
- [ ] Temp password modal hiển thị copy button + warning.
- [ ] All mutations invalidate `users.adminList` query.
- [ ] UI spec file `.specs/ui/admin-users.md` cập nhật Status `Implemented`.

### Commit example

`feat(web): admin /admin/users page (US-007 / T6)`

---

## T7 — E2E + progress sync

- **Effort**: 1h
- **FR covered**: all
- **AC covered**: end-to-end coverage
- **Deps**: T6.
- **Parallel**: no

### Goal

Playwright `e2e/us-007.spec.ts`: admin invite → copy temp pass → logout → login as new user → admin reopens → edit role → disable → re-enable → reset password → logout → login with new temp pass. Sync README/SETUP/roadmap/traceability/api-surface/error-codes/CHANGELOG markers.

### DoD checklist

- [ ] E2E green local + CI.
- [ ] All progress markers flipped.
- [ ] US-007 Story status Done.

### Commit example

`test(e2e): US-007 admin user lifecycle (US-007 / T7)` + `docs: sync progress markers after T7 land (US-007 / T7 follow-up)`
