# UI Spec — Home (Project Catalog)

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `home`
- **Status**: Implemented (US-004 / T5 `6981c07`; UI uplift v2 Workspace CR-002 / Phase 2-1 `1d76919`)
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

## Wire-level description (UI uplift v2 — Workspace style — CR-002)

### Desktop (≥ 1024px)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ max-w-6xl, px-10, py-8                                                        │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ HERO ROW (flex items-end gap-6 mb-6)                                     │ │
│  │  ┌─────────────────────────────────────┐  ┌──────┐ ┌──────┐ ┌──────┐    │ │
│  │  │ WORKSPACE CỦA BẠN ← eyebrow primary │  │ Stat │ │ Stat │ │ Stat │    │ │
│  │  │ Danh sách project ← h1 36/40 bold   │  │ Chip │ │ Chip │ │ Chip │    │ │
│  │  │ Tất cả tài liệu onboarding cho ...  │  │ 12   │ │ 14   │ │  8   │    │ │
│  │  │ ← subtitle 15/22 muted, max-w-xl    │  │ Proj │ │ Đủdoc│ │ Đóng │    │ │
│  │  └─────────────────────────────────────┘  │ active│ │      │ │ góp  │    │ │
│  │                                            └──────┘ └──────┘ └──────┘    │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ FILTER ROW (rounded-xl bg-muted/40 border px-3 py-2.5 mb-5)              │ │
│  │  [Tất cả] [Đang viết] [Đủ doc] [Cần bổ sung] [Mình theo dõi]   Sắp xếp: │ │
│  │  ↑ pill buttons (active = bg-card shadow-sm)         [Mới cập nhật ▾]   │ │
│  │                                                       [⊞] [☰]            │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │ ┌──┐ Pilot Project    [Tag]  →  │  │ ┌──┐ Demo Project    [Tag]  →  │    │
│  │ │PP│ MVP v1 cho onboarding...   │  │ │DP│ Sandbox cho dev mới...    │    │
│  │ └──┘                             │  │ └──┘                            │    │
│  │                                  │  │                                 │    │
│  │ 12/20 sections có nội dung 60%  │  │ 5/5 sections có nội dung  100%  │    │
│  │ ████████████░░░░░░ ←progress    │  │ ████████████████████ ←progress  │    │
│  │                                  │  │                                 │    │
│  │ ─────────────────────────────── │  │ ─────────────────────────────── │    │
│  │ [TM][NL][PT]  4 feature  ●⏱ 2h │  │ [NL][PT]      1 feature   ⏱ 1d │    │
│  │ avatar stack            live    │  │ avatar stack                    │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │ ┌──┐ Alpha            [Draft] → │  │ + Tạo project mới              │    │
│  │ │ A│ (no description omitted)  │  │   dashed tile, admin only      │    │
│  │ └──┘                             │  │                                 │    │
│  │ 0/5 sections có nội dung  0%   │  │                                 │    │
│  │ ░░░░░░░░░░░░░░░░░░░ ←progress   │  │                                 │    │
│  │ ─────────────────────────────── │  │                                 │    │
│  │ [HD]            0 feature ⏱ 6d │  │                                 │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tablet (768-1023px) — 1-col grid, hero stack

### Mobile (<768px) — 1-col grid, hero stack vertical, filter row scrolls horizontally

```text
┌──────────────────────────┐
│ AppHeader                │
├──────────────────────────┤
│ Workspace của bạn        │
│ Danh sách project        │
│ Tất cả tài liệu...       │
│                          │
│ ┌────┐ ┌────┐ ┌────┐    │
│ │ 12 │ │ 14 │ │ 8  │←scroll
│ │Proj│ │Đủ  │ │Đóng│    │
│ └────┘ └────┘ └────┘    │
│                          │
│ [Tất cả|Đang|Đủ doc...] ←scroll
│                          │
│ ┌──────────────────────┐ │
│ │ Pilot Project   [T] →│ │
│ │ MVP v1 cho...        │ │
│ │ 12/20 ████░░ 60%     │ │
│ │ [TM][NL] 4 feat ●2h  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Demo Project    [T] →│ │
│ │ ...                  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Layout primitives

- **Container**: `mx-auto max-w-6xl px-10 py-8` (bumped từ max-w-5xl/px-6 cho info density). Mobile: `px-4`.
- **Hero row** (NEW — replaces hero panel): `flex flex-col xl:flex-row xl:items-end gap-6 mb-6`. Left: text block max-w-2xl (eyebrow + h1 + subtitle). Right: 3 StatChips horizontal (charter §10).
- **Filter row** (NEW): `rounded-xl bg-muted/40 border border-border px-3 py-2.5 flex items-center gap-3`. Left: pill button group `bg-transparent` mỗi pill `px-3 py-1.5 rounded-md font-ui font-semibold text-xs`; active = `bg-card shadow-sm text-foreground`, idle = `text-muted-foreground hover:text-foreground`. Right cluster: "Sắp xếp:" muted label + sort button `border bg-card px-2.5 h-7 rounded-md` với chevron + view toggle (list `[☰]` / grid `[⊞]`) icons. **v1 simplification**: filter pills ["Tất cả", "Đang viết", "Đủ doc", "Cần bổ sung"] — derive client-side từ `featureCount` + computed filledCount; "Mình theo dõi" hidden v1 (no follow data). Sort + view toggle render but text-only (single sort = updated desc, single view = grid).
- **Project grid**: `grid gap-4 sm:grid-cols-1 lg:grid-cols-2` (2-col từ 1024px+). Cards 180-220px tall.
- **"Tạo project mới" tile** (admin only, last cell): `rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary-50/30 cursor-pointer transition-all flex items-center justify-center gap-3 min-h-[180px] text-muted-foreground hover:text-primary font-ui font-semibold text-sm` với Plus icon trong primary-50 circle. Click mở `<CreateProjectDialog />`.

### ProjectCard (REDESIGN v2)

```
┌─────────────────────────────────┐
│ ┌──┐ Pilot Project  [Tag]    →  │  ← p-5, gap-3.5 row
│ │PP│ MVP v1 cho onboarding...   │     avatar 44×44 grad rounded-lg
│ └──┘ description line-clamp-1   │     name h4 font-display 15/22 bold
│                                  │     tag = badge dot small (computed status)
│                                  │     chevron right edge muted
│                                  │
│ 12/20 sections có nội dung  60% │  ← progress block
│ ██████████░░░░░░░░░░ ←6px bar   │     label-row: muted + primary % right
│                                  │     bar: rounded-full bg-neutral-100,
│                                  │     fill = primary-500
│                                  │
│ ──────────────────────────────  │  ← border-t pt-3
│ [TM][NL][PT]  4 feature  ●⏱ 2h │
│  avatar stack         live indicator
└─────────────────────────────────┘
```

- **Container**: `group rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring`. Wrapped in semantic `<Link>` element.
- **Top row** (`flex gap-3.5 items-start`):
  - **ProjectAvatar 44×44** `rounded-lg shrink-0 bg-gradient-to-br from-primary-{N}00 to-primary-{N+2}00 text-primary-800 font-display font-bold text-base flex items-center justify-center`. Letters = first 2 chars of first word uppercase (e.g. "Pilot Project" → "PI"). N = hash bucket. `aria-hidden`.
  - **Body** flex-1 min-w-0:
    - Title row: `<h2>` name `font-display text-[15px] leading-[22px] font-bold line-clamp-1` + tag badge inline (status badge: "Đang viết" primary, "Đủ doc" success, "Cần bổ sung" warning, "Draft" neutral — derive from filled% client-side; v1 logic: ≥80%=Đủ, ≥1=Đang viết, 0=Draft).
    - Description: `font-body text-[13px] leading-[18px] text-muted-foreground line-clamp-1 mt-1` (drop "(chưa có mô tả)" placeholder; omit khi không có).
  - **Chevron button** 28×28 transparent border-none `text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0`.
- **Progress block** (vertical stack):
  - Label row `flex justify-between mb-1.5`: left `font-ui font-semibold text-xs text-foreground/80` "{filled}/{total} sections có nội dung"; right `font-ui font-bold text-xs text-primary` "{pct}%".
  - Bar: `h-1.5 rounded-full bg-neutral-100 dark:bg-muted overflow-hidden`. Fill `h-full bg-primary-500 rounded-full transition-all duration-500` width = `${pct}%`.
  - Computed: `total = featureCount × 5` (5 sections/feature). `filled` = sum filledCount across project's features. v1: only `featureCount` available trên `ProjectSummary`; **needs API extension** OR derive at fetch time. Decision: **extend `ProjectSummary` BE-side với `filledSectionCount` + `totalSectionCount`** (1-line SQL aggregate trong projects list query). If BE not ready → render placeholder "{?} sections" + bar empty với tooltip "Đang đồng bộ".
- **Footer row** `pt-3 border-t border-border flex items-center justify-between`:
  - Left: `<AvatarStack ids={[...contributors]}/>` — v1 hardcoded từ `updatedBy` join. Display 2-3 avatars with -ml-2 overlap, `+N` if more. Size-7 ring-2 ring-background. Khi không có data → hide stack. Right of stack: muted "{featureCount} feature".
  - Right: `flex items-center gap-1.5 text-xs`. Activity indicator: pulse dot success-500 + "{N} đang chỉnh · " (HIDDEN v1, no presence data); Clock icon size-3.5 + RelativeTime muted. Live state colored success-500 khi >0 contributors active (placeholder: hardcode false v1).

### StatChip (charter §10)

3 chips trong hero right-side:

1. **Project active**: `<FolderOpen>` primary tone, value = `projects.length`, label "Project active".
2. **Feature đủ doc**: `<CheckCircle>` success tone, value = sum projects where filledRatio ≥ 0.8 (placeholder count v1; final logic post BE extension), label "Feature đủ doc".
3. **Đang đóng góp**: `<Users>` info tone, value = hardcoded "8" placeholder OR distinct contributors from updatedByName, label "Đang đóng góp".

Container: `flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5`. Icon plate 36×36 rounded-lg bg `${tone}/10%` icon size-4.5 colored `${tone}-500`. Stack value font-display 18/1 bold + label text-[11px] uppercase tracking-wide muted mt-1.

### Tokens & typography

- Hero: eyebrow `text-[12px] font-semibold uppercase tracking-[0.16em] text-primary-600`; h1 `font-display text-[36px] leading-10 font-bold tracking-[-0.02em]`; subtitle `font-body text-[15px] leading-[22px] text-muted-foreground max-w-2xl mt-2.5`.
- Card title: `font-display text-[15px] leading-[22px] font-bold`.
- Card progress label: `font-ui text-xs font-semibold`. Percentage: `font-ui text-xs font-bold text-primary-600`.
- Card footer text: `font-ui text-xs font-medium text-muted-foreground`.
- Filter pills: `font-ui text-[13px] font-semibold`.

### Spacing

- Hero row → filter: mb-5. Filter → grid: native (default flow). Hero internal: gap-6 (text block ↔ chip cluster). Card gap-4 outer, p-5 + gap-4 inner stacks.

## Error / empty / loading states

- **Loading**: 4 card skeletons match shape mới (2-col grid) — avatar 44×44 `rounded-lg animate-pulse bg-muted` + 2 text bars (name 60% + desc 90%) + progress block (label bar + 6px bar) + footer (avatar stack + text bar). `aria-busy="true"` trên `<main>`. **Hero KHÔNG skeleton** — text static; StatChip values render "—" placeholder cho tới khi data về.
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
- **Page component**: `apps/web/src/pages/HomePage.tsx` — refactor: hero row (text + StatChip cluster) + filter row + 2-col grid + admin "Tạo project" tile. Compute `totalFeatures = sum(p.featureCount)`, `featuresInfullyDoc = ...` (placeholder logic v1 hardcoded 0 → BE extension).
- **Sub-components**:
  - `apps/web/src/components/projects/ProjectCard.tsx` (NEW — replaces `ProjectRow`. Card with avatar + name + tag + description + progress + footer. Same path renaming for clarity.) v1 keep both files; deprecate ProjectRow trong Phase 2 commit.
  - `apps/web/src/components/projects/ProjectAvatar.tsx` (NEW — gradient letter avatar, `size` prop for 44 / 56 / 80 variants. Used Home + ProjectLanding hero).
  - `apps/web/src/components/common/StatChip.tsx` (NEW — shared, used Home + future dashboards. Props: icon, tone, value, label.).
  - `apps/web/src/components/common/AvatarStack.tsx` (NEW — overlapping avatar circles, +N counter).
  - `apps/web/src/components/common/ProgressBar.tsx` (NEW — thin 6px bar, primary fill, animated transition).
  - `apps/web/src/components/projects/ProjectFilterPills.tsx` (NEW — 4 filter states client-side).
- **Queries**: `useProjects()` — unchanged. `ProjectSummary` requires extension (post-BE work — see below).
- **Shared schema extension** (BE follow-up — separate task):
  - `ProjectSummary` add `filledSectionCount: number` (sum sections.body !== '') + `totalSectionCount: number` (= featureCount × 5).
  - v1 implementation: render placeholder "—/— sections" + empty bar nếu BE chưa ready; OR compute client-side bằng `featureCount * 5` cho `total`, hardcode `filled = 0` cho UI to ship UI without BE block. Final wire khi BE PR ready.
- **Hardcoded/dummy data v1** (skeleton-UI policy charter v2):
  - StatChip "Đang đóng góp" → hardcode "8" hoặc distinct count of `updatedByName` từ projects (no separate API).
  - AvatarStack contributors → derive từ `project.updatedByName` (1 avatar) + 0-2 hardcoded extras `[NL, PT]` placeholder.
  - "{N} đang chỉnh" live indicator → hidden v1.
  - Tag badge status → derived from filledRatio client-side.
- **Reuse**:
  - `CreateProjectDialog` admin tile + admin empty state (2 instances).
  - `NxLogo` (mark) — defer Home v2 (no decorative mark in this layout; reserved for Login/ProjectLanding).
  - `RelativeTime`, `EmptyState`, `Button`, lucide icons (`FolderOpen`, `CheckCircle`, `Users`, `Plus`, `Clock`, `ChevronRight`, `ChevronDown`, `LayoutGrid`, `List`).

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
