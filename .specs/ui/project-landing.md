# UI Spec — Project Landing

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `project-landing`
- **Status**: Draft (awaiting user approval — Gate 1)
- **Last updated**: 2026-04-23

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

## Maps US

- [US-001](../stories/US-001.md) — AC-3 (feature list + filledCount), AC-4 (empty state copy).

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

## Open items (for user review — Gate 1)

- [ ] H1 copy "Demo Project" (từ DB `project.name`) — OK hay cần prefix "Project: "?
- [ ] Sub-copy "Catalog 5 feature · cập nhật 2h trước" — OK? (5 = tổng features, thời gian = max(updatedAt))
- [ ] Card CTA: arrow icon ở góc phải — OK hay muốn nguyên card clickable + no icon?
- [ ] Empty copy "Admin/BA sẽ thêm feature sớm." — OK hay muốn khác?
- [ ] Error 404 copy — OK?
- [ ] Card grid: 3 col desktop, 2 col tablet, 1 col mobile — OK?
