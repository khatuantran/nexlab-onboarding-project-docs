# UI Spec — Home (Project Catalog)

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `home`
- **Status**: v2 Workspace shipped (CR-002 / Phase 2-1 `1d76919`); v3 + v3.1 Notion warm shipped (CR-006 pilot `a03f9c4` / `ab92574`); **v4 Dark vivid + glassmorphism pending (CR-006 v4 amend — supersedes v3 / v3.1 Wire-level + ProjectCard sections)**.
- **Last updated**: 2026-05-16 (v4 amend)

## v4 amendments (CR-006 v4 — Dark vivid + glassmorphism) — supersedes v3 / v3.1 + Wire-level below

Pilot scope per [CR-006 §Iteration v4](../changes/CR-006.md) + charter v4 [visual-language.md §2/§3/§7/§10/§11/§12](visual-language.md). Replaces v3 + v3.1 amendments. State machine + Route + A11y + Maps US unchanged from v2/v3.

### Page background

- Use default `bg-background` (light) / dark variant. v3 `bg-canvas` warm off-white DROPPED.

### Hero — dark gradient + 3 blobs + 4 stat tiles

- Container: full-bleed `<GradientHero blobs={[orange, purple, blue]} showWatermark gridOverlay>` (primitive in `apps/web/src/components/patterns/`). Padding `pt-11 pb-14 px-10` (44-56 vertical, 40 horizontal). Below AppHeader, no rounded corners on container — bleeds full width.
- Internal layout `relative flex items-end gap-10`:
  - **Left** flex-1: eyebrow chip "✦ Sprint 14 · Q2 2026" `inline-flex rounded-full px-3.5 py-1 bg-primary/22 border border-primary/45 font-ui text-[11px] uppercase tracking-[0.12em] text-[#FFD092]` + (optional) Live chip `inline-flex items-center gap-1.5 rounded-full bg-green-500/18 border border-green-500/40 px-3.5 py-1 font-ui text-[11px] text-green-200` with pulsing dot + "2 đang chỉnh". Then h1 2 lines `font-display text-[56px]/[60px] font-black tracking-[-0.03em] text-white`: line 1 plain "Workspace" + line 2 gradient span "của bạn" applying `bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))] bg-clip-text text-transparent`.
  - **Right** stat tiles: `grid grid-cols-4 gap-2.5 w-[552px]` (128px col × 4 + gaps). Each tile glassmorphism `rounded-2xl bg-white/6 border border-white/10 backdrop-blur-md p-[18px_14px_16px] text-center`:
    - Icon plate `inline-flex size-[42px] rounded-xl bg-gradient-to-br from-{tone} to-{tone}-700 shadow-[0_4px_14px_rgba(0,0,0,0.35)] mb-2.5 items-center justify-center` + icon size-5 white.
    - Value `font-display text-[26px] font-black tracking-[-0.02em] text-white` + label `mt-1.5 font-ui text-[11px]/[1.3] font-semibold text-white/50`.
    - 4 tiles: (1) Folder + count Projects (primary), (2) Check + count Đủ tài liệu (green), (3) Users + count Đóng góp (purple), (4) Clock + "2.3h" Onboard TB (blue).

### Floating filter bar — over hero edge

- Wrapper `px-10 -mt-[22px] relative` (negative top margin overlaps hero bottom).
- Inner `bg-background rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-border p-2.5 px-3.5 flex items-center gap-2`:
  - Search icon (size-4 muted) + `<input>` placeholder "Tìm project, owner, tag..." `flex-1 border-none outline-none bg-transparent font-ui text-sm font-medium text-foreground`.
  - Divider `w-px h-[22px] bg-border`.
  - Filter chip group: 4 buttons ["Tất cả", "Đang chạy", "Đủ doc", "Cần bổ sung"]. Each `h-8 px-3.5 rounded-md font-ui text-[13px] font-semibold cursor-pointer transition`. Active = `bg-primary text-primary-foreground`. Idle = `bg-transparent text-muted-foreground hover:text-foreground`.
  - Divider `w-px h-[22px] bg-border`.
  - Admin only: "Tạo mới" CTA `h-9 px-3.5 rounded-[10px] bg-primary text-white font-ui text-[13px] font-bold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(226,99,20,0.35)] cursor-pointer` + Plus icon size-3.5. Click → `<CreateProjectDialog>` (existing).

### Project count + view toggle row

- Wrapper `px-10 pt-5 pb-4 flex items-center justify-between`:
  - Left: `font-ui text-[14px] font-bold text-foreground` "{projects.length} projects".
  - Right: view toggle pair (Grid icon active = `bg-primary-50 border-primary-500/30`, List icon idle = `bg-background border-border`). Each button `size-8 rounded-md border border-border inline-flex items-center justify-center cursor-pointer`. v4 ship Grid-only active; List render placeholder.

### Project grid — VividProjectCard 3-col

- Wrapper `grid grid-cols-3 gap-4 px-10 pb-15`. Mobile collapses 1-col / tablet 2-col.
- Each card = `<ProjectCard project={...}>`. See §"ProjectCard v4" below.
- Admin only: last cell rendered as dashed "Tạo dự án mới" tile `min-h-[200px] rounded-2xl border-2 border-dashed border-border bg-transparent p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground font-ui text-[13px] font-semibold cursor-pointer hover:border-primary/40 hover:bg-primary-50` + icon plate `size-12 rounded-2xl bg-primary-50 inline-flex items-center justify-center` containing Plus size-6 primary-600.

### ProjectCard v4 (replaces v3 banner-top + v3.1 full-color tile)

User mockup 2026-05-16 (new export) supersedes the v3.1 muted tile. v4 is a layered card: gradient header (1 of 6 vivid palettes) + light body with rich metrics.

- Container: `<Link>` wraps card `rounded-2xl overflow-hidden border border-border bg-card flex flex-col card-hover` (card-hover = `transition-[transform,box-shadow,border-color] duration-150 cursor-pointer hover:translate-y-[-1px] hover:shadow-md hover:border-primary-300`).
- **Header** (gradient): `p-[22px_22px_18px] bg-gradient-to-br from-{tone}-700 to-{tone}-500 relative overflow-hidden min-h-[150px]`. Tone determined by `slug` hash → 1 of 6: orange / purple / green / blue / rose / amber (Tailwind classes via accent palette tokens).
  - 2 decorative circles absolute (rgba white/.12 + white/.07) — first `right-[-40px] top-[-40px] size-[140px] rounded-full bg-white/12`, second `left-[-20px] bottom-[-30px] size-[100px] rounded-full bg-white/7`.
  - Top row `relative flex justify-between items-start`:
    - **Left stack**: initials plate `inline-flex size-[46px] rounded-xl bg-white/22 shadow items-center justify-center font-display text-[17px] font-extrabold text-white mb-2.5` (initials = first 2 chars of first word uppercase). Below: tag pill + Live pill side-by-side `flex gap-1.5 flex-wrap`.
      - Tag pill `inline-flex rounded-full bg-white/22 border border-white/30 px-2.5 py-1 font-ui text-[11px] font-bold text-white` containing project category label (placeholder = deterministic 1 of 6 strings from slug hash).
      - Live pill (if `featureCount > 0`): `inline-flex items-center gap-1.5 rounded-full bg-white/18 border border-white/25 px-2.5 py-1 font-ui text-[11px] font-bold text-white` + pulsing dot `size-1.5 animate-pulse rounded-full bg-white`.
      - Admin overflow menu (replaces Live slot when role=admin): `<ProjectActionsMenu>` mounted inside a `bg-white/15 backdrop-blur-sm rounded-md` wrapper.
    - **Right**: `<ProgressRing pct={pct} size={52} color="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.2)" />` + "doc" subscript `mt-1 font-ui text-[10px] font-semibold text-white/70`. pct placeholder = `((hash >> 4) % 6) * 20` (0/20/40/60/80/100 cycle) until BE filledSectionCount lands.
- **Body** (light): `p-[16px_22px_20px] flex flex-col gap-2.5 flex-1`:
  - Title h3 `font-display text-[15px]/[20px] font-bold text-foreground line-clamp-1` + desc `font-body text-[12px]/[17px] text-muted-foreground line-clamp-1 mt-1.5`.
  - Section dots progress row: `flex items-center gap-1` containing N cells `flex-1 h-[5px] rounded-full bg-primary` (filled) or `bg-muted` (empty) + counter `font-ui text-[12px] font-bold text-foreground/80 ml-2` "{filledSections}/{totalSections}".
  - Bottom row `pt-2.5 border-t border-border flex items-center justify-between`:
    - Left: `<AvatarStack>` (3 names from pool deterministic by hash, size="xs") + `font-ui text-[12px] font-semibold text-muted-foreground` "{featureCount}f".
    - Right: activity indicator — `inline-flex items-center gap-1.5 font-ui text-[12px] font-medium`. Color green-500 + pulsing dot when "live" (activeNow > 0); else Clock icon size-3 muted + relative time.

### Tile palette mapping (v4)

Replaces v3.1 muted tile palette. 6 vivid gradient palettes mapped by `slug` hash modulo:

| Hash bucket | Tone     | Tailwind classes                  | Reference (500)     |
| ----------- | -------- | --------------------------------- | ------------------- |
| 0           | `orange` | `from-primary-700 to-primary-500` | `#F07613 → #BB4A13` |
| 1           | `purple` | `from-purple-700 to-purple-500`   | `#8B5CF6 → #6D28D9` |
| 2           | `green`  | `from-green-700 to-green-500`     | `#10B981 → #047857` |
| 3           | `blue`   | `from-blue-700 to-blue-500`       | `#3B82F6 → #1D4ED8` |
| 4           | `rose`   | `from-rose-700 to-rose-500`       | `#F43F5E → #BE123C` |
| 5           | `amber`  | `from-amber-700 to-amber-500`     | `#F59E0B → #B45309` |

Category labels per tone (placeholder — replaces v3.1 set): unchanged 6 fixed strings ("E2E" / "Backend" / "Search" / "Payment" / "CRM" / "Admin") deterministic by hash. BE category field deferred.

### Empty state (v4)

- Centered `flex flex-col items-center gap-4 py-16 px-6 max-w-md mx-auto text-center`.
- Visual: emoji 4xl "📁" OR icon plate `size-16 rounded-2xl bg-primary text-white inline-flex items-center justify-center` containing FolderOpen size-7.
- Heading "Chưa có dự án nào ✨" `font-display text-xl font-semibold`.
- Description — 1 line `text-sm text-muted-foreground`: "Tạo dự án đầu tiên để team bắt đầu document features." (admin) / "Liên hệ admin để bắt đầu." (author).
- Admin CTA: gradient primary button "Tạo dự án đầu tiên".

### Tokens & typography (v4)

- Page bg: default `bg-background`. v3 `bg-canvas` DROPPED.
- Hero bg: `GradientHero` (dark gradient + blobs + watermark).
- Glassmorphism on stat tiles: `bg-white/6 border-white/10 backdrop-blur-md` (over dark hero).
- Card body: light `bg-card`. Card header: 1 of 6 vivid gradients (tone palette per §Tile palette mapping).
- Buttons: primary `bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(226,99,20,0.35)]`; floating filter chips active `bg-primary text-white`.
- Border-radius: cards `rounded-2xl`. Filter bar `rounded-2xl`. Buttons `rounded-[10px]`. Tile plates `rounded-xl`.

## v3 amendments (CR-006 pilot — Notion warm + graphics-rich) — superseded by v4 above

Pilot scope per [CR-006](../changes/CR-006.md) + charter v3 [visual-language.md](visual-language.md). Replaces v2 Workspace wire (CR-002). State machine + Interactions + A11y + Maps US unchanged.

### Hero (replaces Wire §HERO ROW + Tokens.hero subtitle)

- **Layout**: compact `py-8 mb-6`. KHÔNG hero panel rounded-2xl. Plain `bg-canvas` page bg.
- **Title**: h1 "Góc onboarding 👋" (emoji inline). `font-display text-[36px] leading-10 font-bold tracking-[-0.02em]`. **Drop eyebrow** "Workspace của bạn".
- **Subtitle**: **OMIT** by default (v3 "ít chữ" rule). Visual carries context — stat boxes + project cards thay vì copy.

### Stat row (replaces v2 StatChip cluster)

- 3-col grid `grid sm:grid-cols-3 gap-4 mb-8`. Each card `rounded-2xl border border-border bg-card p-5 flex items-center gap-4`.
- Layout per card:
  - **Icon plate** `size-12 rounded-xl bg-{tone} text-white flex items-center justify-center shrink-0`. Icon size-6. **Solid filled** (không tinted /10% như v2).
  - **Value + label** stack: value `font-display text-[32px] leading-none font-bold tabular-nums` + label `mt-1 font-ui text-[11px] uppercase tracking-wide text-muted-foreground`.
- **Tones**: card 1 primary (Project active, FolderOpen icon) · card 2 sage (Feature đủ doc, CheckCircle2 icon) · card 3 sage (Đang đóng góp, Users icon). Sage cho 2 cards — không multi-accent.

### Section header (NEW — replaces filter pill row)

- `flex items-center justify-between gap-3 mb-5`.
- **Left**: h2 "Dự án" `font-display text-[20px] font-semibold text-foreground`.
- **Right cluster**:
  - "Lọc" outline button: `Button variant="outline"` + Filter icon size-3.5 + label. Click → ProjectFilterMenu dropdown (4 options Tất cả / Đang viết / Cần bổ sung).
  - Admin: **"+ Tạo dự án mới" solid filled primary CTA** (`Button` default variant). KHÔNG eyebrow / pre-text.

### Project card grid (v3.1 — replaces v3 banner-top with full-color rich tile)

User mockup 2026-05-16 rejected v3 banner-top + 2-pill body design as "quá basic". v3.1 ProjectCard là full-color solid tile với rich data.

- Grid `grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`. Each tile fixed `h-[220px]`.
- **Tile structure** (full rewrite from v3):
  - Container: `<Link>` wraps entire tile `group relative flex h-[220px] flex-col overflow-hidden rounded-2xl p-5 text-white transition-all hover:scale-[1.01] hover:shadow-lg bg-tile-{tone}`. KHÔNG separate body section — toàn tile là 1 color block.
  - **Tone**: deterministic từ slug hash → 1 trong 6 tile palette tones (`tile-orange` / `tile-navy` / `tile-green` / `tile-amber` / `tile-peach` / `tile-rust`). See [design-system.md §1.1 Project tile palette](design-system.md#11-token-map).
  - **CircleDecor backdrop**: `<CircleDecor className="absolute -bottom-8 -right-8 h-48 w-48 text-white" opacity={0.18} />`. 2 overlapping circles, currentColor white. Subtle geometric visual reward.
  - **Top row** `relative flex items-center justify-between gap-2`:
    - **Category tag pill** (left): `inline-flex rounded-md bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white`. Label deterministic từ tone → 1 trong 6 fixed strings ("E2E" / "Backend" / "Search" / "Payment" / "CRM" / "Admin"). v1 placeholder cho tới khi BE có category field.
    - **Live indicator** (right, hide nếu admin): `inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] uppercase tracking-wide text-white` + pulsing dot `size-1.5 animate-pulse rounded-full bg-white`. v1: hardcoded "Live" khi `featureCount > 0`.
    - **Admin overflow menu** (right, replaces Live slot): `ProjectActionsMenu` trong white/15 backdrop-blur chip. v3.1 rule: admin gets menu, author gets Live indicator.
  - **Title** `relative mt-2 line-clamp-1 font-display text-[15px] font-semibold text-white`. Compact since color is visual identity.
  - **Big %** `relative mt-auto flex items-end gap-1` chứa value `font-display text-[56px] leading-none font-bold tabular-nums text-white` + "doc" subscript `mb-2 font-ui text-xs text-white/70`. **Placeholder pct** = `((hash >> 4) % 6) * 20` → values 0/20/40/60/80/100 cycle for visual richness until BE filledSectionCount lands.
  - **Progress bar** `relative mt-3 h-1 overflow-hidden rounded-full bg-white/20` + fill `h-full bg-white rounded-full transition-all duration-500` width = `${pct}%`.
  - **Bottom row** `relative mt-3 flex items-center justify-between gap-2 font-ui text-[11px] text-white/85`:
    - Left: "{filled}/{total} sections · {N} feature(s)" — `filled = round(total * pct / 100)`, `total = featureCount * 5`.
    - Right cluster: `AvatarStack` (3 names from pool ["EK","PT","KT","NL","TR","TM"] deterministic by hash, size="xs") + `RelativeTime` (white-ish via `!text-[11px] !text-white/85` overrides).
- **Hover**: `hover:scale-[1.01] hover:shadow-lg`. Tone unchanged.

### Tile palette mapping reference

| Tone (hash bucket) | Category label | Notes                |
| ------------------ | -------------- | -------------------- |
| `tile-orange`      | E2E            | Default first bucket |
| `tile-navy`        | Backend        |                      |
| `tile-green`       | Search         |                      |
| `tile-amber`       | Payment        |                      |
| `tile-peach`       | CRM            |                      |
| `tile-rust`        | Admin          |                      |

v1 placeholder: real `category` field doesn't exist on `ProjectSummary` schema. Deferred until BE extension.

### Admin Create tile (admin only, last cell)

- Dashed border tile: `flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-canvas hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring`.
- **Icon prominent**: `size-12 rounded-2xl bg-primary text-white flex items-center justify-center` chứa Plus icon size-6.
- Label: "Tạo dự án mới" `font-display text-[16px] font-semibold text-foreground`.
- **KHÔNG sub-line** (cắt per "ít chữ" rule).
- Click → CreateProjectDialog (existing component, customTrigger).

### Empty state (replaces v2 EmptyState)

- Container: `flex flex-col items-center gap-4 py-16 px-6 max-w-md mx-auto text-center`.
- **Visual**: emoji 4xl "📁" hoặc large filled icon `size-16 rounded-2xl bg-primary text-white flex items-center justify-center` với FolderOpen size-7. Pick emoji-led cho warmer feel.
- **Heading**: "Chưa có dự án nào ✨" `font-display text-xl font-semibold`.
- **Description**: **OMIT** (v3 rule).
- **Action**: admin solid-filled CTA "+ Tạo dự án đầu tiên" (Button default) · author không CTA.

### Tokens & typography (v3)

- Page bg: `<main className="bg-canvas">` (warm off-white) — override page-level only.
- Card surface: `bg-card`. Card banner top: `bg-primary` hoặc `bg-sage` solid.
- Buttons: primary solid filled · "Lọc" outline · ghost cho admin overflow.
- Border-radius: cards `rounded-2xl` (bumped từ rounded-xl v2).

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

| Trigger                                     | Action                                                                                    | Next state                 | Side effect                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| Page mount                                  | `useProjects()` TanStack Query fetch                                                      | loading → list/empty/error | Cache key `["projects"]`                                                        |
| Click row (or Enter on focused row)         | Navigate `/projects/:slug` (semantic `<a>`)                                               | unmount                    | SPA push; scroll top on new screen                                              |
| Hover row (desktop)                         | Subtle elevation `hover:shadow-sm` + `hover:bg-muted/30`                                  | —                          | Visual affordance only                                                          |
| Click "Tạo project đầu tiên" (empty, admin) | Mở `CreateProjectDialog` (shared với AppHeader trigger)                                   | empty (dialog overlay)     | Dialog internal state (independent instance — không conflict)                   |
| Click "Thử lại" (error)                     | `refetch()` từ TanStack Query                                                             | error → loading            | —                                                                               |
| Click ⋯ overflow trên card (admin)          | Mở `ProjectActionsMenu` (Sửa / Lưu trữ); event stopPropagation tránh navigate vào project | list (menu overlay)        | Reuse component từ ProjectLandingPage; lưu trữ invalidates `["projects"]` cache |

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
