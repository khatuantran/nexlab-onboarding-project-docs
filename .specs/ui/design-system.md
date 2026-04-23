# Design System Registry

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · Source of truth for cross-screen UI consistency: tokens, icons, components, a11y floor._

Mỗi file `.specs/ui/<screen>.md` **must** reference tokens/components ở file này — không redefine colors/fonts/spacing locally. Thêm token/variant/icon mới = update file này trong commit riêng trước khi code.

Related: [ADR-002 light+dark theme](../adr/ADR-002-light-dark-theme.md), [templates/02-ui-spec-template.md](../../templates/02-ui-spec-template.md).

---

## 1. Theme tokens

Light + dark theme qua Tailwind `darkMode: "class"` + CSS vars trên `:root` và `.dark` ([apps/web/src/styles/index.css](../../apps/web/src/styles/index.css)). Mọi color trong code **must** reference token; 0 raw hex.

### 1.1 Token map

| Token                      | Light HSL     | Dark HSL      | Dùng ở                                          |
| -------------------------- | ------------- | ------------- | ----------------------------------------------- |
| `--background`             | `0 0% 100%`   | `222 47% 11%` | Page background, card background                |
| `--foreground`             | `222 47% 11%` | `210 40% 98%` | Primary text                                    |
| `--muted`                  | `210 40% 96%` | `217 33% 17%` | Subtle surfaces (hover, secondary bg)           |
| `--muted-foreground`       | `215 16% 47%` | `215 20% 65%` | Sub-copy, placeholder, disabled text            |
| `--border`                 | `214 32% 91%` | `217 33% 17%` | Input border, card divider                      |
| `--input`                  | `214 32% 91%` | `217 33% 17%` | Input border (alias of `--border` hiện tại)     |
| `--ring`                   | `222 47% 11%` | `210 40% 98%` | Focus ring (`focus-visible:ring-2`)             |
| `--primary`                | `222 47% 11%` | `210 40% 98%` | Button primary bg, link, focus-visible outline  |
| `--primary-foreground`     | `210 40% 98%` | `222 47% 11%` | Text on primary bg                              |
| `--destructive`            | `0 84% 60%`   | `0 75% 60%`   | Error text, destructive action bg               |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Text on destructive bg                          |
| `--highlight`              | `48 96% 89%`  | `48 60% 35%`  | `<mark>` bg (search snippet, future highlights) |
| `--radius`                 | `0.5rem`      | `0.5rem`      | Border radius base (Button/Input/Card)          |

**Contrast**: mọi cặp fg/bg ≥ 4.5:1 (WCAG AA) trong cả 2 mode. Verify bằng eyeball + Chrome DevTools contrast checker.

**Hiện trạng code**: `:root` + `.dark` + `--ring` + `--input` landed T8.5 (`51802c0`).

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

- **Font family**: system stack (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Không web font cho v1 (latency + Vietnamese diacritics render OK với system).
- **Scale** (Tailwind class):

| Role                  | Tailwind                        | Size | Line-height |
| --------------------- | ------------------------------- | ---- | ----------- |
| H1 (page title)       | `text-2xl font-semibold`        | 24px | 32px        |
| H2 (section)          | `text-xl font-semibold`         | 20px | 28px        |
| H3 (sub-section)      | `text-lg font-medium`           | 18px | 28px        |
| Body default          | `text-sm`                       | 14px | 20px        |
| Body prose (markdown) | `text-base leading-relaxed`     | 16px | 28px        |
| Caption / helper text | `text-xs text-muted-foreground` | 12px | 16px        |

- **Letter-spacing**: Tailwind default (`tracking-normal` cho body, `tracking-tight` cho heading).

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

| Icon           | Dùng ở                                                 | Label                            |
| -------------- | ------------------------------------------------------ | -------------------------------- |
| `Sun`          | ThemeToggle (state = light)                            | "Đang dùng chế độ sáng"          |
| `Moon`         | ThemeToggle (state = dark)                             | "Đang dùng chế độ tối"           |
| `Monitor`      | ThemeToggle (state = system)                           | "Theo chế độ hệ thống"           |
| `LogOut`       | AppHeader logout button                                | "Đăng xuất" (kèm text, decor-ok) |
| `Search`       | SearchPage input affordance + header                   | "Tìm kiếm" (T10)                 |
| `X`            | FilterChip remove button (T10) + Dialog close (US-002) | "Bỏ lọc" / "Đóng"                |
| `Plus`         | "Tạo project" + "Thêm feature" buttons (US-002)        | decor (kèm text, aria-hidden)    |
| `Pencil`       | Section "Sửa" toggle (US-002)                          | "Sửa nội dung section"           |
| `ChevronRight` | Card CTA, breadcrumb separator (T9)                    | decor (aria-hidden)              |
| `FileText`     | Feature card leading icon (T9)                         | decor (aria-hidden)              |
| `Clock`        | Relative-time indicator (T9)                           | decor (aria-hidden)              |
| `AlertCircle`  | Empty-section / error state (T9, T10)                  | decor (aria-hidden)              |

---

## 5. Component inventory

Mọi component dùng lại phải listed ở đây. Không variant mới / copy mới = không thêm row → component ổn.

### 5.1 Primitives — shadcn-style ([apps/web/src/components/ui/](../../apps/web/src/components/ui/))

| Component  | Variants                                                                                                                 | Sizes                                               | File                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------- |
| `Button`   | `default` / `destructive` / `outline` / `ghost`                                                                          | `default` / `sm` / `lg` / `icon`                    | `button.tsx`            |
| `Input`    | —                                                                                                                        | default height `h-10`                               | `input.tsx`             |
| `Label`    | —                                                                                                                        | —                                                   | `label.tsx`             |
| `Card`     | `default` (land T9)                                                                                                      | padding `p-5`, rounded `rounded-lg`                 | `card.tsx`              |
| `Dialog`   | shadcn wrapper around Radix `@radix-ui/react-dialog` (Trigger / Content / Header / Footer / Title / Description / Close) | default `max-w-md`, `sm` `max-w-sm`                 | `dialog.tsx` (US-002)   |
| `Textarea` | —                                                                                                                        | `min-h-32`, `text-sm font-mono` cho markdown editor | `textarea.tsx` (US-002) |
| `Toaster`  | sonner mount at app root — `success` / `error` / `info` variants theme-aware                                             | —                                                   | `toaster.tsx` (US-002)  |

Thêm variant / component mới:

1. Propose trong commit spec: update bảng này + CHANGELOG §7.
2. User review + approve.
3. Implement + test.

### 5.2 Layout components ([apps/web/src/components/layout/](../../apps/web/src/components/layout/))

| Component       | Purpose                                                                          | Land ở                 |
| --------------- | -------------------------------------------------------------------------------- | ---------------------- |
| `ErrorBoundary` | Catch render errors → fallback UI                                                | T4                     |
| `RequireAuth`   | Gate route subtree behind `useMe()` session                                      | T8                     |
| `AppHeader`     | App chrome: logo, user name, logout, ThemeToggle                                 | T8 + T8.5 ✅ `51802c0` |
| `ThemeToggle`   | Tri-state button cycle light/dark/system (§1.2)                                  | T8.5 ✅ `51802c0`      |
| `Breadcrumb`    | "Demo / Login" link trail cho feature detail                                     | T9 (planned)           |
| `FeatureCard`   | Card grid item: title + filledCount badge + relative time (ProjectLanding)       | T9 (planned)           |
| `SectionBadge`  | "3/5" pill hiển thị filledCount                                                  | T9 (planned)           |
| `RelativeTime`  | `<time>` với `title=ISO`, text "2 giờ trước" (date-fns vi locale)                | T9 (planned)           |
| `MarkdownView`  | Render markdown (markdown-it) + sanitize (DOMPurify), chỉ allow whitelisted tags | T9 (planned)           |
| `SectionToc`    | Sticky left sidebar (desktop) / top dropdown (mobile) với 5 anchor link          | T9 (planned)           |
| `EmptyState`    | Icon + copy + optional CTA cho trường hợp empty (no features, empty section)     | T9 (planned)           |
| `SearchInput`   | AppHeader persistent search field; Enter submit → `/search?q=...&projectSlug=?`  | T10 (planned)          |
| `FilterChip`    | Pill "× Trong Demo" cho scope filter remove                                      | T10 (planned)          |

### 5.3 Feature components ([apps/web/src/components/features/](../../apps/web/src/components/features/))

Empty cho đến T9. Expect: `FeatureList`, `SectionIndicator`, `MarkdownView`, `FeatureSections`.

T10 adds: `SearchResultRow` — `<Link>` wrap breadcrumb (`projectSlug › featureSlug`) + title + sanitized snippet với `<mark>` highlight. Used in [SearchPage](../../apps/web/src/pages/SearchPage.tsx).

US-002 adds (planned): `CreateProjectDialog`, `CreateFeatureDialog`, `SectionCard` (view/edit mode toggle per AC-5), `SectionEditor` (2-col textarea + preview), `AdminGate` (wrapper hiding children when user.role !== "admin").

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

| Date       | Change                                                                                                                                                                                                                                                                                                    | PR / commit   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 2026-04-23 | Initial scaffold: 10 tokens + lucide-react icon rules + 3 primitives + 4 layout comps.                                                                                                                                                                                                                    | (this)        |
| 2026-04-23 | Dark `--destructive` 31% → 60% lightness — original was too dark for `text-destructive` on dark bg (fails 4.5:1).                                                                                                                                                                                         | T8.5 Gate 2   |
| 2026-04-23 | T9 scaffold: add 4 icons (ChevronRight, FileText, Clock, AlertCircle) + Card primitive + 7 layout components (Breadcrumb, FeatureCard, SectionBadge, RelativeTime, MarkdownView, SectionToc, EmptyState). Status `(planned)` cho tới khi T9 ship.                                                         | T9 Gate 1     |
| 2026-04-23 | T9 components implemented + shipped. Status flip `(planned)` → live.                                                                                                                                                                                                                                      | T9 `879b15b`  |
| 2026-04-23 | T10 scaffold: add `--highlight` token (light `48 96% 89%` / dark `48 60% 35%`), `Search` + `X` icons, `SearchInput` + `SearchResultRow` + `FilterChip` components. Status `(planned)` tới khi T10 ship.                                                                                                   | T10 Gate 1    |
| 2026-04-23 | T10 ship: `--highlight`, `Search`/`X`, `SearchInput`/`SearchResultRow`/`FilterChip` live.                                                                                                                                                                                                                 | T10 `5ca8e49` |
| 2026-04-23 | US-002 Gate 0 scaffold: add `Plus` + `Pencil` icons, `Dialog` + `Textarea` + `Toaster` primitives (req deps `@radix-ui/react-dialog`, `sonner`), feature comps `CreateProjectDialog` / `CreateFeatureDialog` / `SectionCard` / `SectionEditor` / `AdminGate`. Status `(planned)` cho tới khi US-002 ship. | US-002 Gate 0 |

---

## 8. Open items

- Brand primary color — defer; hiện dùng neutral shadcn. Revisit sau pilot (M3) khi có feedback branding.
- Dark-mode screenshot snapshot test (Playwright) — defer T10/post-MVP.
- Toast system (sonner vs custom) — defer; lần đầu cần ở US-002/003 edit flows.
