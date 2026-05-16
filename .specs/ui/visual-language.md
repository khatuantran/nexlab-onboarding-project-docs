# UI Visual Language — Quality Charter v1

<!-- exempt: registry (no template required) -->

_Last updated: 2026-05-16 · v4 amendment (CR-006) · Source of truth cho design quality bar across screens. Mọi UI work phải tuân theo._

Related: [design-system.md](design-system.md) (tokens), [ADR-003](../adr/ADR-003-nexlab-design-system.md) (Nexlab DS adoption), per-screen specs `.specs/ui/<screen>.md`.

---

## 1. Hierarchy

### Typography scale (per screen tier)

| Tier            | Token                                                                | Use                                              |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| Page hero h1    | `font-display text-3xl/9 font-bold tracking-tight`                   | LoginPage, HomePage, project hero, feature hero. |
| Section h2      | `font-display text-2xl font-bold`                                    | Feature sections, search-result groups.          |
| Card title      | `font-display text-lg font-semibold`                                 | ProjectRow, FeatureCard, SearchResultRow.        |
| Body            | `font-body text-sm leading-relaxed`                                  | Description, prose content.                      |
| Meta            | `font-ui text-xs text-muted-foreground`                              | Timestamps, counts, labels.                      |
| Eyebrow / label | `font-ui text-xs font-semibold uppercase tracking-wide text-primary` | Hero eyebrows, section status.                   |

### Spacing rhythm (4pt scale)

- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px (Tailwind 1/2/3/4/6/8/12/16). Avoid arbitrary values trừ khi token miss.
- Card inner: 24px (p-6). Row inner: 20px (p-5). Hero: 32-48px vertical.
- Stack gap: 4 (tight), 8 (related), 16 (sibling), 24 (group), 48 (section break).

## 2. Color usage rules (v4 — CR-006)

v3 lineage (warm canvas + sage) DROPPED. v4 reintroduces a multi-accent palette pinned to specific roles (card category identity, role badges, section nav, integration cards) — discipline below.

- **Primary orange** (`primary`, `primary-50..900`) — Primary CTA buttons (solid + gradient variant), brand wordmark, focus ring, active state, hero blob #1, ProjectCard gradient #1.
- **Accent palette** (`purple`, `green`, `blue`, `rose`, `amber`) v4 — Category identity slots only. ProjectCard 6-gradient header (5 accents + orange), role badges (Admin=rose, PM=purple, BA=orange, Dev=blue, QA=green), section nav (Nghiệp vụ=purple, User flow=orange, Rules=green, Tech=blue, Shots=rose), integration cards. Not for body text or surfaces.
- **Hero dark gradient** (`--hero-1..4`) v4 — Page hero bg, linear-gradient 145deg `#0B0520 → #180E3A → #0C1A3A → #0A0E16`. Full-bleed hero blocks only (HomePage, ProjectLanding, FeatureDetail, Users, Settings, Profile cover, Login left panel). Never on body cards.
- **Logo gradient** (`--logo-grad-start`/`--logo-grad-end`) v4 — Wordmark mask + headline gradient text accent (e.g. h1 "Workspace / của bạn" with gradient span). Sparingly — 1 gradient text element per screen max.
- **Glassmorphism overlay** (`bg-white/{6,10,15,20}` + `backdrop-blur-md`) v4 — Cards / chips layered over dark hero. Never over light bg.
- **Secondary gold** (`secondary`, `secondary-bg/text`) — Achievement chips, "feature count" pills, calm highlight. Light surfaces only.
- **Neutral semantic** (`background`, `foreground`, `muted`, `border`, `card`, `fg-1..4`) — Body text, surfaces, dividers, disabled states. Default. v4 adds explicit `fg-1/2/3/4/inverse` + `bg-subtle/muted/dark` semantic vars.
- **Destructive** — Archive confirms, delete actions, error banners, danger zone in Settings. Sparingly.
- **Success / Warning / Info** — Status badges (active/away/inactive), feedback banners, integration "Đã kết nối" pills. Single-color rule: 1 semantic color per surface.

**Don't**:

- ❌ Mix 3+ accent hues in 1 surface — pick 1 per card / chip / banner.
- ❌ Apply dark hero gradient to body cards or modals — it's a hero-only treatment.
- ❌ Use glassmorphism over light bg — only over the dark gradient hero.
- ❌ Multi-color gradient on buttons — orange-only gradient (135deg `primary` → `primary-700`).
- ❌ Use accent hues for body text — they're identity slots only.

## 3. Surface depth

| Level        | Token                                                    | Use                                   |
| ------------ | -------------------------------------------------------- | ------------------------------------- |
| Flat         | `border-b border-border`                                 | List dividers (catalog rows).         |
| Raised       | `rounded-xl border border-border bg-card shadow-sm`      | Cards (FeatureCard, SearchResultRow). |
| Hover-raised | `hover:shadow-md hover:border-primary/30 transition-all` | Card hover (interactive).             |
| Floating     | `rounded-xl bg-popover shadow-card`                      | Dialogs, dropdowns, toasts.           |

**Hero panel v4** — `GradientHero` primitive (see §13). Dark gradient bg (145deg, 4 stops `--hero-1..4`) with 3 radial color blobs + dot-grid overlay + optional `LogoWatermark`. Use on full-bleed hero blocks only (HomePage, ProjectLanding, FeatureDetail, Users, Settings, Profile cover, Login left panel). v3 light hero (`from-primary-50 via-background to-secondary-bg/50`) is SUPERSEDED.

## 4. Motion

| Trigger               | Duration                | Easing               | Notes                             |
| --------------------- | ----------------------- | -------------------- | --------------------------------- |
| Hover (color/shadow)  | 150ms                   | ease-out             | `transition-all`.                 |
| Hover (chevron slide) | 150ms                   | ease-out             | `group-hover:translate-x-0.5`.    |
| Focus ring            | instant (no transition) | —                    | Always visible, never hidden.     |
| Active (button press) | 100ms                   | ease-in-out          | `active:scale-[0.98]`.            |
| Page transition       | 200ms                   | fade                 | Optional, default route changes.  |
| Skeleton pulse        | 1500ms                  | ease-in-out infinite | Matches Tailwind `animate-pulse`. |

**Reduced motion**: respect `prefers-reduced-motion: reduce` — disable translate + scale, keep color transitions.

## 5. Empty / loading / error patterns

### Empty state (v3 — graphics-rich CR-006)

- Container: centered flex column, `py-16 px-6 max-w-md mx-auto`.
- **Visual**: prominent emoji 4xl (📁 📄 ✨ 👥 etc.) HOẶC lucide icon 56-72px filled bg plate (`size-16 rounded-2xl bg-primary text-white`). No `/40%` tinted icon — v3 dùng solid fill.
- Heading: `font-display text-xl font-semibold` với emoji inline OK ("Chưa có dự án nào ✨").
- Description: **OMIT** by default (v3 "ít chữ" rule). CTA text carries action context.
- Action: 1 primary solid-filled CTA (admin-only roles get inline create dialog).

### Loading state

- Skeleton **must match** real shape (same row height, same avatar/card position) → no layout shift on data arrival.
- Use `animate-pulse bg-muted` rounded blocks. 3 rows minimum cho list, 1 card cho hero, 5 sections cho feature detail.

### Error state

- Banner: `rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive` with role="alert".
- Includes: human reason (1 sentence) + retry button (`variant="outline" size="sm"`).
- Never show raw error code/stack to user.

## 6. Density rules per screen type

| Screen type                          | Row/Card height target  | Notes                                                                                                                               |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Catalog grid (Home) v3               | 200-240px card, 2-3-col | Filled banner top 64-80px + body title + 2 metric chips. NO description paragraph (v3 "ít chữ" rule). 3-col xl, 2-col lg, 1-col sm. |
| Card grid (Project landing features) | 132-180px card, 2-col   | Icon plate + title + status badge + section progress. (Pre-v3 — unchanged this pilot scope.)                                        |
| Detail prose                         | max 65ch read width     | Center column, sidebar TOC fixed at xl breakpoint.                                                                                  |
| Search results                       | 120-140px row           | Title + snippet (line-clamp-3) + meta breadcrumb.                                                                                   |
| Auth (Login)                         | Single panel ~440px     | Hero left + form right (xl); stacked on mobile.                                                                                     |

### Density — moderate visual (v4 — CR-006)

v3 "Ít chữ nhiều hình" rule SOFTENED. v4 allows decorative subtitles + gradient text + eyebrow chips alongside graphics-rich treatment. Goal: bold visual hierarchy without sparse minimalism.

- **Hero**: eyebrow chip (Sprint badge / status) + h1 (2 lines OK, 1 line with gradient span) + optional 1-line subtitle. Stat tiles glassmorphism row (3-4 metrics) instead of inline stats.
- **Stat tiles** (over dark hero): glassmorphism `bg-white/6 border-white/10 backdrop-blur-md` + icon plate gradient (size 40-42, solid color gradient) + value font-display 24-26px + label uppercase 11px white/50.
- **Card grid items** (ProjectCard v4): gradient header h-150 + initials plate + tag pill + Live pill + ProgressRing. Body p-5: title h3 + 1-line description allowed (line-clamp-1) + section dots + bottom row [AvatarStack + features count + activity].
- **Empty state**: dashed border card + filled icon plate 72×72 (accent color/12 bg with /25 border) + heading + 1 sentence body + dual CTA (template + start). KHÔNG full minimal-only as v3 imposed.
- **Buttons**: solid filled or gradient (135deg primary→primary-700 with shadow). Label ngắn + optional icon prefix.

Exception: **content body** (FeatureDetail 5-section prose, MarkdownView) giữ density cao như cũ — core value.

## 7. Illustration & icon policy (v4 — CR-006 dark vivid + glassmorphism)

**Graphics-rich principles** (user constraint, refined 2026-05-16):

- **Icons prominent**: lucide-react ở size **24-48px** cho hero / empty / card primary action; 16-20px chỉ cho inline body. Stroke-width 1.8 default (per reference `icons.jsx`). Tránh dùng icon nhỏ khi có chỗ cho icon lớn.
- **Gradient text headlines**: h1 với gradient span (logo-gradient applied via `bg-clip-text text-transparent`). 1 gradient text per screen max.
- **Emoji as visual accent**: emoji decoration trong eyebrow chips (✦ ✨ ⚙ ⭐ 🚀 👋 ➕) + section labels. Pair với text, không thay chữ entirely.
- **Color-filled icon plates**: icon ngồi trong rounded square `size-10` to `size-14` với **solid accent bg gradient** (`bg-gradient-to-br from-{tone} to-{tone}-700`) — không phải `/10%` tinted. Plate over dark hero uses gradient; plate over light card body uses `bg-{tone}/15` tinted with `text-{tone}` icon.
- **Decorative circles**: card headers may include 2 absolute-positioned circles (rgba white .12 + .07) for depth. Not abstract primitives — inline `<div>`s.
- **Radial blobs in hero**: 3-4 absolute-positioned radial gradients (orange / purple / blue / green / rose tints, 280-360px, opacity 0.3-0.45) over the dark hero bg. Reusable via `GradientHero` `blobs` prop.
- **Dot grid + line grid overlays**: subtle (opacity 0.05-0.10) over hero bg for texture.
- **Logo watermark**: masked SVG with logo gradient, opacity 0.10-0.13, positioned absolute top-right of hero. Via `LogoWatermark` primitive.
- **ProgressRing**: SVG circular progress (size 44-56) for card headers + feature progress. White stroke over color gradient, primary stroke over light bg.

**Allowed**:

- Hero areas: dark gradient bg + 3 radial blobs + dot grid + logo watermark + gradient text headlines.
- Card headers: gradient bg (1 of 6 palettes for ProjectCard, accent color gradient for SectionContent) + decorative circles + ProgressRing.
- Glassmorphism cards over dark hero (bg-white/{6,10,15,20} + backdrop-blur-md + border-white/10).
- Inline emoji decoration trong eyebrow + section labels + CTA.

**Still banned**:

- ❌ Character illustrations (Storyset / unDraw).
- ❌ Stock photography (Unsplash / Pexels).
- ❌ 3D renders / claymorphism.
- ❌ Light hero gradients (`from-primary-50 via-background to-secondary-bg`) — v2/v3 lineage superseded.
- ❌ Warm canvas / sage tinted surfaces (v3 lineage dropped).
- ❌ Tinted icon plates `/10%` for primary surfaces (v1/v2 pattern) — v4 uses solid gradient or rgba-white-glass.

Avatar: deterministic letter-based (slug hash → accent palette per role / category), font-display bold uppercase. Image upload land US-009.

## 8. Accessibility floor

- Contrast: 4.5:1 body / 3:1 large text. Spot check via DevTools when introducing new color combo.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` always visible, never `outline-none` without replacement ring.
- Aria-label on icon-only buttons (chevron, overflow menu, close).
- Semantic roles: list/listitem cho catalog, article cho feature, dialog cho modals.
- Keyboard: Tab order matches visual order; Esc closes dialog/dropdown.

## 9. Don'ts (anti-patterns to avoid)

- ❌ Italic placeholder text "(chưa có ...)" cho missing content — drop entirely or render different visual cue (muted dot).
- ❌ Plain text for primary actions — always use `<Button>` component.
- ❌ Single hover state across all rows — give visual reward (border/shadow/chevron-slide).
- ❌ Raw `<svg>` larger than 24px without container — wrap in icon plate or avatar.
- ❌ Mixing `font-display` + `font-body` in same heading.
- ❌ Truncate (no ellipsis) for descriptions — always `line-clamp-N` with overflow visible.
- ❌ `bg-muted` only for hover — at minimum add border or shadow shift.
- ❌ Generic "Loading...", "Error" text — be specific ("Đang tải catalog", "Không tải được, thử lại").

## 10. Component patterns (Workspace style — v2)

Reusable visual patterns appearing across multiple screens. Implement as shared primitives khi xuất hiện ≥2 screens.

### StatChip (used: Home hero, Project detail mini-stats, dashboard placeholders)

- Horizontal row: icon plate (36×36 `rounded-lg bg-{tone}/14%`) + value (font-display 18-22px bold) + label (text-xs uppercase tracking-wide muted).
- Tones: primary (orange) / success (green) / info (indigo) / warning (amber).
- Container: `rounded-xl border border-border bg-card px-4 py-2.5`.
- Use cho hero stat clusters (3-4 metrics row), không cho inline body text.

### FloatStat (used: Login brand panel only)

- Floating card 240px wide trên gradient backdrop: `rounded-2xl bg-white/92 backdrop-blur-md shadow-card ring-1 ring-white/60`.
- Icon plate top + label + value (font-display 28px) + delta line ("+3 tuần này", colored theo tone).
- 2-4 cards positioned absolutely với offsets, tạo collage.

### MiniStat (used: Project detail hero)

- Vertical stack: label uppercase 11px tracking-wide muted → value font-display 22px bold (optional primary tone) → sub-line text-xs muted.
- Inline trong hero panel (gap-7 horizontal between stats).
- Optional `live` prop adds pulsing dot prefix (success-500).

### ProgressStrip (used: Feature detail header)

- Horizontal panel `rounded-xl bg-muted/40 border border-border px-4 py-3.5`.
- Layout: large fraction left (e.g. "2/5 section đã có", font-display 22px primary) + 5-segment progress bar middle (each segment `flex-1 h-1.5 rounded-full`, filled = primary-500, empty = neutral-200) + segment labels below + (optional) avatar stack right with "N người đang chỉnh" placeholder.

### SectionDots (used: Feature card footer)

- Inline row of 5 dots size-2 rounded-full, gap-1.5.
- Filled = primary-500; empty = neutral-200.
- Aria-label: `"{filled}/5 sections có nội dung"`.

### Avatar / AvatarStack

- Single Avatar: `rounded-full ring-2 ring-background size-7` với letter initials gradient bg theo hash.
- Stack: 2-3 avatars overlap với `-ml-2`, last có `+N` chip nếu nhiều hơn.
- Use cho contributor visibility.

### LiveIndicator (placeholder v1)

- Pulsing dot success-500 + label.
- v1: hardcoded "0 đang chỉnh" hoặc hide nếu count=0. Real-time presence deferred (FR mới sau).

### TabBar (used: Project detail)

- Horizontal `border-b border-border` row, items `px-4 py-3.5 font-ui font-semibold text-sm` muted; active item `text-primary` + `border-b-2 border-primary -mb-px`.
- Optional count badge sau label: pill 10px primary bg với white number.
- v1: chỉ Catalog tab active; Activity/Members/Settings render placeholder empty state.

### Gradient button + vivid card banner pattern (v4 — CR-006)

Reusable filled / gradient patterns across screens for dark vivid + glassmorphism feel. Supersedes v3 flat-color-block banner.

**Buttons**:

- **Primary (gradient)**: `bg-gradient-to-br from-primary to-primary-700 text-white shadow-[0_4px_16px_rgba(226,99,20,0.45)] hover:from-primary-600 hover:to-primary-800 active:scale-[0.98]`. Use cho main CTA per page (e.g. "Tạo mới", "Lưu thay đổi", "Bắt đầu viết").
- **Primary (solid)**: `bg-primary text-primary-foreground hover:bg-primary-600`. Use cho compact CTAs trong floating filter bar / tab row.
- **Ghost over dark hero**: `bg-white/10 border border-white/25 text-white backdrop-blur-sm hover:bg-white/15`. Use cho secondary actions over dark hero (star, repo, view PR).
- **Ghost over light bg**: `bg-card border border-border text-fg-1 hover:bg-bg-subtle`. Use cho secondary actions trên light content (cancel, edit).
- **Destructive solid**: `bg-gradient-to-br from-rose-500 to-rose-700 text-white` cho confirm dialogs. Outline variant `border-rose-500 text-rose-500` cho danger zone.

Default main CTA: **gradient primary**. KHÔNG dùng outline cho main CTA.

**Vivid card banner** (ProjectCard v4):

- Header gradient `bg-gradient-to-br from-{tone}-700 to-{tone}-500`, `min-h-[150px] p-5 text-white overflow-hidden relative`.
- 6 palettes by hash: orange / purple / green / blue / rose / amber (each `{tone}-700` → `{tone}-500` gradient).
- 2 decorative circles absolute (rgba white .12 + .07, 140 / 100px) for depth.
- Top row: initials plate 46×46 `rounded-xl bg-white/22 text-white font-display font-bold` + tag pill + Live pill or admin overflow.
- Top-right: `ProgressRing` 52px white-on-white-glass.
- Body p-5 light: title h3 + 1-line desc + section dots row + bottom row [AvatarStack + features count + activity].

**Stat tile (glassmorphism over dark hero)**:

- `rounded-2xl p-4 bg-white/6 border border-white/10 backdrop-blur-md text-center` (over `GradientHero`).
- Icon plate gradient 40×40 `bg-gradient-to-br from-{tone} to-{tone}-700 text-white shadow` + value font-display 24-26px white + label uppercase 11px white/50.

**Empty state v4**:

- Dashed border card `p-8 rounded-2xl border-2 border-dashed border-{tone}/30 bg-{tone}/5 backdrop-blur-sm flex items-center gap-5`.
- Icon plate 72×72 `rounded-2xl bg-{tone}/12 border border-{tone}/25 text-{tone}` + heading + 1-line body + dual CTAs (template + start).

**Don't**:

- ❌ Mix outline + gradient buttons trong 1 group — pick one variant.
- ❌ Subtle tinted bg (`bg-primary/10`) cho buttons — v4 dùng gradient.
- ❌ Flat color block banner — v4 dùng gradient header.

### DecorativeMark (used: hero panels Home, Project detail, Login)

- Absolute positioned NxLogo mark variant, gradient masked, opacity 5-18%, rotated -8deg.
- Size 280-520px depending on hero size.
- `aria-hidden="true"`, no semantic role.

### TemplateRadio (used: Add Feature dialog)

- Card-style radio: `rounded-lg border-1.5 px-3 py-2.5` với active state `border-primary` + `bg-primary-50` + `shadow-[0_0_0_3px_rgba(240,118,19,0.12)]`.
- Top row: dot indicator (size-3.5 round, primary fill if active) + label bold.
- Sub-text 11px muted describing template content.

### EmptyDashedCard (used: empty section, "Tạo feature mới" tile)

- Container: `rounded-xl border-2 border-dashed border-border bg-transparent p-6 flex items-center gap-3.5`.
- Icon circle (32 round bg-primary-50) + heading + sub + (optional) inline action.
- Khác standard EmptyState ở chỗ inline (in-flow, không centered page).

## 11. Glassmorphism layering (v4 — CR-006)

Glassmorphism is a v4 NEW pattern — used over the dark hero only.

- **Base**: `bg-white/{6,10,15,20}` + `border border-white/{10,15,25,30}` + `backdrop-blur-md` (or `-sm` / `-lg`).
- **Levels**:
  - `bg-white/6 + border-white/10` — stat tile (subtle, low priority).
  - `bg-white/12 + border-white/20` — feature pill / testimonial card.
  - `bg-white/18 + border-white/25` — initials plate / Live pill.
  - `bg-white/22 + border-white/30` — section nav active state pill / drag-handle.
- **Never over light bg** — glassmorphism only exists over the dark hero gradient or dark gradient banner. On light surfaces, use solid `bg-card border-border shadow-sm` instead.
- **Text contrast over glass**: always `text-white` (over dark hero) or `text-fg-1` (over light, but glass isn't used there).
- **Don't** stack 3+ glass layers — readability collapses.

## 12. Pattern primitives v2 (v4 — CR-006)

Replaces CR-006 v3 single CircleDecor primitive. v4 introduces 3 cooperating primitives at `apps/web/src/components/patterns/`.

- **GradientHero** — Wraps dark gradient bg + 3 radial color blobs (configurable color tuple) + dot-grid overlay + optional `<LogoWatermark>` slot + slot for hero content. Use as page hero block.
- **LogoWatermark** — Absolute-positioned masked SVG with logo gradient. Props: `size`, `opacity`, `className`. Use inside `GradientHero` `watermark` slot.
- **ProgressRing** — SVG circular progress. Props: `pct`, `size` (44-56 default), `color`, `bg`, `strokeWidth`. Use in card headers + feature progress.
- **DROPPED in v4**: `CircleDecor` (v3.1 primitive — replaced by inline circle `<div>`s in card headers).

## 13. Tone & copy (v4 — CR-006)

Friendly welcoming + minimal Vietnamese natural. Examples:

- Hero: "Góc onboarding 👋", "Chào mừng trở lại", "Sẵn sàng làm việc thôi ✨".
- CTA: "+ Tạo dự án mới", "Bắt đầu thôi 🚀", "Xem chi tiết →".
- Empty state: "Chưa có dự án nào ✨", "Trống trơn 🍃 — tạo một cái đầu tiên".
- Section header: "Dự án", "Hoạt động gần đây", "Đang theo dõi".

Avoid:

- ❌ Long sentences explaining purpose ("Tất cả tài liệu onboarding cho các sprint đang chạy..." → cut, replace bằng visual).
- ❌ Formal stiff ("Vui lòng chọn dự án để xem chi tiết" → "Chọn 1 dự án →").
- ❌ Eyebrow + h1 + subtitle stack ở hero — chỉ h1, subtitle optional ≤ 1 dòng.
- ❌ Generic "Click here", "Submit" — luôn verb cụ thể tiếng Việt.

## 14. Compliance

Mọi PR đụng UI:

1. Tham chiếu charter section trong commit body khi quyết định không obvious (e.g., "per visual-language §3 hero panel").
2. Per-screen spec `.specs/ui/<screen>.md` §Visual structure phải align charter — nếu deviate, update charter (cùng commit) không silently override.
3. Tests preserve aria-labels + semantic roles.

## CHANGELOG

| Version | Date       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | 2026-04-25 | Initial charter (CR-002). 5 screens uplift baseline. Hero panel pattern + density rules established.                                                                                                                                                                                                                                                                                                                                     |
| v2      | 2026-04-25 | Workspace-style amendment: §6 Home density list→grid 2-col 180-220px; §10 NEW component patterns (StatChip, FloatStat, MiniStat, ProgressStrip, SectionDots, AvatarStack, LiveIndicator placeholder, TabBar, DecorativeMark, TemplateRadio, EmptyDashedCard); §11 renumbered. Skeleton-UI policy: build full reference design, dummy/placeholder cho data chưa có (no realtime presence, activity log static, tabs Catalog-only active). |
| v3      | 2026-05-16 | CR-006 — Notion warm + graphics-rich. §2 add canvas + sage groups. §5 empty state filled icon / 4xl emoji + drop description. §6 NEW Ít chữ nhiều hình rule. §7 rewrite icon policy: prominent 24-48px + emoji + filled plates. §10 NEW Filled button + banner pattern. §11 NEW Tone & copy friendly minimal.                                                                                                                            |
| v4      | 2026-05-16 | CR-006 amend — Dark vivid + glassmorphism (supersedes v3 / v3.1). See §2 / §3 / §6 / §7 / §10 / §11 / §12 for full v4 changes; details below.                                                                                                                                                                                                                                                                                            |

### v4 change details

- §2 — drop canvas + sage, reinstate multi-accent palette (purple/green/blue/rose/amber) for category identity slots; add dark hero gradient (`--hero-1..4`), logo gradient, glassmorphism overlay tokens.
- §3 — hero panel → `GradientHero` primitive (replaces light v3 hero).
- §6 — density softened to moderate visual (decorative subtitles + gradient text allowed). v3 "Ít chữ nhiều hình" rule replaced.
- §7 — rewrite icon policy: gradient text headlines + radial blobs + dot grid + logo watermark + ProgressRing + glassmorphism over dark.
- §10 — Gradient button + Vivid card banner (6 palettes for ProjectCard) supersedes v3 flat color block.
- §11 NEW — Glassmorphism layering (over dark hero only).
- §12 NEW — Pattern primitives v2 (`GradientHero` / `LogoWatermark` / `ProgressRing`; drop `CircleDecor`).
- §13 — Tone & copy unchanged from v3.
