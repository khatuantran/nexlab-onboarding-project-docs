# UI Spec — Home (Project Catalog)

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `home`
- **Status**: Ready
- **Last updated**: 2026-04-24

## Route

- **Path**: `/`
- **Auth**: 🔐 session required
- **Redirect on unauth**: `/login?next=/`
- **API call**: `GET /api/v1/projects` (US-004 task sẽ implement). Response: `{ data: Array<{ id, slug, name, description, featureCount, updatedAt }> }`, sorted `updated_at` desc, loại `archived_at IS NOT NULL`.

## State machine

```text
idle → loading (useProjects fetch)
        ├── success (projects.length > 0) → list
        ├── success (projects.length === 0) → empty
        └── error → error banner (retry button)
```

- **States**:
  - `loading` — 3 row skeletons (`aria-busy=true`).
  - `list` — rows render sorted by `updatedAt` desc.
  - `empty` — `EmptyState` reuse với variant theo role (admin: có CTA; author: không CTA).
  - `error` — red banner với copy "Có lỗi xảy ra, thử lại sau" + button "Thử lại" re-fetch.

## Interactions

| Trigger                                     | Action                                                   | Next state                 | Side effect                                                   |
| ------------------------------------------- | -------------------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Page mount                                  | `useProjects()` TanStack Query fetch                     | loading → list/empty/error | Cache key `["projects"]`                                      |
| Click row (or Enter on focused row)         | Navigate `/projects/:slug` (semantic `<a>`)              | unmount                    | SPA push; scroll top on new screen                            |
| Hover row (desktop)                         | Subtle elevation `hover:shadow-sm` + `hover:bg-muted/30` | —                          | Visual affordance only                                        |
| Click "Tạo project đầu tiên" (empty, admin) | Mở `CreateProjectDialog` (shared với AppHeader trigger)  | empty (dialog overlay)     | Dialog internal state (independent instance — không conflict) |
| Click "Thử lại" (error)                     | `refetch()` từ TanStack Query                            | error → loading            | —                                                             |

## A11y

- **Keyboard**: mỗi row = `<a>` (tab-focusable); Enter/Space navigate. Tab order theo list order top → bottom.
- **Labels**:
  - `<h1>Danh sách project</h1>` đầu trang.
  - Mỗi row `<a>` có `aria-label="Xem chi tiết project <name>"`; trong row `<h2>` là project name.
  - Feature count có text "N feature"; relative time đã có `<time datetime>` từ `RelativeTime` component.
- **Live regions**:
  - Loading state wrap `aria-busy="true"`.
  - Error banner `role="alert"`.
  - Empty state `role="status"` (non-urgent).
- **Landmarks**: `<main>` wrap toàn catalog; AppHeader từ ProtectedLayout.
- **Focus ring**: token `--ring` trên `<a>` row (`focus-visible:ring-2 focus-visible:ring-ring`).
- **Contrast**: theo token (4.5:1 cả light + dark).

## Wire-level description

### Desktop (≥ 768px)

```text
┌────────────────────────────────────────────────────────────┐
│ AppHeader (logo · search · [Tạo project (admin)] · user …) │
├────────────────────────────────────────────────────────────┤
│  max-w-5xl, px-6, py-8                                      │
│                                                             │
│  Danh sách project                           h1 2xl         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Pilot Project                            cập nhật 2h →│  │
│  │ MVP v1 cho onboarding catalog pilot team A.            │  │
│  │ 5 feature                                             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Demo Project                            cập nhật 1d →│  │
│  │ Sandbox cho dev mới onboard. Có 1 feature đủ 5 sect.   │  │
│  │ 1 feature                                             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Alpha                                   cập nhật 3d →│  │
│  │ (chưa có mô tả)                                         │  │
│  │ 0 feature                                             │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```text
┌──────────────────────┐
│ AppHeader            │
├──────────────────────┤
│ Danh sách project    │
│                      │
│ ┌──────────────────┐ │
│ │ Pilot Project  →│ │
│ │ MVP v1 cho...    │ │
│ │ 5 feature · 2h   │ │
│ ├──────────────────┤ │
│ │ Demo Project   →│ │
│ │ Sandbox ...      │ │
│ │ 1 feature · 1d   │ │
│ └──────────────────┘ │
└──────────────────────┘
```

- **Layout**:
  - Container: `mx-auto max-w-5xl px-6 py-8`.
  - List: single column `<ul>` hoặc wrapping `<div>` với border divider giữa rows (`divide-y divide-border`).
  - Row: `<a>` element, `grid grid-cols-[1fr_auto] gap-4 p-4 items-start`. Left = name + description + meta; right = `ChevronRight` icon.
  - Description: `line-clamp-2 text-sm text-muted-foreground mt-1`.
  - Meta line: `text-xs text-muted-foreground mt-2` với format "{N} feature · cập nhật {RelativeTime}".
- **Key components** (design-system §5):
  - New: `ProjectRow` — row component.
  - Reused: `RelativeTime` (date-fns `vi` locale), `EmptyState`, `Button` variant `default` (cho admin CTA).
  - Reused icon: `ChevronRight` (row arrow), `Plus` (admin empty-state button).
- **Key tokens**:
  - `bg-background` main.
  - `text-foreground` project name (h2).
  - `text-muted-foreground` description + meta.
  - `border-border` row divider.
  - `hover:bg-muted/30` row hover.
  - `--ring` focus outline.
- **Typography**:
  - H1 page heading: `text-2xl font-semibold tracking-tight`.
  - H2 row name: `text-base font-semibold`.
  - Description body: `text-sm leading-relaxed`.
  - Meta line: `text-xs`.
- **Spacing**:
  - Heading → list: `mt-6`.
  - Row padding: `p-4`.
  - Between name / description / meta: `mt-1` / `mt-2`.

## Error / empty / loading states

- **Loading**: 3 row skeletons với structure tương tự row (bar cho name, 2 bars cho description, 1 bar ngắn cho meta). Class `animate-pulse bg-muted`. `aria-busy="true"` trên `<main>`.
- **Empty** (projects.length === 0):
  - Reuse `EmptyState` component.
  - Title: "Chưa có project nào trong catalog".
  - Description: "Tạo project đầu tiên để bắt đầu organize onboarding content." (admin) / "Liên hệ admin để tạo project đầu tiên." (author).
  - **Admin variant** có button `<Button>` (Plus icon + "Tạo project đầu tiên") click mở `CreateProjectDialog` (controlled via local `useState` — 2nd trigger độc lập với AppHeader's internal trigger).
  - **Author variant** không button, chỉ text.
- **Error (network / 5xx)**:
  - `role="alert"` banner đỏ `border-destructive/30 bg-destructive/10 text-destructive p-4 rounded-md`.
  - Copy: "Có lỗi xảy ra khi tải danh sách project. Thử lại sau."
  - Button "Thử lại" bên phải call `refetch()`.
- **Unauthenticated**: `RequireAuth` wrap route → `/login?next=/`.

## Security notes

- Không render user-provided HTML (description là plain text, escape mặc định qua React).
- List response không chứa archived projects (filter ở BE per FR-PROJ-001 updated + FR-PROJ-002).

## Maps US

- [US-004](../stories/US-004.md) — AC-1 (render catalog), AC-2 (click navigate), AC-3 (empty state admin CTA), AC-4 (archived loại khỏi list).

## Implementation

- **Task**: US-004 tasks TBD (sẽ viết ở `.specs/stories/US-004/tasks.md`).
- **Page component**: `apps/web/src/pages/HomePage.tsx` (replace existing placeholder).
- **Sub-components**:
  - `apps/web/src/components/projects/ProjectRow.tsx` — row item với arrow.
- **Queries**: `apps/web/src/queries/projects.ts` — add `useProjects()` hook TanStack Query, key `["projects"]`.
- **Shared schema**: `packages/shared/src/schemas/project.ts` — add response shape `ProjectSummary` `{ id, slug, name, description, featureCount, updatedAt }`.
- **Reuse**:
  - `CreateProjectDialog` (US-002 T4) — mount instance thứ 2 trong empty state của HomePage, trigger riêng. Internal open-state isolation OK.
  - `RelativeTime`, `EmptyState`, `Button` — đã có từ US-001/US-002.

## Gate 1 decisions (approved 2026-04-24 via AskUserQuestion)

- [x] **Layout**: List rows full-width (1 row / project), **không grid**. Info density cao hơn, phù hợp 20+ projects trong pilot.
- [x] **Card content**: Rich — name + description truncate 2 lines + feature count + relative time.
- [x] **Empty state**: Admin thấy inline button "Tạo project đầu tiên" trigger CreateProjectDialog. Author chỉ placeholder text + "Liên hệ admin để tạo project đầu tiên."
- [x] **Heading**: "Danh sách project" (Vietnamese, consistent với domain copy "Tạo project", "Thêm feature", v.v.).

## Open items (v2 defer, không scope US-004)

- Search / filter trong catalog (đã có header search cover content search, catalog-specific filter defer).
- Sort controls (fixed updated-desc v1).
- Pagination (v1 giả định < 50 projects — fit vào 1 response).
- Unarchive action từ catalog (archived không hiển thị v1, không có UI để unarchive — v2 sẽ cần "Archived projects" tab hoặc filter).
