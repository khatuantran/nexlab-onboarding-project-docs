# UI Spec — AppHeader (v4 pill search + initials gradient)

<!-- template: 02-ui-spec-template.md@0.1 -->

## Screen metadata

- **Screen ID**: `app-header`
- **Status**: v3 shipped (CR-006 / Phase C2 `6341287`); **v4 Dark vivid amend pending (CR-006 v4 / Phase C2)**.
- **Last updated**: 2026-05-16 (v4 amend)

Component-level spec (not a route). Mounted ở `ProtectedLayout` cho mọi authenticated screen. v4 amend tightens chrome per dark-vivid direction. Visual quality bar per [visual-language v4](visual-language.md) — single-row, pill search with ⌘K kbd, initials gradient UserMenu trigger.

## v4 amendments (CR-006 v4 — Dark vivid + glassmorphism) — supersedes Wire-level + Component changes below

Pilot scope per [CR-006 §Iteration v4](../changes/CR-006.md). Replaces v3 single-row spec at the wire level (more specific paddings + initials gradient on UserMenu trigger + ⌘K kbd badge on search pill). State machine + A11y + Interactions unchanged.

### Container

- `<header role="banner" className="sticky top-0 z-20 h-16 border-b border-border bg-background px-6 flex items-center gap-4">` (h-16 = 64px per reference topbar.jsx, bumped from v3 h-14 = 56px).
- No `max-w-7xl` constraint — full-bleed; padding `px-6` only.
- No translucent bg / backdrop-blur on header itself in v4 (chrome stays solid `bg-background` for contrast with dark hero below).

### Left cluster — Logo + divider + (optional) breadcrumb

- `<NxLogo variant="lockup" size={26}>` (down from 28 — reference uses 26).
- Vertical divider `w-px h-[22px] bg-border` after logo.
- Optional inline `<BreadcrumbBar inline/>` (when inside project / feature route) right after divider. v3 prop kept.

### Center — Search pill with ⌘K kbd

- `<SearchInput pill>` (NEW pill variant — add prop to existing component).
- Layout: `flex-1 max-w-[400px] h-[38px] flex items-center gap-2.5 px-3.5 rounded-[10px] bg-bg-subtle border-[1.5px] border-border focus-within:bg-background focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(240,118,19,0.1)] transition`.
- Inner: Search icon size-[15px] (focused = primary, idle = muted) + `<input>` placeholder "Tìm project, feature, người..." font-ui text-[13px] font-medium + `<kbd className="text-[11px] font-semibold text-muted-foreground border border-border bg-bg-subtle rounded px-1.5 py-0.5">⌘K</kbd>` trailing.

### Right cluster — Bell + Theme + UserMenu pill

- Single `flex-1` spacer **after** the search wrapper (no spacer between divider/breadcrumb and search). Search pill sits immediately after the (optional) inline `<BreadcrumbBar>`, hugging the logo cluster. The trailing spacer pushes the right cluster (Bell + Theme + UserMenu) to the right edge.
- `<NotificationBell>` square `size-9 rounded-[10px]` ghost icon button + Bell icon size-[17px] + red dot indicator `absolute top-[9px] right-[9px] size-[7px] bg-[#F43F5E] rounded-full border-2 border-background`. Tooltip "Sắp ra mắt".
- `<ThemeToggle>` same `size-9 rounded-[10px]` ghost shape + Sun/Moon icon size-[17px].
- `<UserMenu>` rewrite trigger:
  - Wrapper `flex items-center gap-2.5 pl-3 border-l border-border shrink-0`.
  - Inside trigger: initials plate `size-[34px] rounded-[10px] bg-gradient-to-br from-primary to-primary-700 inline-flex items-center justify-center font-ui text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(240,118,19,0.4)]` (e.g. "TM").
  - Stack to the right: name `font-ui text-[13px] font-bold text-foreground leading-none` + role badge below `font-ui text-[11px] font-medium text-muted-foreground leading-none mt-[3px]` (e.g. "Admin · BA").
  - Dropdown menu items unchanged from v3 (Hồ sơ / Cài đặt / Quản lý user [admin] / Đăng xuất).

### v4 changes from v3

| Component        | v3                                              | v4                                                                                                        |
| ---------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Container height | `h-14` (56px) + `bg-canvas/90 backdrop-blur-md` | `h-16` (64px) + solid `bg-background` (chrome stays solid)                                                |
| Search input     | `h-9 rounded-full bg-muted/50` pill             | `h-[38px] rounded-[10px] bg-bg-subtle border-[1.5px]` + ⌘K kbd badge                                      |
| Bell + Theme     | `size-9 rounded-md`                             | `size-9 rounded-[10px]` (consistent w/ search); Bell adds red-dot indicator                               |
| UserMenu trigger | Avatar size-8 only                              | Initials gradient plate 34×34 + name (13px bold) + role label (11px muted), bordered with `border-l pl-3` |
| Logo size        | NxLogo lockup `size={28}`                       | NxLogo lockup `size={26}` (match reference)                                                               |
| Vertical divider | None                                            | `w-px h-[22px] bg-border` after logo                                                                      |

### Tests update (v4)

- AppHeader.test selectors: kbd `⌘K` visible, initials gradient trigger renders user displayName + role text content.
- UserMenu.test: trigger renders name + role; dropdown items unchanged.
- SearchInput.test: pill variant applies expected classes when `pill={true}`.

## v3 wire (superseded by v4 above)

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
