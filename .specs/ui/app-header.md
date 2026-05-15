# UI Spec — AppHeader (v3 single-row chrome)

<!-- template: 02-ui-spec-template.md@0.1 -->

## Screen metadata

- **Screen ID**: `app-header`
- **Status**: Spec ready — pilot pending (CR-006 / Phase C2)
- **Last updated**: 2026-05-16

Component-level spec (not a route). Mounted ở `ProtectedLayout` cho mọi authenticated screen. Replaces v2 2-row AppHeader chrome per [CR-006](../changes/CR-006.md). Visual quality bar per [visual-language v3](visual-language.md) — single-row, warm, icon-first.

## Route

- **Path**: N/A (component, not screen).
- **Auth**: 🔐 mounted bên trong RequireAuth — chỉ render khi user logged in.
- **Public alternative**: LoginPage có brand panel riêng, không dùng AppHeader.

## State machine

```text
mount → resolved (user.session loaded) → render
                                            ↓
                              click search / open dropdown / theme toggle
                                            ↓
                                  open SearchInput / UserMenu / cycle theme
```

- **States**:
  - `mount` — wait for `useMe()` resolve (gated by RequireAuth at layout level — header doesn't render until session ready).
  - `render` — display chrome with user data + nav.
  - Sub-states: search input focused (inline), dropdown menus open (UserMenu / NotificationBell tooltip).

## Interactions

| Trigger                     | Action                                                                 | Next state                 | Side effect                                  |
| --------------------------- | ---------------------------------------------------------------------- | -------------------------- | -------------------------------------------- |
| Page mount                  | Render chrome from `useMe()` cache                                     | render                     | Re-render on user.avatarUrl change           |
| Click logo / "Nexlab"       | Navigate `/` (HomePage)                                                | unmount → mount HomePage   | SPA push                                     |
| Type in SearchInput + Enter | Navigate `/search?q={query}&projectSlug={slug?}`                       | unmount → mount SearchPage | Submit query                                 |
| Click NotificationBell      | (Placeholder) tooltip "Sắp ra mắt"                                     | render (tooltip overlay)   | None — feature deferred                      |
| Click ThemeToggle           | Cycle Light → Dark → System → Light                                    | render (theme class flip)  | Persist `localStorage["theme"]`              |
| Click UserMenu avatar       | Open DropdownMenu (Hồ sơ / Cài đặt / Quản lý user [admin] / Đăng xuất) | render (menu overlay)      | None — items navigate / call logout mutation |
| Breadcrumb segment click    | Navigate to ancestor route                                             | unmount → mount ancestor   | SPA push                                     |

## A11y

- **Keyboard**: tab order: Logo → SearchInput → Bell → ThemeToggle → UserMenu → page content. All buttons focus-visible ring.
- **Labels**:
  - Logo: `aria-label="Trang chủ Nexlab Onboarding"` trên Link.
  - SearchInput: `<input aria-label="Tìm kiếm dự án / feature">` + placeholder text.
  - Bell: `aria-label="Thông báo (sắp ra mắt)"`.
  - ThemeToggle: `aria-label="Chuyển sang chế độ {next-mode}"` dynamic.
  - UserMenu trigger: `aria-label="Menu người dùng {displayName}"`.
- **Live regions**: dropdown menus use Radix-managed `role="menu"` + `aria-expanded` state.
- **Landmarks**: wrap toàn header trong `<header role="banner">`.
- **Contrast**: warm canvas bg + foreground text ≥ 4.5:1. Icon buttons `text-muted-foreground` hover `text-foreground`.

## Wire-level description (v3 — CR-006 single-row chrome)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                              h-14, sticky top-0       │
│ bg-canvas/90 backdrop-blur-md border-b border-border, px-6                   │
│                                                                               │
│  🟠 Nexlab  /  Project name [▾]    🔍 Tìm dự án / feature...    🔔 ☀ 👤    │
│  └─logo──┘  └─breadcrumb compact─┘ └────SearchInput max-w-md─┘ └─icons──┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
        ↓ page content `<main className="bg-canvas">`
```

### Layout primitives

- **Container**: `<header role="banner" className="sticky top-0 z-30 h-14 border-b border-border bg-canvas/90 backdrop-blur-md">`.
- **Inner row**: `mx-auto max-w-7xl h-full px-6 flex items-center gap-4`.
- **Left cluster** `flex items-center gap-3 shrink-0`:
  - Logo `<Link to="/">` rendering `<NxLogo variant="lockup" size={28}>`.
  - Optional breadcrumb compact (only when inside project / feature): vertical separator `text-muted-foreground` + project name `font-ui font-semibold text-sm` + Chevron-down (clickable to project picker — deferred, v1 just link to project).
- **Center**: SearchInput `flex-1 max-w-md` — keep existing component, increase visual prominence via `h-9 rounded-full bg-muted/50 border-0 focus:bg-card focus:ring-2`.
- **Right cluster** `flex items-center gap-1 shrink-0`:
  - NotificationBell — ghost icon button size-9 `text-muted-foreground hover:text-foreground hover:bg-muted/50`. Bell icon size-[18px]. Disabled, tooltip "Sắp ra mắt".
  - ThemeToggle — ghost icon button size-9. Sun/Moon/Monitor icon dynamic.
  - UserMenu — Avatar size-8 (giữ component existing).
- **NO ROW 2** (eliminated). Breadcrumb merged inline. Admin CTA moves to per-page section header (HomePage already has).

### Mobile (<768px) responsive

- Hide breadcrumb compact (chỉ logo). SearchInput shrinks (no max-w cap).
- Bell + Theme + UserMenu giữ — icons compact.
- Vertical padding giữ h-14.

### Component changes from v2

| Component       | v2                                         | v3                                                                 |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| AppHeader       | 2-row sticky                               | 1-row sticky `h-14`                                                |
| BreadcrumbBar   | Row 2 separate component                   | Inline trong AppHeader left slot khi có project context            |
| Admin CTA       | Row 2 right "+ Tạo project" outline button | **Moves to HomePage section header** (solid filled "Tạo dự án")    |
| Background      | `bg-card` solid                            | `bg-canvas/90 backdrop-blur-md` (warm + translucent)               |
| SearchInput     | `bg-card` rectangular                      | `bg-muted/50 rounded-full` pill style, focus elevates              |
| Icon buttons    | mixed (some with labels)                   | **Icon-only** (v3 "ít chữ" rule) — labels via aria-label + tooltip |
| Vertical height | ~96-112px (2-row)                          | **56px** (h-14) — more screen real estate cho content              |

## Error / empty / loading states

- **Loading** (initial app boot, useMe pending): RequireAuth at layout level shows full-screen spinner — header doesn't render until session ready. KHÔNG skeleton header (cause flash + no value).
- **Error** (useMe fail / 401): RequireAuth redirects to `/login` — header unmounts.
- **Empty**: N/A (header is chrome, no empty state).

## Maps US

- AppHeader is cross-cutting chrome — touches US-001 (catalog navigation), US-004 (Home access), US-010+ (search). Visual-only change per CR-006, no AC change.

## Implementation

- **Task**: CR-006 / Phase C2 (commit `feat(web): AppHeader single-row redesign (CR-006 / Phase C2)`).
- **Component**: [apps/web/src/components/layout/AppHeader.tsx](../../apps/web/src/components/layout/AppHeader.tsx) — rewrite single-row.
- **Sub-components**:
  - [BreadcrumbBar.tsx](../../apps/web/src/components/layout/BreadcrumbBar.tsx) — change render mode from Row 2 standalone to inline compact (renders only when inside project context via `useLocation`).
  - [NavLinks.tsx](../../apps/web/src/components/layout/NavLinks.tsx) — **DELETE or hide** (v3 không có top nav pill row; navigation via breadcrumb + UserMenu only).
- **Reuse intact**:
  - [SearchInput.tsx](../../apps/web/src/components/layout/SearchInput.tsx) — style tweak only (pill bg).
  - [NotificationBell.tsx](../../apps/web/src/components/layout/NotificationBell.tsx) — keep ghost icon button.
  - [ThemeToggle.tsx](../../apps/web/src/components/layout/ThemeToggle.tsx) — keep tri-state.
  - [UserMenu.tsx](../../apps/web/src/components/layout/UserMenu.tsx) — keep DropdownMenu.
  - [NxLogo.tsx](../../apps/web/src/components/common/NxLogo.tsx) — keep, use lockup variant size 28.
- **Test impact**:
  - [apps/web/tests/components/AppHeader.test.tsx](../../apps/web/tests/components/AppHeader.test.tsx) — update selectors for single row.
  - RequireAuth + CreateProjectDialog admin tests — Row 2 admin CTA gone, traversal changes.
  - HomePage tests — admin CTA assertions move (section header inside HomePage).
