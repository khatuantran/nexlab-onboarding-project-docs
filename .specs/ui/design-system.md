# Design System Registry

<!-- exempt: registry (no template required) -->

_Last updated: 2026-05-16 (v4 amend — CR-006 dark vivid + glassmorphism) · Source of truth for cross-screen UI consistency: tokens, icons, components, a11y floor._

Mỗi file `.specs/ui/<screen>.md` **must** reference tokens/components ở file này — không redefine colors/fonts/spacing locally. Thêm token/variant/icon mới = update file này trong commit riêng trước khi code.

**Brand**: Nexlab (orange + gold, Material 3-flavored). Adopted per [ADR-003](../adr/ADR-003-nexlab-design-system.md) 2026-04-24 — supersede shadcn-neutral tokens + system font stack.

Related: [visual-language.md](visual-language.md) (UI Quality Charter — design bar across 5 screens), [ADR-001 tech stack](../adr/ADR-001-tech-stack.md), [ADR-002 light+dark theme](../adr/ADR-002-light-dark-theme.md), [ADR-003 Nexlab DS](../adr/ADR-003-nexlab-design-system.md), [templates/02-ui-spec-template.md](../../templates/02-ui-spec-template.md).

---

## 1. Theme tokens

Light + dark theme qua Tailwind `darkMode: "class"` + CSS vars trên `:root` và `.dark` ([apps/web/src/styles/index.css](../../apps/web/src/styles/index.css)). Mọi color trong code **must** reference token; 0 raw hex.

### 1.1 Token map

Nexlab palette converted RGB → HSL (ADR-003 §2.1). Dark derived từ light (invert luminance; primary/secondary lightness +8-10% cho dark readability).

**Semantic surfaces**:

| Token                  | Light HSL    | Dark HSL     | Dùng ở                          |
| ---------------------- | ------------ | ------------ | ------------------------------- |
| `--background`         | `0 0% 100%`  | `0 0% 15%`   | Page background                 |
| `--foreground`         | `240 3% 16%` | `0 0% 98%`   | Primary text                    |
| `--card`               | `0 0% 100%`  | `0 0% 15%`   | Card surface bg                 |
| `--card-foreground`    | `240 3% 16%` | `0 0% 98%`   | Text on card                    |
| `--popover`            | `0 0% 100%`  | `0 0% 15%`   | DropdownMenu / tooltip bg       |
| `--popover-foreground` | `240 3% 16%` | `0 0% 98%`   | Text on popover                 |
| `--muted`              | `0 0% 95%`   | `0 0% 22%`   | Section bg, disabled, hover     |
| `--muted-foreground`   | `0 0% 55%`   | `0 0% 70%`   | Sub-copy, placeholder, inactive |
| `--accent`             | `0 0% 95%`   | `0 0% 22%`   | Hover surfaces (alias muted)    |
| `--accent-foreground`  | `240 3% 16%` | `0 0% 98%`   | Text on accent                  |
| `--border`             | `0 0% 89%`   | `0 0% 28%`   | Input border, card divider      |
| `--input`              | `0 0% 89%`   | `0 0% 28%`   | Input field border              |
| `--ring`               | `27 88% 51%` | `28 89% 61%` | Focus ring (primary-500)        |
| `--radius`             | `0.5rem`     | `0.5rem`     | Base radius (buttons/inputs 8)  |

**Primary — Nexlab orange**:

| Token                  | Light HSL    | Dark HSL     | Dùng ở                                    |
| ---------------------- | ------------ | ------------ | ----------------------------------------- |
| `--primary`            | `27 88% 51%` | `28 89% 61%` | Button orange variant, active state, link |
| `--primary-foreground` | `0 0% 100%`  | `0 0% 15%`   | Text on primary bg                        |

Primary ramp 50-900 exposed cho tinted surfaces (Tailwind `bg-primary-100` etc.):

| Step | Light HSL    | Light RGB (source)     |
| ---- | ------------ | ---------------------- |
| 50   | `38 83% 96%` | rgb(254, 248, 238)     |
| 100  | `36 90% 92%` | rgb(253, 238, 215)     |
| 200  | `34 92% 83%` | rgb(251, 218, 173)     |
| 300  | `32 91% 72%` | rgb(248, 191, 121)     |
| 400  | `28 89% 61%` | rgb(244, 154, 67)      |
| 500  | `27 88% 51%` | rgb(240, 118, 19) base |
| 600  | `25 84% 48%` | rgb(226, 99, 20)       |
| 700  | `22 82% 40%` | rgb(187, 74, 19)       |
| 800  | `17 73% 34%` | rgb(149, 59, 23)       |
| 900  | `15 69% 28%` | rgb(120, 51, 22)       |

**Accent palette (v4 — CR-006)** — 5 hues × 5 stops (50/200/400/500/700). Category identity slots only (ProjectCard 6-gradient, role badges, section nav, integration cards). NOT a generic body-surface palette.

| Hue      | 50 (Light HSL) | 200 (Light HSL) | 400 (Light HSL) | 500 base (Light HSL) | 700 (Light HSL) | Reference hex (500) |
| -------- | -------------- | --------------- | --------------- | -------------------- | --------------- | ------------------- |
| `purple` | `258 100% 96%` | `253 92% 86%`   | `258 90% 76%`   | `258 90% 67%`        | `262 79% 50%`   | `#8B5CF6`           |
| `green`  | `152 81% 96%`  | `156 73% 80%`   | `158 64% 52%`   | `158 64% 39%`        | `158 92% 24%`   | `#10B981`           |
| `blue`   | `214 100% 97%` | `213 97% 87%`   | `213 94% 68%`   | `217 91% 60%`        | `225 73% 48%`   | `#3B82F6`           |
| `rose`   | `356 100% 97%` | `351 100% 91%`  | `351 95% 71%`   | `350 89% 60%`        | `348 84% 42%`   | `#F43F5E`           |
| `amber`  | `48 100% 96%`  | `49 96% 80%`    | `43 96% 56%`    | `38 92% 50%`         | `26 88% 35%`    | `#F59E0B`           |

Dark mode: bump each step lightness +8-12% for readability over dark hero (e.g. `purple-500` light `258 90% 67%` → dark `258 90% 75%`). Exact dark values in [index.css](../../apps/web/src/styles/index.css).

Usage rules:

- ProjectCard 6-gradient header — orange-500/700 + the 5 accents-500/700, deterministic by `project.slug` hash.
- Role badges — Admin=rose-50/rose-700 / PM=purple-50/purple-700 / BA=primary-50/primary-700 / Dev=blue-50/blue-700 / QA=green-50/green-700.
- Section nav (FeatureDetail 5 sections) — Nghiệp vụ=purple / User flow=primary / Rules=green / Tech=blue / Shots=rose.
- Integration cards (Settings) — GitHub neutral, Jira=blue, Slack=purple, Google=rose, Confluence=neutral.
- 1 accent per surface. Don't stack ≥ 2 accent hues in same card.

**Hero dark gradient (v4 — CR-006)** — 4 stops for `GradientHero` primitive bg. Dark navy → purple → indigo → near-black:

| Token      | Light HSL     | Dark HSL      | Reference hex | Dùng ở                          |
| ---------- | ------------- | ------------- | ------------- | ------------------------------- |
| `--hero-1` | `261 73% 8%`  | `261 73% 8%`  | `#0B0520`     | Hero top-left (anchor + 0%)     |
| `--hero-2` | `255 60% 14%` | `255 60% 14%` | `#180E3A`     | Hero ~30% via stop              |
| `--hero-3` | `222 65% 14%` | `222 65% 14%` | `#0C1A3A`     | Hero ~60% via stop              |
| `--hero-4` | `216 25% 6%`  | `216 25% 6%`  | `#0A0E16`     | Hero bottom-right (anchor 100%) |

Same values in light + dark — the hero is intentionally dark in both modes (it's a hero treatment, not a surface).

**Logo gradient (v4 — CR-006)** — used for wordmark mask + gradient text headline accent:

| Token               | Light HSL     | Dark HSL      | Reference hex | Dùng ở                                  |
| ------------------- | ------------- | ------------- | ------------- | --------------------------------------- |
| `--logo-grad-start` | `31 100% 50%` | `31 100% 50%` | `#FF9200`     | NxLogo mask start + gradient text start |
| `--logo-grad-end`   | `31 100% 78%` | `31 100% 78%` | `#FFD092`     | NxLogo mask end + gradient text end     |

Apply via `bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))] bg-clip-text text-transparent` on the gradient span.

**Neutral scale explicit (v4 — CR-006)** — explicit 000-1000 + ink + black, complementing existing shadcn semantic surfaces. Reference rgb in source comments.

| Token             | Light HSL     | Dark HSL      | Reference rgb    |
| ----------------- | ------------- | ------------- | ---------------- |
| `--neutral-000`   | `0 0% 100%`   | `220 12% 7%`  | rgb(255,255,255) |
| `--neutral-050`   | `0 0% 98%`    | `220 12% 10%` | rgb(249,249,249) |
| `--neutral-100`   | `0 0% 95%`    | `220 12% 12%` | rgb(242,242,242) |
| `--neutral-200`   | `0 0% 94%`    | `220 12% 16%` | rgb(239,239,239) |
| `--neutral-300`   | `0 0% 89%`    | `220 12% 19%` | rgb(227,227,227) |
| `--neutral-400`   | `0 0% 81%`    | `220 12% 26%` | rgb(206,206,206) |
| `--neutral-500`   | `0 0% 68%`    | `220 12% 37%` | rgb(173,173,173) |
| `--neutral-600`   | `0 0% 55%`    | `220 12% 48%` | rgb(140,140,140) |
| `--neutral-700`   | `0 0% 39%`    | `220 12% 60%` | rgb(100,100,100) |
| `--neutral-800`   | `285 4% 28%`  | `220 12% 71%` | rgb(73,69,79)    |
| `--neutral-900`   | `240 3% 16%`  | `220 12% 84%` | rgb(39,39,41)    |
| `--neutral-1000`  | `203 31% 15%` | `220 12% 92%` | rgb(27,42,51)    |
| `--neutral-ink`   | `0 0% 15%`    | `220 12% 5%`  | rgb(38,38,38)    |
| `--neutral-black` | `0 0% 0%`     | `0 0% 0%`     | rgb(0,0,0)       |

Semantic fg / bg aliases (v4):

| Token          | Maps to (light) | Maps to (dark)    | Dùng ở                       |
| -------------- | --------------- | ----------------- | ---------------------------- |
| `--fg-1`       | `--neutral-900` | `--neutral-100`   | Primary body text            |
| `--fg-2`       | `--neutral-800` | `--neutral-200`   | Secondary text               |
| `--fg-3`       | `--neutral-600` | `--neutral-500`   | Muted / help text            |
| `--fg-4`       | `--neutral-500` | `--neutral-600`   | Disabled text                |
| `--fg-inverse` | `--neutral-000` | `--neutral-ink`   | Text on dark surfaces        |
| `--bg-subtle`  | `--neutral-100` | `--neutral-ink`   | Section bg, hover surface    |
| `--bg-muted`   | `--neutral-200` | `--neutral-300`   | Disabled bg, divider surface |
| `--bg-dark`    | `--neutral-ink` | `--neutral-black` | Dark elevation surface       |

**Slate (v4 — CR-006)** — for NxLogo wordmark slate text + secondary strokes:

| Token         | Light HSL     | Dark HSL      | Reference hex | Dùng ở                     |
| ------------- | ------------- | ------------- | ------------- | -------------------------- |
| `--slate-500` | `221 12% 51%` | `221 12% 60%` | `#777E90`     | Wordmark slate text        |
| `--slate-600` | `221 12% 46%` | `221 12% 55%` | `#6A7182`     | Stroke + secondary divider |

**Glassmorphism utilities (v4 — CR-006)** — applied via Tailwind class combos, not standalone tokens. Per [visual-language §11](visual-language.md#11-glassmorphism-layering-v4--cr-006):

- `bg-white/6 border-white/10 backdrop-blur-md` — Subtle (stat tile over dark hero).
- `bg-white/12 border-white/20 backdrop-blur-md` — Feature pill / testimonial.
- `bg-white/18 border-white/25 backdrop-blur-md` — Initials plate / Live pill.
- `bg-white/22 border-white/30 backdrop-blur-md` — Section nav active state.

Only over `GradientHero` or dark gradient banners. Never over light bg.

**Dropped tokens (v3 / v3.1 lineage)**:

- `--canvas` / `--canvas-muted` — warm off-white page bg (v3).
- `--sage` / `--sage-foreground` / `--sage-bg` / `--sage-text` — sage secondary accent (v3).
- `--tile-orange` / `--tile-navy` / `--tile-green` / `--tile-amber` / `--tile-peach` / `--tile-rust` — muted tile palette (v3.1).

v4 replaces these with the accent palette + hero gradient + logo gradient + neutrals/slate/glassmorphism above.

**Secondary — Nexlab gold** (default button bg per Nexlab convention):

| Token                    | Light HSL    | Dark HSL     | Dùng ở                        |
| ------------------------ | ------------ | ------------ | ----------------------------- |
| `--secondary`            | `39 61% 62%` | `39 61% 70%` | Button default variant bg     |
| `--secondary-foreground` | `0 0% 100%`  | `0 0% 15%`   | Text on secondary bg          |
| `--secondary-bg`         | `39 67% 94%` | `39 20% 22%` | Chip fill, muted gold surface |
| `--secondary-text`       | `35 45% 46%` | `39 61% 75%` | Text on secondary-bg          |

**Semantic (success / warning / info / destructive)**:

| Token                      | Light HSL      | Dark HSL       | Dùng ở                              |
| -------------------------- | -------------- | -------------- | ----------------------------------- |
| `--destructive`            | `12 100% 44%`  | `12 90% 55%`   | Destructive button, error banner    |
| `--destructive-foreground` | `0 0% 100%`    | `0 0% 98%`     | Text on destructive                 |
| `--success`                | `133 56% 46%`  | `133 56% 55%`  | Success toast, checkmarks           |
| `--success-foreground`     | `0 0% 100%`    | `0 0% 15%`     | Text on success                     |
| `--warning`                | `37 100% 50%`  | `37 100% 60%`  | Warning alert                       |
| `--warning-foreground`     | `0 0% 15%`     | `0 0% 15%`     | Text on warning (dark cho contrast) |
| `--info`                   | `236 100% 71%` | `236 100% 78%` | Info alert                          |
| `--info-foreground`        | `0 0% 100%`    | `0 0% 15%`     | Text on info                        |
| `--highlight`              | `34 92% 83%`   | `27 60% 35%`   | `<mark>` bg (search snippet)        |

**Contrast**: mọi cặp fg/bg ≥ 4.5:1 (WCAG AA) trong cả 2 mode. Primary-500 orange trên white: ratio ~4.7:1 ✅; Dark primary-400 orange trên `neutral-ink`: ~6.2:1 ✅.

**Hiện trạng code**: Nexlab tokens landed T-DS-3 (`87b9827`).

### 1.2 Theme toggle behavior

- **States**: `"light" | "dark" | "system"` (default: `"system"`).
- **Persistence**: `localStorage["theme"]`. Read on mount, write on change.
- **Apply**: `<html>` mang class `dark` khi resolved mode = dark (resolved từ explicit user choice hoặc `matchMedia("(prefers-color-scheme: dark)")` khi state = `"system"`).
- **Cycle order**: Light → Dark → System → Light (1 button trong AppHeader).
- **System listener**: `matchMedia` change event → re-resolve khi state = `"system"`.
- **Fallback**: localStorage disabled → default `"system"`, không throw.
- **Impl**: [apps/web/src/lib/theme.tsx](../../apps/web/src/lib/theme.tsx) (T8.5 `51802c0`).

---

## 2. Typography

**Fonts (ADR-003 §2.3)** — self-hosted via `@fontsource` npm packages (bundled by Vite, không CDN). Latin + Vietnamese subsets only.

- **Body**: `Roboto` (400 / 500 / 700). Tailwind class `font-body` (default `font-sans` alias).
- **Display / Heading / Label**: `Inter` (400 / 500 / 600 / 700). Tailwind class `font-display`.
- **UI chrome (buttons, fields)**: SF Pro Text fallback Inter via `font-ui` stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", ...`).
- **Brand wordmark**: SVG lockup (no font needed). `Montserrat` 200/300/400 loaded via `@fontsource/montserrat` for the reserved `font-brand` Tailwind family — used only if wordmark is rendered as text (e.g., compact fallback). Per [ADR-003](../adr/ADR-003-nexlab-design-system.md) and [tokens.css reference](../../screens/dev%27s%20onboarding%20portal/styles/tokens.css).
- Applied tự động: `body` → Roboto, `h1..h6` → Inter (index.css). Override per-screen qua Tailwind class nếu cần.

**Scale** (Nexlab Material 3 mapping):

| Role                  | Tailwind                                     | Size | Line-height | Font           |
| --------------------- | -------------------------------------------- | ---- | ----------- | -------------- |
| H1 (page title)       | `text-2xl font-semibold font-display`        | 24px | 32px        | Inter          |
| H2 (section)          | `text-xl font-semibold font-display`         | 20px | 28px        | Inter          |
| H3 (sub-section)      | `text-lg font-medium font-display`           | 18px | 28px        | Inter          |
| Body default          | `text-sm`                                    | 14px | 20px        | Roboto         |
| Body prose (markdown) | `text-base leading-relaxed`                  | 16px | 28px        | Roboto         |
| Caption / helper text | `text-xs text-muted-foreground`              | 12px | 16px        | Roboto         |
| Button label          | `text-sm font-bold font-ui tracking-[0.1px]` | 14px | 20px        | SF Pro / Inter |

- **Letter-spacing**: Tailwind default; button label `tracking-[0.1px]` theo Nexlab.
- **Nexlab scale keys** (reference, optional): display-lg 57/64, display-md 45/52, headline-lg 32/40, headline-md 28/36, headline-sm 24/32, title-xl 20/28, body-lg 16/24, body-md 14/20, body-sm 12/16. V1 dùng Tailwind default scale; adopt Nexlab specific values khi screen cần.

---

## 3. Spacing & layout

- **Base unit**: Tailwind default (4px step; `gap-4` = 16px).
- **Common patterns**:
  - Page horizontal padding: `px-6` (24px).
  - Page vertical padding: `py-8` (32px) desktop, `py-12` (48px) login/auth.
  - Form field gap: `gap-4` (16px).
  - Card / panel gap: `gap-6` (24px).
  - Inline gap (icon + text, button cluster): `gap-2` hoặc `gap-3`.
- **Container widths**:
  - Login / narrow form: `max-w-sm` (384px).
  - Main content area: `max-w-5xl` (1024px).
- **Breakpoint**: mobile-first, `sm:` = 640px, `md:` = 768px, `lg:` = 1024px. Test width 375px (iPhone SE) tối thiểu.

---

## 4. Icons — lucide-react

Library: [`lucide-react`](https://lucide.dev/). Đã trong `apps/web/package.json`.

- **Import**: named từ `lucide-react`, VD `import { Sun, Moon, Monitor } from "lucide-react"`.
- **Size rules**:
  - Inline với body text: `size-4` (16×16px).
  - Primary action / toolbar button: `size-5` (20×20px).
  - Large feature icon: `size-6` (24px).
- **Color**: stroke = `currentColor` (default). Không set `color` explicit — inherit từ parent qua `text-foreground`, `text-muted-foreground`, v.v.
- **A11y**:
  - Icon-only button: phải có `aria-label` Vietnamese describe action (VD `aria-label="Chuyển sang chế độ tối"`).
  - Decorative icon (có label text kế bên): `aria-hidden="true"`.
- **Không**: emoji trong UI (hint: chỉ cho markdown content do user nhập).

**Icon registry** (icons đã hoặc sẽ dùng — thêm row khi dùng icon mới):

| Icon                  | Dùng ở                                                             | Label                             |
| --------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `Sun`                 | ThemeToggle (state = light)                                        | "Đang dùng chế độ sáng"           |
| `Moon`                | ThemeToggle (state = dark)                                         | "Đang dùng chế độ tối"            |
| `Monitor`             | ThemeToggle (state = system)                                       | "Theo chế độ hệ thống"            |
| `LogOut`              | AppHeader logout button                                            | "Đăng xuất" (kèm text, decor-ok)  |
| `Search`              | SearchPage input affordance + header                               | "Tìm kiếm" (T10)                  |
| `X`                   | FilterChip remove button (T10) + Dialog close (US-002)             | "Bỏ lọc" / "Đóng"                 |
| `Plus`                | "Tạo project" + "Thêm feature" buttons (US-002)                    | decor (kèm text, aria-hidden)     |
| `Pencil`              | Section "Sửa" toggle (US-002)                                      | "Sửa nội dung section"            |
| `ChevronRight`        | Card CTA, breadcrumb separator (T9)                                | decor (aria-hidden)               |
| `FileText`            | Feature card leading icon (T9)                                     | decor (aria-hidden)               |
| `Clock`               | Relative-time indicator (T9)                                       | decor (aria-hidden)               |
| `AlertCircle`         | Empty-section / error state (T9, T10)                              | decor (aria-hidden)               |
| `Check`               | Save action buttons (US-002 T7 SectionEditor)                      | decor (kèm text, aria-hidden)     |
| `MoreHorizontal`      | Overflow menu trigger trên project-landing (US-004)                | "Thao tác project"                |
| `Archive`             | Archive action trong overflow menu (US-004)                        | decor (kèm text, aria-hidden)     |
| `Upload`              | SectionEditor upload toolbar (US-003)                              | "Upload ảnh vào section"          |
| `Image`               | Preview pane fallback cho broken `<img>` (US-003)                  | decor (aria-hidden)               |
| `ExternalLink`        | Plain anchor leading icon cho non-whitelist URL (US-003, optional) | decor (aria-hidden)               |
| `Github` (custom SVG) | EmbedCard icon cho github.com URLs (US-003)                        | decor (kèm URL text, aria-hidden) |
| `Figma` (custom SVG)  | EmbedCard icon cho figma.com URLs (US-003)                         | decor (kèm URL text, aria-hidden) |
| `Jira` (custom SVG)   | EmbedCard icon cho atlassian.net URLs (US-003)                     | decor (kèm URL text, aria-hidden) |
| `Bell`                | NotificationBell (AppHeader v2 placeholder)                        | "Thông báo (sắp ra mắt)"          |
| `ChevronDown`         | UserMenu trigger affordance (AppHeader v2)                         | decor (aria-hidden)               |
| `User`                | UserMenu item "Hồ sơ của tôi" (AppHeader v2)                       | decor (kèm text, aria-hidden)     |
| `Settings`            | UserMenu item "Cài đặt" (AppHeader v2)                             | decor (kèm text, aria-hidden)     |
| `Home`                | NavLinks "Trang chủ" (AppHeader v2)                                | decor (kèm text, aria-hidden)     |

**Brand logo** — Nexlab wordmark SVG (không dùng lucide):

| Asset                       | Dùng ở                          | Source                                                                               |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| `NxLogo` (variant `lockup`) | AppHeader, login brand chrome   | `apps/web/src/assets/logo-nexlab.svg`                                                |
| `NxLogo` (variant `mark`)   | Compact spots (avatar, favicon) | `apps/web/src/assets/logo-nexlab-mark.svg` + orange→peach gradient mask via `NxLogo` |

---

## 5. Component inventory

Mọi component dùng lại phải listed ở đây. Không variant mới / copy mới = không thêm row → component ổn.

### 5.1 Primitives — shadcn-style ([apps/web/src/components/ui/](../../apps/web/src/components/ui/))

| Component      | Variants                                                                                                                 | Sizes                                               | File                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------- |
| `Button`       | `default` / `destructive` / `outline` / `ghost`                                                                          | `default` / `sm` / `lg` / `icon`                    | `button.tsx`                                |
| `Input`        | —                                                                                                                        | default height `h-10`                               | `input.tsx`                                 |
| `Label`        | —                                                                                                                        | —                                                   | `label.tsx`                                 |
| `Card`         | `default` (land T9)                                                                                                      | padding `p-5`, rounded `rounded-lg`                 | `card.tsx`                                  |
| `Dialog`       | shadcn wrapper around Radix `@radix-ui/react-dialog` (Trigger / Content / Header / Footer / Title / Description / Close) | default `max-w-md`, `sm` `max-w-sm`                 | `dialog.tsx` (US-002)                       |
| `Textarea`     | —                                                                                                                        | `min-h-32`, `text-sm font-mono` cho markdown editor | `textarea.tsx` (US-002)                     |
| `Toaster`      | sonner mount at app root — `success` / `error` / `info` variants theme-aware                                             | —                                                   | `toaster.tsx` (US-002)                      |
| `DropdownMenu` | shadcn wrapper around Radix `@radix-ui/react-dropdown-menu` (Trigger / Content / Item / Separator / Label)               | default `min-w-40`                                  | `dropdown-menu.tsx` (US-004 / T4 `54b276c`) |
| `Kbd`          | Inline keyboard hint `<kbd>` với border + bg-muted; visual only                                                          | `text-[10px] px-1.5 py-0.5`                         | `kbd.tsx` (AppHeader v2)                    |

Thêm variant / component mới:

1. Propose trong commit spec: update bảng này + CHANGELOG §7.
2. User review + approve.
3. Implement + test.

### 5.2 Layout components ([apps/web/src/components/layout/](../../apps/web/src/components/layout/))

| Component          | Purpose                                                                                                                                                                                                    | Land ở                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `ErrorBoundary`    | Catch render errors → fallback UI                                                                                                                                                                          | T4                           |
| `RequireAuth`      | Gate route subtree behind `useMe()` session                                                                                                                                                                | T8                           |
| `AppHeader`        | App chrome v2: 2-row (Row 1: logo + NavLinks + SearchInput + NotificationBell + ThemeToggle + UserMenu; Row 2: Breadcrumb + admin CTA). Replaces inline username + logout button + admin shortcut buttons. | AppHeader v2 ✅ (2026-05-15) |
| `ThemeToggle`      | Tri-state button cycle light/dark/system (§1.2)                                                                                                                                                            | T8.5 ✅ `51802c0`            |
| `UserMenu`         | Avatar + ChevronDown trigger → DropdownMenu (Hồ sơ / Cài đặt / Quản lý user [admin] / Đăng xuất). Header label hiển thị displayName + email + role badge.                                                  | AppHeader v2                 |
| `NavLinks`         | Primary nav pill row: Trang chủ / Tìm kiếm (react-router NavLink active-state)                                                                                                                             | AppHeader v2                 |
| `NotificationBell` | Ghost icon button placeholder (disabled, tooltip "Sắp ra mắt")                                                                                                                                             | AppHeader v2                 |
| `BreadcrumbBar`    | Row 2 wrapper: parses `useLocation()` segments (project name via `useProject`) + slot bên phải cho admin CTA                                                                                               | AppHeader v2                 |
| `Breadcrumb`       | "Demo / Login" link trail cho feature detail                                                                                                                                                               | T9 (planned)                 |
| `FeatureCard`      | Card grid item: title + filledCount badge + relative time (ProjectLanding)                                                                                                                                 | T9 (planned)                 |
| `SectionBadge`     | "3/5" pill hiển thị filledCount                                                                                                                                                                            | T9 (planned)                 |
| `RelativeTime`     | `<time>` với `title=ISO`, text "2 giờ trước" (date-fns vi locale)                                                                                                                                          | T9 (planned)                 |
| `MarkdownView`     | Render markdown (markdown-it) + sanitize (DOMPurify), chỉ allow whitelisted tags                                                                                                                           | T9 (planned)                 |
| `SectionToc`       | Sticky left sidebar (desktop) / top dropdown (mobile) với 5 anchor link                                                                                                                                    | T9 (planned)                 |
| `EmptyState`       | Icon + copy + optional CTA cho trường hợp empty (no features, empty section)                                                                                                                               | T9 (planned)                 |
| `SearchInput`      | AppHeader persistent search field; Enter submit → `/search?q=...&projectSlug=?`                                                                                                                            | T10 (planned)                |
| `FilterChip`       | Pill "× Trong Demo" cho scope filter remove                                                                                                                                                                | T10 (planned)                |

### 5.2.1 Pattern primitives v2 (v4 — CR-006) ([apps/web/src/components/patterns/](../../apps/web/src/components/patterns/))

Replaces v3.1 single `CircleDecor` primitive. v4 introduces 3 cooperating primitives for dark vivid hero treatment. All `aria-hidden` + `pointer-events-none` where decorative.

| Component       | Purpose                                                                                                                                                                                                                                                 | File                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `GradientHero`  | Wrapper section with dark gradient bg (4 stops `--hero-1..4`, 145deg) + 3 radial color blob `<div>`s + dot-grid overlay + optional `<LogoWatermark>` slot + children slot. Props: `blobs?` (3 default), `showWatermark?`, `gridOverlay?`, `className?`. | `GradientHero.tsx`  |
| `LogoWatermark` | Absolute-positioned masked SVG with logo gradient. Props: `size`, `opacity` (0.10-0.13 default), `className`. Used inside `GradientHero` for brand watermark in hero corner.                                                                            | `LogoWatermark.tsx` |
| `ProgressRing`  | SVG circular progress (2 concentric circles, rotate -90°). Props: `pct` (0-100), `size` (44-56 default), `color` (stroke), `bg` (track), `strokeWidth` (6 default).                                                                                     | `ProgressRing.tsx`  |

**Dropped in v4**: `CircleDecor` — v3.1 abstract primitive replaced by inline circle `<div>`s in card headers (e.g. ProjectCard 2 decorative circles directly in JSX with rgba white .12 + .07).

### 5.3 Feature components ([apps/web/src/components/features/](../../apps/web/src/components/features/))

Empty cho đến T9. Expect: `FeatureList`, `SectionIndicator`, `MarkdownView`, `FeatureSections`.

T10 adds: `SearchResultRow` — `<Link>` wrap breadcrumb (`projectSlug › featureSlug`) + title + sanitized snippet với `<mark>` highlight. Used in [SearchPage](../../apps/web/src/pages/SearchPage.tsx).

US-002 adds (planned): `CreateProjectDialog`, `CreateFeatureDialog`, `SectionCard` (view/edit mode toggle per AC-5), `SectionEditor` (2-col textarea + preview), `AdminGate` (wrapper hiding children when user.role !== "admin").

US-003 adds (planned):

- `UploadButton` — ghost variant wrapping `<input type="file">`. `Upload` icon (swap với spinner `Loader2 animate-spin` during upload) + "Upload ảnh" label. Mount trong SectionEditor footer cho `tech-notes` + `screenshots` section types. Props: `featureId`, `onUploaded(markdown)`, `disabled`.
- `EmbedCard` — bordered card (`border border-border hover:border-primary/40 rounded-md p-3`). Brand icon 24px bên trái + 2-line text (URL path + domain subtitle). Wrapped trong `<a target="_blank" rel="noopener noreferrer">`. Props: `url: string`, `hostname: string`, `icon: LucideIcon | JSX`.
- Brand icons (custom SVG components ~20 LOC each): `GithubIcon`, `FigmaIcon`, `JiraIcon`. Lucide không có brand icons → inline SVG với `currentColor` stroke.

US-008 adds (✅ landed `a03c345`):

- `FeatureActionsMenu` — overflow `⋯` dropdown trên `FeatureCard`, admin-only. Single item "Lưu trữ feature" (Archive icon, destructive tone). Native `window.confirm` → POST `/projects/:slug/features/:fSlug/archive` → toast + invalidate cache. Mirror [`ProjectActionsMenu`](../../apps/web/src/components/projects/ProjectActionsMenu.tsx) pattern. Props: `projectSlug: string`, `feature: { slug, title }`.

US-009 adds (✅ landed `ef3b59a`):

- `ProfilePage` — `/profile` dedicated screen với 3 section card (Profile / Security / Avatar). Reuse `Avatar` (extended với `imageUrl`), `Button`, `Input`, `Label`, `DropdownMenu` (UserMenu link). Mount under ProtectedLayout. See [profile.md](profile.md).
- `Avatar` extended — optional prop `imageUrl?: string | null`. Nếu set, render `<img src>` với alt = name; fallback initials gradient (existing). Áp dụng cho UserMenu trigger + ProfilePage avatar large. Added `lg` size (80px).

---

## 6. A11y floor (áp dụng mọi screen)

- **Keyboard**: tab order theo reading order; focus luôn visible qua `focus-visible:ring-2 ring-ring`.
- **Labels**: mọi `<input>` có `<Label htmlFor>`; icon-only button có `aria-label`.
- **Live regions**: error inline có `role="alert"` (hoặc wrap `aria-live="polite"`); loading state `aria-busy="true"`.
- **Contrast**: token đã chọn đảm bảo ≥ 4.5:1. Không được set màu cứng vì lý do gì ngoài token.
- **Landmarks**: `<main>` cho page content; `<header>` cho AppHeader; `<nav>` nếu có nav.
- **Motion**: tôn trọng `prefers-reduced-motion` — không auto-play animation > 200ms.

---

## 6.1 Markdown + content rendering

- **Parser**: [`markdown-it`](https://github.com/markdown-it/markdown-it) — CommonMark + GFM-ish (tables, fenced code). No HTML passthrough (disable `html: false`).
- **Sanitizer**: [`DOMPurify`](https://github.com/cure53/DOMPurify) áp dụng trên output HTML trước khi render. Whitelist tag: `p, h1-h4, ul, ol, li, strong, em, code, pre, blockquote, a, img, table, thead, tbody, tr, th, td, hr, br, mark`.
- **Links**: `a[href]` rewrite — thêm `target="_blank" rel="noopener noreferrer"` cho external; internal `/projects/...` giữ SPA (intercept trong `MarkdownView`).
- **Images**: chỉ cho từ `/uploads/<id>` (FR-UPLOAD-001) + https:// whitelist. Reject `data:` / `javascript:`.
- **Code block**: không highlight v1 (deferred post-MVP); chỉ `<pre><code>` với `text-sm font-mono` + `bg-muted`.
- **Prose tokens**: áp dụng Tailwind typography-like rule qua class `prose prose-sm` (nếu cần thì install `@tailwindcss/typography` trong T9).

## 6.2 Relative time

- Helper `RelativeTime` dùng [`date-fns`](https://date-fns.org/) `formatDistanceToNow` với locale `vi`.
- Output examples: "2 giờ trước", "3 ngày trước", "30 phút trước".
- Render trong `<time datetime="<ISO>" title="<full date>">` để screen reader + hover tooltip có full timestamp.

---

## 7. CHANGELOG

Thêm row khi đổi token, icon registry, component inventory. Breaking change (rename/remove token) → bump minor version của file này + migrate per-screen specs cùng PR.

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PR / commit                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 2026-04-23 | Initial scaffold: 10 tokens + lucide-react icon rules + 3 primitives + 4 layout comps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | (this)                                       |
| 2026-04-23 | Dark `--destructive` 31% → 60% lightness — original was too dark for `text-destructive` on dark bg (fails 4.5:1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                | T8.5 Gate 2                                  |
| 2026-04-23 | T9 scaffold: add 4 icons (ChevronRight, FileText, Clock, AlertCircle) + Card primitive + 7 layout components (Breadcrumb, FeatureCard, SectionBadge, RelativeTime, MarkdownView, SectionToc, EmptyState). Status `(planned)` cho tới khi T9 ship.                                                                                                                                                                                                                                                                                                                                | T9 Gate 1                                    |
| 2026-04-23 | T9 components implemented + shipped. Status flip `(planned)` → live.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | T9 `879b15b`                                 |
| 2026-04-23 | T10 scaffold: add `--highlight` token (light `48 96% 89%` / dark `48 60% 35%`), `Search` + `X` icons, `SearchInput` + `SearchResultRow` + `FilterChip` components. Status `(planned)` tới khi T10 ship.                                                                                                                                                                                                                                                                                                                                                                          | T10 Gate 1                                   |
| 2026-04-23 | T10 ship: `--highlight`, `Search`/`X`, `SearchInput`/`SearchResultRow`/`FilterChip` live.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | T10 `5ca8e49`                                |
| 2026-04-23 | US-002 Gate 0 scaffold: add `Plus` + `Pencil` icons, `Dialog` + `Textarea` + `Toaster` primitives (req deps `@radix-ui/react-dialog`, `sonner`), feature comps `CreateProjectDialog` / `CreateFeatureDialog` / `SectionCard` / `SectionEditor` / `AdminGate`. Status `(planned)` cho tới khi US-002 ship.                                                                                                                                                                                                                                                                        | US-002 Gate 0                                |
| 2026-04-24 | US-004 Gate 1 scaffold: add `Check` (retroactive, US-002 T7 ship), `MoreHorizontal`, `Archive` icons + `DropdownMenu` primitive (req dep `@radix-ui/react-dropdown-menu`). Cho overflow menu admin actions trên project-landing. Status `(planned)` cho tới khi US-004 ship.                                                                                                                                                                                                                                                                                                     | US-004 Gate 1                                |
| 2026-04-24 | US-003 Gate 1 scaffold: add `Upload` + `Image` + `ExternalLink` lucide icons + `Github` + `Figma` + `Jira` custom SVG brand icons. Add `UploadButton` + `EmbedCard` feature components. Req dep `file-type` (BE). Status `(planned)` cho tới khi US-003 ship.                                                                                                                                                                                                                                                                                                                    | US-003 Gate 1                                |
| 2026-04-24 | **Nexlab DS adopted** ([ADR-003](../adr/ADR-003-nexlab-design-system.md)). Full token rewrite: primary orange `27 88% 51%` (was shadcn neutral `222 47% 11%`), secondary gold, new semantic tokens (success/warning/info/accent/popover/card + secondary-bg/text), primary ramp 50-900 exposed. Self-host Roboto + Inter via `@fontsource` (Latin + Vietnamese subsets). `NxLogo` brand component registered. Tailwind config: colors/borderRadius/boxShadow/fontFamily rewritten. Dark variants derived từ Nexlab palette. Supersede shadcn-neutral tokens + system font stack. | T-DS-1..4 `3e32743` / `96a1251` / `87b9827`  |
| 2026-05-15 | **AppHeader v2** — full chrome redesign. 5 icon rows mới (`Bell`, `ChevronDown`, `User`, `Settings`, `Home`). 5 component rows mới: `Kbd` primitive + `UserMenu` (Avatar dropdown 4-item, admin gate inside), `NavLinks`, `NotificationBell`, `BreadcrumbBar`. `AppHeader` row description rewritten — old fields (inline username + logout button + admin outline button) collapsed into UserMenu; Row 2 hiển thị breadcrumb + admin CTA. Layout: 2-row, max-w-6xl. Visual rules giữ §3 (primary orange chỉ trên CTA).                                                          | AppHeader v2 spec amend `ca87811`            |
| 2026-05-15 | **AppHeader v2 implemented** — `Kbd` primitive, `NavLinks`, `NotificationBell`, `UserMenu`, `BreadcrumbBar` land. `AppHeader` rewired 2-row sticky chrome (max-w-6xl, backdrop-blur). RequireAuth + CreateProjectDialog tests updated to traverse the new UserMenu dropdown / Row 2 admin CTA.                                                                                                                                                                                                                                                                                   | AppHeader v2 ship                            |
| 2026-05-15 | **US-008 Gate 1 scaffold** — `FeatureActionsMenu` registered §5.3 (admin overflow ⋯ trên FeatureCard, single item "Lưu trữ feature"). Mirror `ProjectActionsMenu` pattern. Status `(planned)` cho tới khi US-008 T5 ship.                                                                                                                                                                                                                                                                                                                                                        | US-008 Gate 1 (spec only)                    |
| 2026-05-15 | **US-008 implemented** — `FeatureActionsMenu` ships + wired vào `FeatureCard` (admin overlay top-right, hide chevron khi admin per BUG-004). `useArchiveFeature` mutation hook lands cùng FE commit. E2E happy path covers archive → list refresh → direct URL 404.                                                                                                                                                                                                                                                                                                              | US-008 ship `a03c345`                        |
| 2026-05-15 | **US-009 Gate 1 scaffold** — `ProfilePage` registered §5.3 + planned `Avatar` extension (`imageUrl` prop). Spec only — implementation lands T2-T5.                                                                                                                                                                                                                                                                                                                                                                                                                               | US-009 Gate 1 (spec only)                    |
| 2026-05-15 | **US-009 implemented** — `ProfilePage` ships ở `/profile`. `Avatar` gains `imageUrl` prop + `lg` size; UserMenu trigger + dropdown header pass `user.avatarUrl`. UserMenu "Hồ sơ của tôi" item enabled qua `asChild <Link to="/profile">`.                                                                                                                                                                                                                                                                                                                                       | US-009 ship `ef3b59a`                        |
| 2026-05-16 | **CR-006 (v3) — warm canvas + sage tokens** ([visual-language v3](visual-language.md)). Add `--canvas` + `--canvas-muted` + `--sage` + `--sage-bg/-text/-foreground` (light + dark). Drops CR-005 reverted accent palette. Used for Notion warm direction: warm page bg variant + sage secondary CTA/banner per [§10 Filled button + banner](visual-language.md#10-component-patterns).                                                                                                                                                                                          | CR-006 Gate 1 (spec only)                    |
| 2026-05-16 | **CR-006 (v3.1) — tile palette + CircleDecor** ([visual-language v3.1](visual-language.md)). Add 6 `--tile-*` tokens (orange/navy/green/amber/peach/rust) + `CircleDecor` primitive. Drops CR-005 reverted. Used for ProjectCard rich tile category identity. Shipped `e1e1f5e` / `ab92574` / `55b6356`, superseded by v4.                                                                                                                                                                                                                                                       | CR-006 v3.1 ship                             |
| 2026-05-16 | **CR-006 (v4) — Dark vivid + glassmorphism amend** ([v4](visual-language.md)). DROP v3/v3.1 tokens. ADD accent palette + hero gradient + logo gradient + neutrals + slate + Montserrat. Replace `CircleDecor` with `GradientHero` / `LogoWatermark` / `ProgressRing`. Pilot scope only.                                                                                                                                                                                                                                                                                          | CR-006 v4 Gate 1 (spec only)                 |
| 2026-05-16 | **CR-006 (v4.3) — SearchPage enrichment**. `EntityGroup` (`apps/web/src/components/search/`) gains `accent` prop (`purple`/`orange`/`green`/`blue`/`rose`) — header icon becomes a gradient plate (size-8 rounded-[10px]) with white icon + matching count pill. `FilterBar` chrome stripped (`mb-6 rounded-xl border bg-muted/40` removed); host page now wraps it in a glassmorphism shell overlapping the hero.                                                                                                                                                               | SearchPage v4.3 `7990e5c`                    |
| 2026-05-16 | **CR-006 (v4.4) — ProjectCard + FeatureCard header simplification**. `ProgressRing` usage REMOVED from both `ProjectCard` and `FeatureCard` (admins/users no longer see the pct ring in card headers). `ProjectActionsMenu` placement on `ProjectCard` moves from tag-pill row → dedicated top-right slot. `ProgressRing` primitive itself still registered (used by `FeatureDetailPage` hero); just dropped from card surfaces.                                                                                                                                                 | ProjectCard `e017419`; FeatureCard `0ce7a3a` |
| 2026-05-16 | **CR-006 (v4.5) — SearchPage 3-col layout**. New inline `SummaryRail` + `HintsRail` components (defined in `apps/web/src/pages/SearchPage.tsx`, not yet promoted to `components/search/`). Left rail = entity nav (5 rows, gradient icon plate + count + anchor scroll). Right rail = 2 cards (Mẹo tìm kiếm + Phím tắt with `<kbd>` chips). Both sticky `top-20`. Promote to standalone components when reused.                                                                                                                                                                  | SearchPage v4.5 `7c31340`                    |

---

## 8. Open items

- Brand primary color — defer; hiện dùng neutral shadcn. Revisit sau pilot (M3) khi có feedback branding.
- Dark-mode screenshot snapshot test (Playwright) — defer T10/post-MVP.
- Toast system (sonner vs custom) — defer; lần đầu cần ở US-002/003 edit flows.
