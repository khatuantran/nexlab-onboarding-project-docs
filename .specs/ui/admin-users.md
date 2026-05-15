# UI Spec — Admin Users

<!-- template: 02-ui-spec-template.md@0.1 -->

## Screen metadata

- **Screen ID**: `admin-users`
- **Status**: Implemented (2026-05-15, US-007 T6 `da67d63`)
- **Last updated**: 2026-05-15
- **Owner**: @khatuantran11

## Route

- **Path**: `/admin/users`
- **Auth**: 👑 admin
- **Redirect on unauth**: client-side `<Navigate to="/" replace />` khi role ≠ admin. BE `GET /api/v1/users?status=*` cũng trả 403 cho non-admin → defense in depth.
- **Entry points**:
  - **Primary**: link "Quản lý user" trong [AppHeader](home.md) (admin gate, icon Users, đứng ngay trước CTA "Tạo project").
  - **Direct URL**: gõ tay `/admin/users` (bookmarkable).
  - **Future**: HomePage admin section dashed-tile (deferred, BL-NNN).

## State machine

```
idle → loading → (success-data | success-empty | error)
                    ↓
            action (invite | edit | archive | unarchive | reset)
                    ↓
            mutating → (success-toast | server-error-toast)
                    ↓
            success → invalidate users-admin query → loading → success
```

- **States**:
  - `loading` — 3 placeholder skeleton rows.
  - `success-data` — `<UsersTable>` render rows.
  - `success-empty` — empty card "Không có user nào khớp bộ lọc hiện tại".
  - `error` — destructive banner "Không tải được danh sách user. Thử lại sau."
  - `mutating` — action menu items disabled while mutation pending; toast on success/error.

## Interactions

| Trigger                             | Result                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Gõ vào search box                   | 200ms debounce → re-query `useAdminUsers({ q })`.                                                |
| Đổi `<select>` role / status        | Re-query lập tức.                                                                                |
| Click "Mời user mới"                | Mở `<InviteUserDialog>`.                                                                         |
| Submit invite form hợp lệ           | 201 → đóng dialog → mở `<TempPasswordModal>` hiển thị `tempPassword` 1 lần với nút Copy.         |
| Click ⋯ trên row                    | Mở `<DropdownMenu>` với 3-4 item (Edit / Reset / Disable hoặc Enable).                           |
| Click "Sửa user"                    | Mở `<EditUserDialog>` prefill displayName + role.                                                |
| Click "Reset mật khẩu"              | `window.confirm` → mutation → mở `<TempPasswordModal>` với tempPassword mới.                     |
| Click "Disable user"                | `window.confirm` → archive mutation → toast "Đã disable user" → row badge đổi sang Disabled.     |
| Click "Enable user"                 | Unarchive mutation → toast → row badge đổi sang Active.                                          |
| Self-row (admin xem chính mình)     | Edit / Reset / Disable item đều `disabled` ở dropdown (BE cũng reject 409 `CANNOT_MODIFY_SELF`). |
| Last-admin disable / demote attempt | BE 409 `LAST_ADMIN_PROTECTED` → error toast bằng `messageForCode`.                               |
| Đóng `<TempPasswordModal>`          | Modal đóng — temp password không retrievable nữa (admin phải reset lại để xem lại).              |

## A11y

- Trang có `<main>` semantic + `<h1>` "Quản lý user".
- `<UsersTable>` dùng `<table>` semantic với `<thead>` / `<tbody>`. Cột "Thao tác" có `aria-label` rỗng vì chỉ là affordance.
- Mọi action button có `aria-label` (Mời user mới / Thao tác user).
- Dropdown menu uses Radix primitive — keyboard navigation built-in (Arrow / Enter / Esc).
- Loading state có `aria-busy` trên `<main>`.
- Error banner có `text-destructive` + đủ contrast (Nexlab tokens, ≥ 4.5:1 trên light + dark).
- TempPasswordModal có `<DialogTitle>` + `<DialogDescription>` rõ purpose + warning text-destructive nhắc về single-show.

## Wire-level description

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN                                                       │
│ Quản lý user                                  [+ Mời user mới]│
│ Mời người mới, đổi role, disable, hoặc reset mật khẩu.       │
├─────────────────────────────────────────────────────────────┤
│ [Tìm theo tên hoặc email…           ] [Role ▾] [Status ▾]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Người dùng         │ Role   │ Status  │ Login cuối │ ⋯  │ │
│ ├────────────────────┼────────┼─────────┼────────────┼────┤ │
│ │ ◯ Admin            │ ADMIN  │ ACTIVE  │ 2 phút    │ ⋯  │ │
│ │   admin@local      │        │         │            │    │ │
│ ├────────────────────┼────────┼─────────┼────────────┼────┤ │
│ │ ◯ Dev              │ AUTHOR │ ACTIVE  │ —         │ ⋯  │ │
│ │   dev@local        │        │         │            │    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Page container `max-w-5xl px-6 py-8`.
- Filter bar: muted background card; search input flex-1; selects nén bên phải.
- Table: rounded-xl, border, hover row tint, cột "Thao tác" width fixed 12.

## Error / empty / loading states

- **Loading**: 3 div skeleton `h-14` animate-pulse, không có table chrome.
- **Empty (no rows match filter)**: dashed-border card với copy duy nhất; CTA "Mời user mới" ở header vẫn hiện.
- **Error**: destructive banner inline; query không retry (đã set `retry: false`).
- **403 từ BE khi non-admin direct nav**: client-side `<Navigate>` đã chặn trước; nếu admin role bị revoke mid-session thì requireAuth (US-007 amend) sẽ 401 next request → RequireAuth wrapper redirect `/login`.

## Components used

- Existing: `Dialog`, `DropdownMenu`, `Input`, `Label`, `Button`, `Avatar`, `Toast (sonner)`, `Navigate` (react-router-dom), `cn` helper.
- New (US-007 / T6): `UsersTable`, `UserStatusBadge`, `UserActionsMenu`, `InviteUserDialog`, `EditUserDialog`, `TempPasswordModal`.

## Maps US

- [US-007](../stories/US-007.md) — toàn bộ 8 AC, cụ thể:
  - AC-1 (non-admin chặn) — `<Navigate>` + AdminGate ẩn link.
  - AC-2 (list + filter) — filter bar + UsersTable.
  - AC-3 (invite + reveal temp password) — `<InviteUserDialog>` + `<TempPasswordModal>`.
  - AC-4 (duplicate 409) — `serverError` state trong dialog.
  - AC-5 (edit displayName + role) — `<EditUserDialog>`.
  - AC-6 (disable → login reject) — `<UserActionsMenu>` Disable item.
  - AC-7 (reset password + session purge) — Reset item + TempPasswordModal.
  - AC-8 (last-admin guard) — BE 409 → toast `LAST_ADMIN_PROTECTED`.
