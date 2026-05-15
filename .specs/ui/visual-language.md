# UI Visual Language — Quality Charter v1

<!-- exempt: registry (no template required) -->

_Last updated: 2026-05-15 · v3 amendment · Source of truth cho design quality bar across 5 screens. Mọi UI work phải tuân theo._

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

## 2. Color usage rules

| Color group                                                         | When                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Primary orange** (`primary`, `primary-50..900`)                   | Primary CTA buttons, active state, brand accents (logo, hero gradient), focus ring, hover transitions. |
| **Secondary gold** (`secondary`, `secondary-bg/text`)               | Achievement / count chips, success-tinted surfaces, "feature count" pills, calm highlight.             |
| **Accent palette** (`accent-blue/green/purple/pink/cyan/amber`) v3  | Category identity, section type color, status diversity. 1 accent per surface; KHÔNG thay primary CTA. |
| **Neutral** (`background`, `foreground`, `muted`, `border`, `card`) | Body text, surfaces, dividers, disabled states. Default; use unless brand moment.                      |
| **Destructive**                                                     | Archive confirms, delete actions, error banners. Sparingly.                                            |
| **Success / Warning / Info**                                        | Status badges, banners. Single-color rule: 1 semantic color per surface.                               |

**Don't**: mix primary + secondary trong cùng 1 surface (ex: orange button + gold badge cùng card → noise). Pick 1 brand color per surface, neutral for rest.

**Accent palette rules (v3)**:

- Dùng cho **category / section / status identity** — ví dụ ProjectCard accent border-l theo project category, FeatureCard icon plate theo section type (5 section = 5 màu).
- KHÔNG dùng cho primary CTA (luôn orange) hoặc body text (luôn neutral).
- 1 accent per surface — không stack 3 accents trong 1 card.
- Pair với neutral surfaces — accent là spice, không phải background.
- Dark-mode parity: mọi accent có dark variant đảm bảo 4.5:1 contrast.

## 3. Surface depth

| Level        | Token                                                                                                    | Use                                             |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Flat         | `border-b border-border`                                                                                 | List dividers (catalog rows).                   |
| Raised       | `rounded-xl border border-border bg-card shadow-sm`                                                      | Cards (FeatureCard, SearchResultRow).           |
| Hover-raised | `hover:shadow-md hover:border-primary/30 transition-all`                                                 | Card hover (interactive).                       |
| Floating     | `rounded-xl bg-popover shadow-card`                                                                      | Dialogs, dropdowns, toasts.                     |
| Hero panel   | `rounded-2xl bg-gradient-to-br from-primary-50 via-background to-secondary-bg/50 ring-1 ring-primary/10` | Page hero blocks (Home, ProjectLanding, Login). |

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

### Empty state

- Container: centered flex column, `py-16 px-6 max-w-md mx-auto`.
- Icon: 64×64 `text-primary/40` (lucide icon, không background plate).
- Heading: `font-display text-xl font-semibold` Vietnamese verb-led ("Chưa có project nào").
- Description: 1-2 sentences `text-sm text-muted-foreground`.
- Action: 1 primary CTA (admin-only roles get inline create dialog).

### Loading state

- Skeleton **must match** real shape (same row height, same avatar/card position) → no layout shift on data arrival.
- Use `animate-pulse bg-muted` rounded blocks. 3 rows minimum cho list, 1 card cho hero, 5 sections cho feature detail.

### Error state

- Banner: `rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive` with role="alert".
- Includes: human reason (1 sentence) + retry button (`variant="outline" size="sm"`).
- Never show raw error code/stack to user.

## 6. Density rules per screen type

| Screen type                          | Row/Card height target | Notes                                                                                                                                                      |
| ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog grid (Home)                  | 180-220px card, 2-col  | Avatar + name + tag + description + progress bar + avatar stack + activity meta. Revised 2026-04-25 from list to grid for richer per-project info density. |
| Card grid (Project landing features) | 132-180px card, 2-col  | Icon plate + title + status badge + section progress (bar + dot row) + avatar stack.                                                                       |
| Detail prose                         | max 65ch read width    | Center column, sidebar TOC fixed at xl breakpoint.                                                                                                         |
| Search results                       | 120-140px row          | Title + snippet (line-clamp-3) + meta breadcrumb.                                                                                                          |
| Auth (Login)                         | Single panel ~440px    | Hero left + form right (xl); stacked on mobile.                                                                                                            |

**Text reduction policy (v3)** — apply per surface tier:

- **Shell / nav / header** (AppHeader, BreadcrumbBar): label-only, no descriptions. Tooltip cho icon-only.
- **Hero panels** (Home, ProjectLanding, FeatureDetail header, Login brand pane): eyebrow + h1 + **1-dòng** subtitle tối đa (down from 2-4 dòng v2). Pattern backdrop thay thế copy.
- **Empty states**: heading verb-led + **1-dòng** description (down from 1-2 sentences). Pattern + icon carry visual weight.
- **Landing / catalog summary chips**: value + 1-từ label (e.g. "12 Project"). Không sub-line.
- **Content rows / cards body / detail prose**: GIỮ NGUYÊN density target — đây là core value của product, không cắt.

## 7. Illustration policy (v3 — rewritten)

**Allowed (v3)**:

- Hero areas: `bg-gradient-to-br from-primary-50 via-background to-secondary-bg/50` + optional `NxLogo mark variant` 80-120px opacity-5.
- **Geometric SVG patterns**: blob, grid, gradient mesh, wave, dot pattern. Inline SVG component hoặc CSS gradient (no raster). Opacity ≤ 0.4 default để không lấn content.
- **GradientMesh** background trên hero panels: multi-color radial gradient (primary + 1-2 accent) via CSS, prefer over SVG cho performance.
- **Empty states**: pattern decoration (BlobBackdrop / DotField) + lucide icon — không chỉ icon trần như v2.
- Avatar: deterministic letter-based (slug hash → primary ramp 100..500 hoặc accent palette), font-display bold uppercase. Image upload land US-009.

**Still banned**:

- ❌ Character illustrations (Storyset / unDraw / Lottie character animations) — quá playful cho personas internal tech.
- ❌ Stock photography (Unsplash / Pexels) — generic, không brand-coherent.
- ❌ 3D renders / claymorphism (Spline assets) — overkill cho internal tool, asset-heavy.
- ❌ Hand-drawn / sketch style (Excalidraw) — conflict tone "warmer professional".

**Rules cho pattern usage**:

- Mỗi screen chọn ≤ 2 pattern types (e.g. GradientMesh hero + DotField empty), không stack ≥ 3.
- Pattern luôn absolute / behind content, `aria-hidden="true"`, không block keyboard nav.
- Dark-mode variant required: opacity giảm / màu shift để không quá đậm trên dark bg.
- Reduced motion: pattern static (no animation) trừ khi user opted-in.

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

### Pattern primitives (v3 — geometric SVG / CSS backdrop)

Reusable visual decorations cho hero / empty / landing. Implement trong `apps/web/src/components/patterns/`. All accept `tone?: "primary" | "blue" | "green" | "purple" | "pink" | "cyan" | "amber"` (default `primary`) + `opacity?: number` (default 0.3, range 0.1-0.5) + `className?: string` cho positioning.

- **BlobBackdrop**: SVG amorphous blob shape, gradient fill 2-color (tone + neutral). Absolute positioned, scales 240-480px. Use cho hero corners hoặc empty state backdrop. Props: `size?: "sm" | "md" | "lg"`.
- **GridPattern**: SVG repeating dot grid (16px gap, 1.5px dot). Mask-image gradient để fade ra edges. Use cho hero background subtle texture. Props: `density?: "tight" | "loose"`.
- **GradientMesh**: CSS-only multi-radial gradient (3-4 color stops, tone + 1-2 accent). No SVG, cheap to render. Use cho hero backdrop chính. Props: `tones?: string[]` (≤ 3 tones).
- **WaveDivider**: SVG wave path, full-width, 40-80px tall. Use cho hero bottom edge transition vào content. Props: `flip?: boolean`.
- **DotField**: SVG cluster của 12-20 dots scattered, varying sizes (4-12px). Use cho empty state visual weight. Props: `count?: number`.

**Composition rules**:

- 1 hero panel: chọn 1 (GradientMesh hoặc BlobBackdrop) + tối đa 1 enhancement (GridPattern / WaveDivider).
- Empty state: chọn 1 (BlobBackdrop hoặc DotField) + lucide icon centered.
- KHÔNG stack ≥ 3 patterns trong cùng viewport.
- Dark mode: opacity giảm 25-40% so với light (e.g. light `opacity-30` → dark `opacity-20`).

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

## 11. Compliance

Mọi PR đụng UI:

1. Tham chiếu charter section trong commit body khi quyết định không obvious (e.g., "per visual-language §3 hero panel").
2. Per-screen spec `.specs/ui/<screen>.md` §Visual structure phải align charter — nếu deviate, update charter (cùng commit) không silently override.
3. Tests preserve aria-labels + semantic roles.

## CHANGELOG

| Version | Date       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | 2026-04-25 | Initial charter (CR-002). 5 screens uplift baseline. Hero panel pattern + density rules established.                                                                                                                                                                                                                                                                                                                                     |
| v2      | 2026-04-25 | Workspace-style amendment: §6 Home density list→grid 2-col 180-220px; §10 NEW component patterns (StatChip, FloatStat, MiniStat, ProgressStrip, SectionDots, AvatarStack, LiveIndicator placeholder, TabBar, DecorativeMark, TemplateRadio, EmptyDashedCard); §11 renumbered. Skeleton-UI policy: build full reference design, dummy/placeholder cho data chưa có (no realtime presence, activity log static, tabs Catalog-only active). |
| v3      | 2026-05-15 | CR-005 — Geometric patterns + multi-accent. §2 accent palette (blue/green/purple/pink/cyan/amber) — 1 accent/surface. §7 lift illustration ban → allow geometric SVG + CSS gradients (still ban character/stock/3D/sketch). §10 NEW Pattern primitives (BlobBackdrop, GridPattern, GradientMesh, WaveDivider, DotField). §6 Text reduction tier (shell/hero/empty cut; content body preserved).                                          |
