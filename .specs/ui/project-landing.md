# UI Spec — Project Landing

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `project-landing`
- **Status**: Implemented (read path T9 `879b15b`; admin actions US-004 / T7 `904e9c8`)
- **Last updated**: 2026-04-24

## Route

- **Path**: `/projects/:slug`
- **Auth**: 🔐 session required
- **Redirect on unauth**: `/login?next=<current>`
- **API call**: `GET /api/v1/projects/:slug` (từ T7, return `{ project, features: FeatureListItem[] }`).

## State machine

```
idle → loading (useProject fetch)
        ├── success (features.length > 0) → list view
        ├── success (features.length === 0) → empty state
        └── error
             ├── 404 PROJECT_NOT_FOUND → "Không tìm thấy project" + link về /
             └── other → generic error panel
```

- **States**:
  - `loading` — skeleton list (3 card placeholder).
  - `list` — feature cards grid.
  - `empty` — EmptyState "Chưa có feature nào trong project này" (AC-4).
  - `error-404` — inline panel "Không tìm thấy project" + CTA về home.
  - `error-other` — generic "Có lỗi xảy ra, thử lại" banner.

## Interactions

| Trigger                | Action                                           | Next state              | Side effect                                  |
| ---------------------- | ------------------------------------------------ | ----------------------- | -------------------------------------------- |
| Page mount             | `useProject(slug)` fetch                         | loading → success/error | TanStack Query cache key `["project", slug]` |
| Click feature card     | Navigate `/projects/:slug/features/:featureSlug` | —                       | SPA push; scroll top on new screen           |
| Hover card (desktop)   | Card elevation nhẹ (`hover:shadow-sm`)           | —                       | visual affordance only                       |
| Keyboard Enter on card | Same as click                                    | —                       | tab order card-by-card                       |

## A11y

- **Keyboard**: mỗi card = `<a>` (semantic link, tab-focusable). Enter/Space = navigate.
- **Labels**: project name trong `<h1>`; mỗi card có `<h2>` feature title + visually-hidden "Xem chi tiết feature X".
- **Live regions**: loading wrap `aria-busy="true"`; error `role="alert"`.
- **Landmarks**: `<main>` wrap grid; AppHeader từ ProtectedLayout.
- **Focus ring**: token `--ring` trên card link (`focus-visible:ring-2`).
- **Contrast**: theo token (4.5:1 cả light + dark).

## Wire-level description

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────┐
│ AppHeader (logo · user · ThemeToggle · Đăng xuất)       │
├────────────────────────────────────────────────────────┤
│  max-w-5xl, px-6, py-8                                  │
│                                                         │
│  Demo Project                              h1 2xl       │
│  Catalog 5 feature · cập nhật 2h trước     muted sm     │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ 📄 Login     │ │ 📄 Search    │ │ 📄 Export    │     │
│  │              │ │              │ │              │     │
│  │ [5/5] ·⏱ 2h │ │ [3/5] ·⏱ 1d │ │ [0/5] ·⏱ 3d │     │
│  │           →  │ │           →  │ │           →  │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ AppHeader            │
├──────────────────────┤
│ Demo Project     h1  │
│ Catalog 5 feature    │
│                      │
│ ┌──────────────────┐ │
│ │ 📄 Login         │ │
│ │ [5/5] · 2h    →  │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ 📄 Search        │ │
│ │ [3/5] · 1d    →  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

- **Layout**: main `max-w-5xl px-6 py-8`. Header block (project name + summary) `mb-6`. Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Key components** (design-system §5):
  - `FeatureCard` — `Card` wrap link. Padding `p-5`, border `border`, rounded `rounded-lg`, hover `hover:shadow-sm transition-shadow`.
  - `SectionBadge` — pill "3/5", `text-xs`, bg `bg-muted`, rounded `rounded-full`, padding `px-2 py-0.5`.
  - `RelativeTime` — `<time>` với icon `Clock size-3.5` + text "2 giờ trước".
  - `EmptyState` — center icon `AlertCircle size-10 text-muted-foreground` + copy + CTA.
- **Key icons** (design-system §4):
  - `FileText` — leading icon trong card (`size-5 text-muted-foreground`).
  - `ChevronRight` — trailing CTA icon card (`size-4 text-muted-foreground self-end`).
  - `Clock` — trước relative time.
  - `AlertCircle` — empty state.
- **Key tokens**:
  - `bg-background` main.
  - `border-border` card.
  - `text-foreground` title.
  - `text-muted-foreground` sub-copy + icons.
  - `ring-ring` focus.
- **Typography**:
  - H1 project name: `text-2xl font-semibold`.
  - Sub-copy: `text-sm text-muted-foreground`.
  - Card title: `text-base font-medium`.
  - Card meta: `text-xs text-muted-foreground`.
- **Spacing**:
  - Header → grid gap: `mb-6`.
  - Card inner gap: `gap-3` (icon/title row, badge/time row, CTA).

## Error / empty / loading states

- **Loading**: 3 skeleton card render (same size as real card, `bg-muted animate-pulse` khối). Container `aria-busy="true"`.
- **Empty** (AC-4): giữa trang, 1 column — icon `AlertCircle` → `text-base` copy "Chưa có feature nào trong project này" → muted sub-copy "Admin/BA sẽ thêm feature sớm." Không CTA v1 (US-002 sẽ add).
- **Error 404** (AC via PROJECT_NOT_FOUND): replace main với panel:
  ```
  Không tìm thấy project "<slug>"
  Có thể slug sai, hoặc bạn không có quyền truy cập.
  [← Về trang chủ]
  ```
- **Error other**: inline `text-destructive` banner trên cùng, giữ grid skeleton dưới để retry effect.
- **Unauthenticated**: RequireAuth redirect `/login?next=/projects/<slug>`.

## Admin actions (US-004)

Admin-gated overflow menu trên header để edit metadata + archive project. Dev/Author không thấy menu (per AC-8 US-004).

### Menu layout + trigger

- **Position**: bên phải heading block, cạnh "Thêm feature" button (author-gated, đã có từ US-002 T6).
- **Trigger**: icon button `MoreHorizontal` (size 20px), `aria-label="Thao tác project"`, variant `ghost size="icon"`.
- **Menu items** (dropdown xổ xuống, align right):
  - `Pencil` + "Sửa project" → mở `EditProjectDialog` (xem [edit-project-dialog.md](edit-project-dialog.md)).
  - (Separator line)
  - `Archive` + "Lưu trữ project" → native `window.confirm(...)` → POST archive → redirect `/`.

### Wire-level (desktop)

```text
┌──────────────────────────────────────────────────────────┐
│ Pilot Project                      h1 2xl                │
│ MVP v1 for onboarding pilot team A.                      │
│ Catalog 5 feature · cập nhật 2h trước                    │
│                                                           │
│                          [+ Thêm feature]  [⋯]            │
│                          ^author-gated   ^admin-gated    │
└──────────────────────────────────────────────────────────┘

khi click [⋯]:
                                             ┌──────────────┐
                                             │ ✎ Sửa project│
                                             ├──────────────┤
                                             │ 📦 Lưu trữ    │
                                             └──────────────┘
```

Mobile (< 640px): "Thêm feature" full-width button, `⋯` ở top-right cạnh heading.

### Interactions (admin)

| Trigger                  | Action                                                                                                       | Next state                 | Side effect                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------- |
| Click `⋯` (trigger)      | Mở Radix DropdownMenu content                                                                                | menu closed → open         | Focus trap trong menu; ESC close                     |
| Click "Sửa project"      | Close menu, open `EditProjectDialog` (pre-fill)                                                              | menu open → dialog open    | Per edit-project-dialog spec                         |
| Click "Lưu trữ project"  | `window.confirm('Lưu trữ project "<name>"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.')`    | menu open → confirm native | Nếu OK → archive flow; nếu Cancel → close menu, stay |
| Archive confirm OK       | `POST /api/v1/projects/:slug/archive` → 204                                                                  | → archiving                | Disable menu items during request                    |
| 204 success              | Sonner success "Đã lưu trữ project" 2s → `navigate("/")` → catalog refetch (query invalidate `["projects"]`) | → redirected               | Project không còn trong catalog                      |
| 403 FORBIDDEN            | Sonner destructive "Bạn không có quyền" + đóng menu                                                          | → menu closed              | Reload user cache (role có thể stale)                |
| 404 PROJECT_NOT_FOUND    | Sonner destructive + navigate `/` (project đã archived session khác)                                         | → redirected               | —                                                    |
| 5xx / network            | Sonner destructive "Có lỗi xảy ra, thử lại"                                                                  | → menu closed              | Button re-enable                                     |
| ESC / click outside menu | Close dropdown (trước khi click item)                                                                        | menu open → closed         | Return focus về trigger `⋯`                          |

### Admin actions A11y

- `⋯` button icon-only → `aria-label="Thao tác project"` (required).
- DropdownMenu.Content `role="menu"`, items `role="menuitem"` (Radix default).
- Keyboard:
  - `⋯` focused + Enter/Space → open menu.
  - Arrow down / up → navigate items.
  - Enter → activate.
  - ESC → close menu.
- Confirm dialog native → browser handles focus/a11y.

### Admin actions post-archive redirect

- **Decision**: redirect `/` (catalog) + sonner "Đã lưu trữ project".
- Rationale: project vừa archive không còn trong catalog — user confirm thao tác OK. Không stay trên URL archived (URL giờ 404 per AC-9).
- Invalidate: `["projects"]` (catalog refresh) + `["project", slug]` (cache clear để nếu user back URL sẽ re-fetch → 404).

### Gate 1 decisions (approved 2026-04-24 via AskUserQuestion)

- [x] **Position**: Icon overflow menu (`⋯` MoreHorizontal) → dropdown xổ xuống với "Sửa" + "Lưu trữ" items. Compact header, scalable khi có nhiều admin actions tương lai (delete v2, archive v1).
- [x] **Archive confirm wording**: `'Lưu trữ project "X"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.'` — explicit name + consequence prevent archive nhầm.
- [x] **Post-archive**: Redirect `/` (catalog) + sonner success. Clean UX, user confirm thao tác không cần back.

## Maps US

- [US-001](../stories/US-001.md) — AC-3 (feature list + filledCount), AC-4 (empty state copy).
- [US-004](../stories/US-004.md) — AC-5 (admin edit metadata trigger), AC-7 (admin archive trigger + redirect), AC-8 (non-admin không thấy menu).

## Implementation

- **Task**: [T9](../stories/US-001/tasks.md#t9--landing--feature-detail-pages)
- **Page component**: `apps/web/src/pages/ProjectLandingPage.tsx`
- **Queries**: `apps/web/src/queries/projects.ts` — `useProject(slug)` (TanStack Query, key `["project", slug]`)
- **Sub-components** (mới land T9):
  - `apps/web/src/components/ui/card.tsx` — Card primitive
  - `apps/web/src/components/features/FeatureCard.tsx`
  - `apps/web/src/components/features/SectionBadge.tsx`
  - `apps/web/src/components/common/RelativeTime.tsx`
  - `apps/web/src/components/common/EmptyState.tsx`
- **Shared helpers**:
  - `apps/web/src/lib/relativeTime.ts` — wrap `formatDistanceToNow(date, { addSuffix: true, locale: vi })` từ date-fns.
- **Response type**: `ProjectResponse + FeatureListItem[]` từ [@onboarding/shared/schemas/feature.ts](../../packages/shared/src/schemas/feature.ts).

### US-004 admin actions additions

- **New primitive**: `apps/web/src/components/ui/dropdown-menu.tsx` (shadcn wrapper quanh `@radix-ui/react-dropdown-menu`).
- **New component**: `apps/web/src/components/projects/ProjectActionsMenu.tsx` — overflow menu với 2 items, mount trong ProjectLandingPage header cạnh "Thêm feature".
- **Mutation hooks**: `queries/projects.ts` — `useUpdateProject(slug)` (dùng bởi EditProjectDialog) + `useArchiveProject(slug)`.
- **Server endpoints**: `PATCH /api/v1/projects/:slug` + `POST /api/v1/projects/:slug/archive` — task US-004 sẽ ship.
- **Dep**: `@radix-ui/react-dropdown-menu` (pnpm install trong FE scaffold task).

## Open items (for user review — Gate 1)

- [ ] H1 copy "Demo Project" (từ DB `project.name`) — OK hay cần prefix "Project: "?
- [ ] Sub-copy "Catalog 5 feature · cập nhật 2h trước" — OK? (5 = tổng features, thời gian = max(updatedAt))
- [ ] Card CTA: arrow icon ở góc phải — OK hay muốn nguyên card clickable + no icon?
- [ ] Empty copy "Admin/BA sẽ thêm feature sớm." — OK hay muốn khác?
- [ ] Error 404 copy — OK?
- [ ] Card grid: 3 col desktop, 2 col tablet, 1 col mobile — OK?
