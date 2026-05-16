---
version: 0.1
last-updated: 2026-05-16
target: .specs/ui/admin-settings.md
required_sections:
  - Screen metadata
  - Route
  - State machine
  - Interactions
  - A11y
  - Wire-level description
  - Error / empty / loading states
  - Maps US
---

# UI Spec — Admin Settings

<!-- template: 02-ui-spec-template.md@0.1 -->

> **v4 NEW (CR-006 v4 — 2026-05-16)**: Placeholder admin settings screen introduced to mirror `variation-a-settings.jsx` reference. Pure FE skeleton — toggles + selects + integration cards are visual stubs (no persistence). Real backend wiring deferred to a future US/CR.

## Screen metadata

- **Screen ID**: `admin-settings`
- **Status**: Draft (v4 placeholder, no FR)
- **Last updated**: 2026-05-16

## Route

- **Path**: `/admin/settings`
- **Auth**: 👑 admin only — non-admins `<Navigate to="/" replace/>`. Mirror `AdminUsersPage` gate.
- **Redirect on unauth**: `/login?next=/admin/settings`

## State machine

```
idle → activeCategory ∈ {general, perms, notif, security, integr, theme}
       ↓
       click sidebar category → updates activeCategory → re-render panel body
```

- **States**: 6 categories, sidebar nav switches between them. No async loading yet — all data is hardcoded v1.

## Interactions

| Trigger                     | Action                                   | Next state              | Side effect                                |
| --------------------------- | ---------------------------------------- | ----------------------- | ------------------------------------------ |
| Click sidebar category nav  | `setActiveCat(id)`                       | re-render content panel | None                                       |
| Click toggle                | `setOn(!on)` local state                 | toggle visual flips     | Toast "Đã lưu (placeholder)" — no API call |
| Click select dropdown       | Select option                            | local state             | Same as above                              |
| Click "Lưu thay đổi"        | Toast "Lưu thay đổi: tính năng v2"       | unchanged               | Placeholder                                |
| Click integration "Kết nối" | Toast "Kết nối tính năng v2"             | unchanged               | Placeholder                                |
| Click "Xóa toàn bộ dữ liệu" | `window.confirm` → on yes, toast warning | unchanged               | Placeholder — no destructive call          |

## A11y

- **Keyboard**: sidebar nav focusable; tab through toggles + selects. Enter activates buttons.
- **Labels**: each Toggle / Select has `<label>` text adjacent + `aria-describedby` for sub-text.
- **Landmarks**: `<main>` wraps page; sidebar `<nav aria-label="Categories">`; panel body `<section aria-labelledby="...">`.

## Wire-level description (v4 — CR-006)

- **Hero** (full-bleed `GradientHero`, 2 blobs amber + purple + dot grid + watermark, padding `pt-9 pb-12 px-10`): eyebrow chip "⚙ Quản trị" amber-200 + h1 white "Cài đặt / hệ thống" (gradient text on line 2 amber-gold).
- **Main grid** `px-10 pt-6 pb-16 grid grid-cols-[260px_1fr]`:
  - **Sidebar** sticky top:
    - 6-item nav `rounded-2xl border bg-card p-1.5`: each row `flex items-center gap-3 p-3 rounded-xl`. Active = colored `bg-{tone}/8% + outline {tone}/33%` + icon plate `size-9 rounded-[10px] bg-{tone}/22 border-{tone}/33 + Icon {tone}` + label colored. Idle = transparent. Categories: Tổng quát (primary) / Phân quyền (purple) / Thông báo (blue) / Bảo mật (rose) / Tích hợp (green) / Giao diện (amber).
    - Danger zone card (`mt-3 rounded-[14px] bg-rose-50 border-rose-200 p-4`): rose flag icon + "Danger zone" + 1-line note + outline destructive button "Xóa toàn bộ dữ liệu".
  - **Content panel** `rounded-[18px] border bg-card overflow-hidden`:
    - Panel header `p-[20px_28px] border-b bg-{tone}/40 light tint`: icon plate `size-11 rounded-[12px] bg-{tone}/20 + Icon {tone}` + h3 label + 1-line sub + actions cluster (ghost "Hủy" + primary "Lưu thay đổi").
    - Panel body `p-[8px_28px_24px]`: per-category content — Toggles + Selects rows (border-b separator) for Tổng quát/Thông báo/Bảo mật; Permissions table for Phân quyền; Integration cards stack for Tích hợp; Color picker + select rows for Giao diện.

## Error / empty / loading states

- **Loading**: N/A (no async data v1).
- **Error**: N/A.
- **Empty**: N/A (each category has hardcoded settings).

## Maps US

- None — v4 placeholder. No FR coverage yet. Future US tagged when backend persistence + real settings model lands.
