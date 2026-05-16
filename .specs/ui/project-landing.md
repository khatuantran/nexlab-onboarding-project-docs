# UI Spec — Project Landing

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `project-landing`
- **Status**: Implemented v2 (`8da2aff`); **v4 Dark vivid amend pending (CR-006 v4 — dark gradient hero + 4-col gradient FeatureCard)**.
- **Last updated**: 2026-05-16 (v4.6 archive confirm → custom dialog)

## v4.6 archive confirm → custom dialog (CR-006 v4.6 — 2026-05-16)

Mirror of [home.md §v4.6](home.md) — `FeatureActionsMenu` "Lưu trữ feature" admin action giờ mở `ConfirmDialog` (Radix Dialog primitive — see [design-system.md](design-system.md) CHANGELOG v4.6) thay native `window.confirm()`. Title `Lưu trữ feature "{title}"?`, description "Feature sẽ ẩn khỏi catalog. Sections và uploads vẫn được giữ nguyên, có thể khôi phục sau.", buttons Huỷ + Lưu trữ (destructive). POST `/projects/:slug/features/:fSlug/archive` flow + toast + cache invalidate giữ nguyên.

## v4.4 FeatureCard header simplification (CR-006 v4.4 — 2026-05-16)

Mirror of [home.md §v4.4](home.md) ProjectCard change so the feature grid header matches: `FeatureCard` drops the ProgressRing 44 (white stroke + pct% overlay) from the gradient header. Admin `FeatureActionsMenu` still lives at `absolute right-2 top-2` (was already there per BUG-004); the slot is now uncontested. `pct` const + `ProgressRing` import removed. Test impact: `tests/pages/ProjectLandingPage.test.tsx` drops `^100%$` / `^40%$` assertions; title + RelativeTime still assert.

Also: page-level `Breadcrumb` (Projects > {project.name}) added at `px-10 pt-4` above the hero — mirrors the FeatureDetailPage breadcrumb pattern. AppHeader BreadcrumbBar removed in the same iteration; this is the in-page replacement.

## v4 amendments (CR-006 v4 — Dark vivid + glassmorphism) — supersedes v2 hero + FeatureCard sections below

Pilot scope per [CR-006 §Iteration v4](../changes/CR-006.md). State machine + Route + Auth + A11y + Maps US unchanged.

- **ProjectHero** rewrite — uses `GradientHero` primitive (dark gradient + 2 blobs orange/purple + dot grid + logo watermark) wrapped `rounded-[22px]` with `mx-10 mt-3 mb-7`. Tag chip "Pilot" + Live chip "Đang chạy · Sprint 14" + h1 white + 4 inline colored stats (Features amber / Đủ doc green / Tiến độ blue with live dot / Cập nhật purple) + right cluster (Theo dõi/Repo ghost-glass buttons + Tạo feature primary CTA + AvatarStack). Replaces v2 warm gradient panel + MiniStat row.
- **FeatureCard** rewrite — vivid gradient header (1 of 6 palettes by slug hash, min-h 120) + decorative circle + status icon plate / Check + ProgressRing 44 white with pct% overlay + title in header + status pill. Light body p-3: section dots row (5 cells primary/muted) + footer (RelativeTime + AvatarStack). Replaces v2 light icon-row card.
- **Grid**: 4-col `sm:grid-cols-2 xl:grid-cols-4` (was 2-col).
- **Page wrapper**: `bg-background pb-16` (drops mx-auto max-w-6xl container — hero is full-bleed, tabs/grid use `px-10`).

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

| Trigger                          | Action                                                                                      | Next state              | Side effect                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Page mount                       | `useProject(slug)` fetch                                                                    | loading → success/error | TanStack Query cache key `["project", slug]`                                                              |
| Click feature card               | Navigate `/projects/:slug/features/:featureSlug`                                            | —                       | SPA push; scroll top on new screen                                                                        |
| Hover card (desktop)             | Card elevation nhẹ (`hover:shadow-sm`)                                                      | —                       | visual affordance only                                                                                    |
| Keyboard Enter on card           | Same as click                                                                               | —                       | tab order card-by-card                                                                                    |
| Click ⋯ trên FeatureCard (admin) | Mở `FeatureActionsMenu` (Lưu trữ feature); event stopPropagation tránh navigate vào feature | list (menu overlay)     | Confirm OK → POST archive → toast + invalidate `["project", slug]` cache → feature mất khỏi list (US-008) |

## A11y

- **Keyboard**: mỗi card = `<a>` (semantic link, tab-focusable). Enter/Space = navigate.
- **Labels**: project name trong `<h1>`; mỗi card có `<h2>` feature title + visually-hidden "Xem chi tiết feature X".
- **Live regions**: loading wrap `aria-busy="true"`; error `role="alert"`.
- **Landmarks**: `<main>` wrap grid; AppHeader từ ProtectedLayout.
- **Focus ring**: token `--ring` trên card link (`focus-visible:ring-2`).
- **Contrast**: theo token (4.5:1 cả light + dark).

## Wire-level description (UI uplift v2 — Workspace style — CR-002)

### Desktop (≥ 1024px)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Breadcrumb: 📁 Projects › Pilot Project                                      │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ HERO PANEL (rounded-2xl, primary-50→primary-100 gradient)            │    │
│  │  decorative NxLogo mark abs right opacity-0.18 rotate-[-8deg]         │    │
│  │                                                                       │    │
│  │  [Pilot] [Đang chạy] · Sprint 14 · Catalog                            │    │
│  │  Pilot Project ← h1 32/38 bold tracking-tight                         │    │
│  │  MVP v1 cho onboarding catalog. BA: Trí Minh · Tech lead: Ngọc Linh.  │    │
│  │                                                                       │    │
│  │  FEATURES         SECTIONS HOÀN     ĐANG CHỈNH      CẬP NHẬT CUỐI    │    │
│  │  4                11/20 (55%)       —              12 phút trước     │    │
│  │  2 đã đủ doc      55% tổng tiến độ  v2 placeholder  · @TríMinh        │    │
│  │  ↑ MiniStat       ↑ tone primary    ↑ live disabled ↑ MiniStat       │    │
│  │                                                                       │    │
│  │             [⭐ Theo dõi] [</> Repo] [+ Thêm feature]   [⋯ admin]    │    │
│  │             ghost btns                primary CTA      overflow menu │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ TABS (border-b)                                                       │    │
│  │  [Catalog 4] · Activity · Members · Settings                          │    │
│  │   ↑ active primary, count badge      ↑ placeholder tabs (empty state) │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │ ┌──┐ Đăng nhập email   →        │  │ ┌──┐ Voucher sinh nhật     →    │    │
│  │ │📄│ [Đang viết · 18 giờ trước] │  │ │📄│ [Đủ doc · hôm qua]         │    │
│  │ └──┘ icon plate primary-50      │  │ └──┘ success-50                 │    │
│  │                                  │  │                                 │    │
│  │ 2/5 sections          40%        │  │ 5/5 sections        100%        │    │
│  │ ████░░░░░░░ ←progress 6px       │  │ ██████████ ←progress 6px        │    │
│  │ ─────────────────────────────── │  │ ─────────────────────────────── │    │
│  │ [TM][NL]  ● ● ○ ○ ○ ←dots      │  │ [NL]      ● ● ● ● ●             │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │ ┌──┐ Đối soát hoàn tiền  →     │  │ + Tạo feature mới              │    │
│  │ │📄│ [Đang viết · 3 ngày]      │  │   dashed tile circle plus      │    │
│  │ └──┘                             │  │   author-gated trigger         │    │
│  │ 1/5 sections          20%        │  │                                 │    │
│  │ ──────────────────────────────  │  │                                 │    │
│  │ [PT]      ● ○ ○ ○ ○             │  │                                 │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

Hero panel stacks: badges → h1 → subtitle → mini-stats grid 2×2 → action buttons full-width vertical. Tabs scroll horizontally. Cards 1-col.

### Layout primitives

- **Container**: `mx-auto max-w-6xl px-10 py-6` desktop; `px-4 py-4` mobile.
- **Breadcrumb** (top): existing component reused, muted text-sm.
- **Hero panel** (NEW): `relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-[#FFF8EE] via-[#FDEED7] to-[#FFE9D0] dark:from-primary-900/30 dark:via-primary-950/30 dark:to-primary-900/20 p-7 mb-7`.
- **DecorativeMark** (charter §10): NxLogo mark `aria-hidden absolute right-0 top-0 size-72 opacity-[0.18] rotate-[-8deg] translate-x-10 -translate-y-10`, gradient masked.
- **Hero badges row** `mb-2.5 flex items-center gap-2`:
  - `<Badge tone="primary" dot size="sm">Pilot</Badge>` (placeholder hardcoded — no schema).
  - `<Badge tone="success" dot size="sm">Đang chạy</Badge>` (placeholder).
  - `<span className="text-xs text-muted-foreground">· Sprint 14 · Catalog</span>` (hardcoded).
- **h1**: `font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em]` = `project.name`.
- **Subtitle**: `mt-2 text-sm leading-relaxed text-foreground/80 max-w-2xl` = `project.description ?? "Chưa có mô tả · BA và dev sẽ bổ sung context project."` + `· BA: <b>{adminPlaceholder}</b> · Tech lead: <b>{leadPlaceholder}</b>` (placeholder names from createdBy.displayName + hardcoded extra).
- **MiniStat row** (NEW): `mt-6 flex flex-wrap gap-7` chứa 4 `<MiniStat>` (charter §10):
  1. **Features**: label "FEATURES", value `{features.length}`, sub `${features.filter(f => f.filledCount===5).length} đã đủ doc`.
  2. **Sections hoàn thành**: label "SECTIONS HOÀN THÀNH", value `${totalFilled}/${totalSections}` (totalSections = features.length × 5; totalFilled = sum filledCount), tone primary, sub `${pct}% tổng tiến độ`.
  3. **Đang chỉnh**: label "ĐANG CHỈNH", value `—`, sub muted "v2 — đang phát triển" (placeholder).
  4. **Cập nhật cuối**: label "CẬP NHẬT CUỐI", value `${RelativeTime(maxUpdatedAt)}`, sub `· @${maxUpdater ?? "—"}` (compute từ max updatedAt across features).
- **Action cluster** (NEW): hero footer `mt-7 flex flex-wrap items-center gap-2`:
  - `<Button variant="outline" size="sm">⭐ Theo dõi</Button>` placeholder click → toast "Tính năng đang phát triển".
  - `<Button variant="outline" size="sm">[Code icon] Repo</Button>` placeholder click → toast.
  - `<CreateFeatureDialog>` author-gated, primary "+ Thêm feature".
  - Existing `<ProjectActionsMenu>` admin overflow `[⋯]` (US-004) ở phải.

### Tabs (NEW — placeholder)

- Container: `mb-6 flex items-center gap-2 border-b border-border`.
- Items per `<TabBar>` charter §10:
  - **Catalog** (active): `<button role="tab" aria-selected="true" className="px-4 py-3.5 -mb-px border-b-2 border-primary text-primary font-ui font-semibold text-sm flex items-center gap-1.5">Catalog<span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{features.length}</span></button>`.
  - **Activity / Members / Settings** (idle placeholder): `<button role="tab" aria-selected="false" className="px-4 py-3.5 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-ui font-semibold text-sm">{label}</button>`. Click switches to placeholder panel: `<EmptyState icon={Wrench} title="Đang phát triển trong v2" description="Tính năng {label.toLowerCase()} sẽ có ở milestone tiếp theo." />`.

### Feature cards grid (REDESIGN)

- Grid: `grid gap-3.5 sm:grid-cols-1 lg:grid-cols-2`.
- **FeatureCard layout** (`group rounded-xl border border-border bg-card p-4.5 flex flex-col gap-3.5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring`, wraps `<Link>`):
  - **Top row** `flex items-center gap-3`:
    - **Icon plate 36×36**: `rounded-lg flex items-center justify-center bg-{statusBg}` — `success-50` if `filledCount === 5`, `primary-50` if `1..4`, `neutral-100` if `0`. Inside `<FileText className="size-4.5 text-{statusFg}">` matching tone (success-500 / primary-600 / muted-foreground).
    - **Body** flex-1 min-w-0:
      - Title: `<h2>` `font-display text-sm leading-tight font-bold line-clamp-1` = `feature.title`.
      - Status row `mt-1 flex items-center gap-2`: `<Badge tone={statusColor} dot size="sm">{statusLabel}</Badge>` ("Đủ doc" success / "Đang viết" primary / "Draft" neutral) + `<span className="text-[11px] text-muted-foreground">· {RelativeTime}</span>`.
    - **Chevron** `size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition`.
  - **Progress block**:
    - Label row `flex justify-between mb-1.5`: left `font-ui font-semibold text-xs text-foreground/80` "{filled}/5 sections"; right `font-ui font-medium text-xs text-muted-foreground` "{pct}%".
    - `<ProgressBar value={pct} />` 6px primary.
  - **Footer** `pt-2.5 border-t border-border flex items-center justify-between`:
    - Left: `<AvatarStack ids={[updatedByName, ...placeholders]} size="sm">` size-6 ring-2 ring-background. Khi không có `updatedByName` → hide stack.
    - Right: `<SectionDots filled={filledCount} />` charter §10 — 5 dots size-2 rounded-full gap-1.5 (filled = primary-500, empty = neutral-200), `aria-label="${filled}/5 sections có nội dung"`.

### "Tạo feature mới" tile (last cell, author-gated)

`min-h-[140px] rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary-50/30 cursor-pointer transition-all flex items-center justify-center gap-2.5 text-muted-foreground hover:text-primary font-ui font-semibold text-sm`. Plus icon trong primary-50 size-8 rounded-full circle. Click mở existing `<CreateFeatureDialog>`.

### Tokens & typography

- Hero badges: existing `<Badge>` tone primary/success size sm với dot.
- h1: `font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em]`.
- Subtitle: `font-body text-sm leading-relaxed text-foreground/80`.
- MiniStat label: `font-ui text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium`.
- MiniStat value: `font-display text-[22px] leading-none font-bold` (primary tone for stat 2).
- MiniStat sub: `font-body text-xs text-muted-foreground mt-1`.
- Tab label: `font-ui text-sm font-semibold`.
- Card title: `font-display text-sm font-bold leading-tight`.
- Card progress label: `font-ui text-xs font-semibold`.

### Spacing

- Hero panel: p-7, internal gap-6 (between blocks). Hero → tabs: mb-6. Tabs → grid: mb-6. Card grid gap: 3.5.

## Error / empty / loading states

- **Loading**: hero renders text static với MiniStat values "—" placeholder; tabs render với count "?". Below: 3 feature card skeletons match new shape (icon plate 36×36 + 2 text bars + progress bar + footer with avatar circles + dot row). Container `aria-busy="true"`.
- **Empty** (AC-4): replace grid với centered state — `<FolderPlus size-16 text-primary/40 mx-auto>` + h2 `font-display text-xl font-semibold mt-6` "Chưa có feature nào" + sub "Project mới được tạo. Bắt đầu thêm feature đầu tiên để team document." + author CTA `<CreateFeatureDialog />` mt-6.
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

- **Tasks**:
  - Initial: [T9](../stories/US-001/tasks.md#t9--landing--feature-detail-pages) `879b15b`.
  - Admin actions: [US-004 / T7](../stories/US-004/tasks.md#t7--projectactionsmenu-fe--archive-wire) `904e9c8`.
  - UI uplift refresh: CR-002 / Phase 2-2 (TBD hash).
- **Page component**: `apps/web/src/pages/ProjectLandingPage.tsx` — refactor: breadcrumb + hero panel (badges + h1 + subtitle + mini-stats + actions) + tabs + feature grid + author "Tạo feature" tile.
- **Queries**: `useProject(slug)` — unchanged. v1 derive total/filled sections client-side từ `features[].filledCount`.
- **Sub-components**:
  - **NEW**: `apps/web/src/components/projects/ProjectHero.tsx` — hero panel với decorative mark + badges + h1 + subtitle + mini-stats + action cluster.
  - **NEW**: `apps/web/src/components/projects/ProjectTabs.tsx` — TabBar với placeholder panels.
  - **NEW**: `apps/web/src/components/common/MiniStat.tsx` (charter §10).
  - **NEW**: `apps/web/src/components/common/DecorativeMark.tsx` — NxLogo mark wrapper for hero corners.
  - **NEW**: `apps/web/src/components/common/SectionDots.tsx` (charter §10) — 5 dots row.
  - **UPDATE**: `apps/web/src/components/features/FeatureCard.tsx` — redesign per spec (icon plate + status badge + progress + section dots footer).
  - **REUSE**: `Breadcrumb`, `RelativeTime`, `EmptyState`, `Badge`, `Button`, `ProjectActionsMenu` (US-004), `CreateFeatureDialog`, `AvatarStack` (NEW từ Home spec), `ProgressBar` (NEW từ Home spec).
- **Hardcoded/dummy data v1** (skeleton-UI policy charter v2):
  - Hero badges "Pilot" / "Đang chạy" / "Sprint 14 · Catalog" → hardcoded strings.
  - Subtitle BA / Tech lead names → use `project.createdBy.displayName` + hardcoded second name.
  - "Đang chỉnh" mini-stat → render "—" muted với sub "v2 — đang phát triển".
  - Theo dõi / Repo buttons → click handler shows toast "Tính năng đang phát triển trong v2".
  - Tabs Activity / Members / Settings → empty state placeholder.
- **lucide icons**: `Wrench` (placeholder tabs), `Star` (Theo dõi), `Code` or `GitBranch` (Repo), `MoreHorizontal`, `Plus`, `FileText`, `FolderPlus`, `ChevronRight`.
- **Response type**: `ProjectResponse + FeatureListItem[]` từ [@onboarding/shared/schemas/feature.ts](../../packages/shared/src/schemas/feature.ts) — unchanged shape v1.

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
