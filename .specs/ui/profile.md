# UI Spec — Profile (self-service)

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `profile`
- **Status**: Ready
- **Last updated**: 2026-05-15

## Route

- **Path**: `/profile`
- **Auth**: 🔐 session required (any role)
- **Redirect on unauth**: `/login?next=/profile`
- **API calls**: `GET /api/v1/me` (load) · `PATCH /api/v1/me` (rename) · `POST /api/v1/me/password` (change pw) · `POST /api/v1/me/avatar` (upload)

## State machine

```text
idle → loading (useMyProfile fetch)
        ├── success → view
        │     ├── editName → patching → view (success toast + cache invalidate) | view + inline error (4xx)
        │     ├── changingPassword → posting → view (success toast + form reset) | view + inline error (4xx)
        │     └── uploadingAvatar → posting (FormData) → view (success toast + cache invalidate) | view + inline error (413/415/502/503)
        └── error → red banner + "Thử lại"
```

## Interactions

| Trigger                               | Action                                                                          | Next state                    | Side effect                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Page mount                            | `useMyProfile()` → `GET /api/v1/me`                                             | loading → view                | Cache key `["auth","me"]`                                                               |
| Click "Sửa" (Profile section)         | Inline-edit displayName → input + Lưu/Hủy                                       | view → editing                | Hủy revert; form-state local                                                            |
| Submit displayName                    | `PATCH /me { displayName }` → 200                                               | editing → view                | Toast "Đã cập nhật hồ sơ"; invalidate `["auth","me"]` → AppHeader avatar refresh        |
| Submit "Đổi mật khẩu"                 | `POST /me/password { oldPassword, newPassword }` → 204                          | view (form reset)             | Toast "Đã đổi mật khẩu — các phiên khác đã đăng xuất"; current sid preserved            |
| Submit pw 401 INVALID_CREDENTIALS     | Inline error gần field `oldPassword`                                            | view (form giữ newPassword)   | Toast destructive optional; chỉ inline đủ                                               |
| Submit pw 400 VALIDATION_ERROR        | FE Zod check trước; back-stop server cũng reject                                | view (inline error gần field) | —                                                                                       |
| Click "Tải lên ảnh mới" → choose file | Validate client mime + size → `POST /me/avatar` multipart → 200 `{ avatarUrl }` | view (preview swap)           | Toast "Đã cập nhật ảnh đại diện"; invalidate `["auth","me"]` → AppHeader avatar refresh |
| Upload 413/415                        | Toast destructive ("File quá lớn (≤ 2 MB)" / "File phải là ảnh PNG/JPG/WebP")   | view                          | No state change                                                                         |
| Upload 502/503                        | Toast destructive ("Cloudinary tạm thời không khả dụng")                        | view                          | Retry button optional v1                                                                |

## A11y

- **Keyboard**: tất cả button + input tab-focusable. Form Enter submit; Escape cancel inline edit.
- **Labels**: mọi `<input>` có `<Label htmlFor>`; upload `<input type="file">` ẩn nhưng wrapper button có `aria-label="Tải lên ảnh đại diện mới"`.
- **Live regions**: success/error toast qua sonner (default `aria-live=polite`); inline error có `role="alert"`.
- **Landmarks**: `<main>` wrap page; section headings `<h2>` cho Profile / Security / Avatar.
- **Focus ring**: token `--ring` (`focus-visible:ring-2 focus-visible:ring-ring`).
- **Contrast**: theo token (≥ 4.5:1 cả 2 mode).

## Wire-level description

### Desktop (≥ 768px)

```text
┌──────────────────────────────────────────────────────────────────┐
│ AppHeader                                                         │
├──────────────────────────────────────────────────────────────────┤
│ max-w-2xl px-6 py-8                                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ h1 "Hồ sơ của tôi"                                          │  │
│  │ p subtitle "Quản lý thông tin tài khoản và bảo mật"          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ §1 Profile (card rounded-xl border bg-card p-6)             │  │
│  │  [Avatar 80] | Email (readonly muted) · displayName + [Sửa] │  │
│  │              | Role badge · Tham gia 2 tháng trước          │  │
│  │              | Lần login cuối · 5 phút trước                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ §2 Security                                                  │  │
│  │  h2 "Đổi mật khẩu"                                          │  │
│  │  [old password]   [new password]   [confirm new password]   │  │
│  │                                          [Đổi mật khẩu →]   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ §3 Avatar                                                    │  │
│  │  [Avatar large 120] · Drag-drop placeholder hoặc nút        │  │
│  │  "Tải lên ảnh mới" (input file ẩn, accept image/*)          │  │
│  │  Hint "PNG/JPG/WebP ≤ 2 MB"                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

- Cùng layout vertical stack `max-w-full px-4 py-6`. Profile section avatar đặt top, fields stack dưới.

## Error / empty / loading states

- **Loading**: page render skeleton — 3 card với pulse rows.
- **Error fetch `/me`**: red banner "Không tải được hồ sơ. Thử lại?" + button refetch.
- **Empty**: không applicable (user luôn có row).
- **Server validation**: inline error dưới field tương ứng + `role="alert"`.

## Maps US

- [US-009](../stories/US-009.md) — AC-1 (UserMenu link), AC-2 (5 read-only field), AC-3 (edit name), AC-4 (change pw happy), AC-5 (wrong old 401), AC-6 (new pw validation), AC-7 (avatar upload), AC-8 (avatar validate), AC-9 (session purge UX).
