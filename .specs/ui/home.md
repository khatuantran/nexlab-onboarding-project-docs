# UI Spec — Home (Project Catalog)

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `home`
- **Status**: Implemented (US-004 / T5 `6981c07`) · UI uplift draft (CR-002 / Phase 1B-1, 2026-04-25)
- **Last updated**: 2026-04-25

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

## Wire-level description (UI uplift — CR-002)

### Desktop (≥ 768px)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ AppHeader (NxLogo · Search · [Tạo project (admin)] · ThemeToggle · …)  │
├────────────────────────────────────────────────────────────────────────┤
│  max-w-5xl, px-6, py-8                                                  │
│                                                                         │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║ HERO PANEL (rounded-2xl, gradient primary-50→bg→secondary-bg/50)  ║  │
│  ║ ring-1 ring-primary/10 · py-10 px-8 · NxLogo mark abs right opacity-5 ║  │
│  ║                                                                    ║  │
│  ║   ONBOARDING PORTAL    ← eyebrow text-xs uppercase tracking-wide  ║  │
│  ║   Danh sách project    ← h1 font-display text-3xl font-bold       ║  │
│  ║   12 project active · 47 feature đã document  ← stats text-base   ║  │
│  ║                                                                    ║  │
│  ║                                       [+ Tạo project] ← admin only ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                         │
│  Mới cập nhật ở đầu                                  12 project        │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ rounded-xl bg-card shadow-sm border border-border divide-y         │ │
│  │ ┌───────────────────────────────────────────────────────────────┐  │ │
│  │ │ ┌──┐ Pilot Project                              ┌────┐ Mới  → │  │ │
│  │ │ │PP│ MVP v1 cho onboarding catalog pilot team A │  5 │       │  │ │
│  │ │ │  │ ⏱ 2 giờ trước                              │feat│       │  │ │
│  │ │ └──┘ 56×56 grad avatar         font-display text-lg semibold  │  │ │
│  │ ├───────────────────────────────────────────────────────────────┤  │ │
│  │ │ ┌──┐ Demo Project                                ┌────┐    →  │  │ │
│  │ │ │DP│ Sandbox cho dev mới onboard                 │  1 │       │  │ │
│  │ │ │  │ ⏱ 1 ngày trước                              │feat│       │  │ │
│  │ │ └──┘                                                            │  │ │
│  │ ├───────────────────────────────────────────────────────────────┤  │ │
│  │ │ ┌──┐ Alpha                                        ┌────┐    →  │  │ │
│  │ │ │ A│ ⏱ 3 ngày trước                               │  — │       │  │ │
│  │ │ └──┘ (no description → omit dòng đó hoàn toàn)    └────┘       │  │ │
│  │ └───────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```text
┌──────────────────────────┐
│ AppHeader                │
├──────────────────────────┤
│ Hero panel (stacked)     │
│  ONBOARDING PORTAL       │
│  Danh sách project       │
│  12 project · 47 feature │
│  [+ Tạo project] admin   │
│                          │
│ Mới cập nhật ở đầu       │
│ ┌──────────────────────┐ │
│ │ ┌──┐ Pilot Project →│ │
│ │ │PP│ MVP v1...       │ │
│ │ │  │ 5 feature · 2h  │ │
│ │ └──┘                  │ │
│ ├──────────────────────┤ │
│ │ ┌──┐ Demo Project  →│ │
│ │ │DP│ ⏱ 1 ngày        │ │
│ │ │  │ 1 feature       │ │
│ │ └──┘                  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

- **Layout**:
  - Container: `mx-auto max-w-5xl px-6 py-8`.
  - **Hero panel** (NEW): `rounded-2xl bg-gradient-to-br from-primary-50 via-background to-secondary-bg/50 ring-1 ring-primary/10 py-10 px-8 relative overflow-hidden`. NxLogo mark variant abs right `size-32 opacity-5 text-primary` (decorative, `aria-hidden`).
  - Filter strip: `mt-6 flex items-center justify-between text-sm`. Left "Mới cập nhật ở đầu" muted; right `{count} project` muted. (Sort dropdown deferred v1.)
  - List wrapper: `mt-3 rounded-xl bg-card shadow-sm border border-border divide-y divide-border`.
  - **Row** (REDESIGN): `group grid grid-cols-[auto_1fr_auto_auto] items-center gap-5 p-5 transition-all hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`.
- **Row cells**:
  - **Cell 1 — Avatar 56×56**: `rounded-xl shadow-sm ring-1 ring-primary-200/40 dark:ring-primary-700/40 bg-gradient-to-br from-primary-{N}00 to-primary-{N+2}00 text-white font-display font-bold text-2xl flex items-center justify-center`. N = hash(slug) bucket (200→400 / 300→500 / 400→600 / 500→700 / 600→800). Letter = first non-space char of name uppercase. `aria-hidden`.
  - **Cell 2 — Body**: name `font-display text-lg font-semibold text-foreground line-clamp-1`. Description `text-sm text-muted-foreground line-clamp-1` (CHỈ render khi có — drop "(chưa có mô tả)" placeholder hoàn toàn). Meta row `mt-1 flex items-center gap-1.5 text-xs text-muted-foreground` với Clock icon size-3 + RelativeTime.
  - **Cell 3 — Feature count badge**: `flex flex-col items-center justify-center rounded-xl bg-secondary-bg/60 dark:bg-secondary/10 px-3 py-2 min-w-[64px]`. Count `font-display text-2xl font-bold text-secondary-text`; label `text-[10px] uppercase tracking-wide text-secondary-text/80` "feature". Khi count=0 → render muted "—" thay vì pill.
  - **Cell 4 — "Mới" badge + chevron**: pill `text-xs font-semibold text-primary bg-primary-50 ring-1 ring-primary/20 rounded-full px-2 py-0.5` chỉ render khi `updatedAt < 24h ago`. Chevron `size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition`.
- **Hover state**: row bg `bg-muted/30` + avatar gets `ring-2 ring-primary/20` + chevron slide. `transition-all` 150ms ease-out per charter §4.
- **Key components**:
  - New: `ProjectAvatar` (extract — reused trong ProjectLanding hero per CR-002 Phase 2).
  - Updated: `ProjectRow` (4-cell grid, gradient avatar, gold count badge, "Mới" pill).
  - Reused: `RelativeTime` (date-fns `vi` locale), `EmptyState`, `Button`, `CreateProjectDialog`.
  - Reused icon: `ChevronRight`, `Clock`, `Plus`, `FolderOpen` (empty), `NxLogo` (mark variant).
- **Key tokens** (charter §2-3):
  - Hero: `from-primary-50 via-background to-secondary-bg/50`, `ring-primary/10`, eyebrow `text-primary`.
  - Avatar gradient: `from-primary-{N}00 to-primary-{N+2}00`, `ring-primary-200/40` (light), `ring-primary-700/40` (dark).
  - Count badge: `bg-secondary-bg/60`, `text-secondary-text`.
  - "Mới" pill: `bg-primary-50`, `text-primary`, `ring-primary/20`.
  - Hover: `bg-muted/30`, chevron `text-primary`.
  - Focus: `ring-ring` standard.
- **Typography** (charter §1):
  - Page hero h1: `font-display text-3xl font-bold tracking-tight`.
  - Eyebrow: `text-xs font-semibold uppercase tracking-wider text-primary`.
  - Stats line: `text-base text-muted-foreground`.
  - Row name: `font-display text-lg font-semibold` (bumped từ text-base).
  - Description: `text-sm leading-relaxed` (line-clamp-1).
  - Meta: `text-xs text-muted-foreground`.
  - Count badge value: `font-display text-2xl font-bold`.
- **Spacing** (charter §1 4pt):
  - Hero inner: `py-10 px-8`. Hero → filter: `mt-6`. Filter → list: `mt-3`.
  - Row inner: `p-5`. Row gap: `gap-5`. Row stack inner: name → desc `mt-0.5`, desc → meta `mt-1`.

## Error / empty / loading states

- **Loading**: 3 row skeletons match shape mới — avatar block 56×56 `rounded-xl animate-pulse bg-muted` + 2 text bars (name + meta) + count block 56×56. `aria-busy="true"` trên `<main>`. **Hero panel KHÔNG skeleton** — text static, chỉ stats numbers chờ data có thể render `—` placeholder.
- **Empty** (projects.length === 0) — charter §5:
  - Centered `py-16 px-6 max-w-md mx-auto`.
  - Icon: `FolderOpen` 64×64 `text-primary/40 mx-auto`.
  - Heading: `font-display text-xl font-semibold mt-6` → "Chưa có project nào".
  - Description `mt-2 text-sm text-muted-foreground` → "Tạo project đầu tiên để team bắt đầu document features. BA viết business sections; dev bổ sung tech-notes + screenshots." (admin) / "Liên hệ admin để bắt đầu." (author).
  - **Admin variant**: `<CreateProjectDialog triggerLabel="Tạo project đầu tiên" />` mt-6 (2nd instance độc lập với AppHeader's).
  - **Author variant**: text-only.
- **Error (network / 5xx)** — charter §5:
  - `role="alert"` banner `border-destructive/30 bg-destructive/10 text-destructive p-4 rounded-md`.
  - Copy: "Không tải được danh sách project. Thử lại sau."
  - Button "Thử lại" bên phải `variant="outline" size="sm"` call `refetch()`.
- **Unauthenticated**: `RequireAuth` wrap route → `/login?next=/`.

## Security notes

- Không render user-provided HTML (description là plain text, escape mặc định qua React).
- List response không chứa archived projects (filter ở BE per FR-PROJ-001 updated + FR-PROJ-002).

## Maps US

- [US-004](../stories/US-004.md) — AC-1 (render catalog), AC-2 (click navigate), AC-3 (empty state admin CTA), AC-4 (archived loại khỏi list).

## Implementation

- **Tasks**:
  - Initial implementation: US-004 / T5 ✅ `6981c07`.
  - UI uplift refresh: CR-002 / Phase 2-1 (TBD hash).
- **Page component**: `apps/web/src/pages/HomePage.tsx` — refactor để bao gồm hero panel + filter strip + list wrapper. Compute `totalFeatures = sum(p.featureCount)` cho hero stats. Recent-update detection (`<24h`) trong row component.
- **Sub-components**:
  - `apps/web/src/components/projects/ProjectRow.tsx` (UPDATE — 4-cell grid, gradient avatar, count badge, "Mới" pill).
  - `apps/web/src/components/projects/ProjectAvatar.tsx` (NEW — extract avatar logic, used here + ProjectLanding).
- **Queries**: `apps/web/src/queries/projects.ts` `useProjects()` — unchanged shape.
- **Shared schema**: `packages/shared/src/schemas/project.ts` — `ProjectSummary` unchanged.
- **Reuse**:
  - `CreateProjectDialog` empty state instance + hero CTA instance.
  - `NxLogo` (mark variant) trong hero decorative.
  - `RelativeTime`, `EmptyState`, `Button`, `Clock`/`FolderOpen`/`ChevronRight` lucide.

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
