# Design System Registry

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · Source of truth for cross-screen UI consistency: tokens, icons, components, a11y floor._

Mỗi file `.specs/ui/<screen>.md` **must** reference tokens/components ở file này — không redefine colors/fonts/spacing locally. Thêm token/variant/icon mới = update file này trong commit riêng trước khi code.

Related: [ADR-002 light+dark theme](../adr/ADR-002-light-dark-theme.md), [templates/02-ui-spec-template.md](../../templates/02-ui-spec-template.md).

---

## 1. Theme tokens

Light + dark theme qua Tailwind `darkMode: "class"` + CSS vars trên `:root` và `.dark` ([apps/web/src/styles/index.css](../../apps/web/src/styles/index.css)). Mọi color trong code **must** reference token; 0 raw hex.

### 1.1 Token map

| Token                      | Light HSL     | Dark HSL      | Dùng ở                                         |
| -------------------------- | ------------- | ------------- | ---------------------------------------------- |
| `--background`             | `0 0% 100%`   | `222 47% 11%` | Page background, card background               |
| `--foreground`             | `222 47% 11%` | `210 40% 98%` | Primary text                                   |
| `--muted`                  | `210 40% 96%` | `217 33% 17%` | Subtle surfaces (hover, secondary bg)          |
| `--muted-foreground`       | `215 16% 47%` | `215 20% 65%` | Sub-copy, placeholder, disabled text           |
| `--border`                 | `214 32% 91%` | `217 33% 17%` | Input border, card divider                     |
| `--input`                  | `214 32% 91%` | `217 33% 17%` | Input border (alias of `--border` hiện tại)    |
| `--ring`                   | `222 47% 11%` | `210 40% 98%` | Focus ring (`focus-visible:ring-2`)            |
| `--primary`                | `222 47% 11%` | `210 40% 98%` | Button primary bg, link, focus-visible outline |
| `--primary-foreground`     | `210 40% 98%` | `222 47% 11%` | Text on primary bg                             |
| `--destructive`            | `0 84% 60%`   | `0 63% 31%`   | Error text, destructive action bg              |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Text on destructive bg                         |
| `--radius`                 | `0.5rem`      | `0.5rem`      | Border radius base (Button/Input/Card)         |

**Contrast**: mọi cặp fg/bg ≥ 4.5:1 (WCAG AA) trong cả 2 mode. Verify bằng eyeball + Chrome DevTools contrast checker.

**Hiện trạng code (T4 ship)**: `:root` block đã có light tokens; `--ring` + `--input` + `.dark` block **chưa có** — sẽ thêm trong T8.5.

### 1.2 Theme toggle behavior

- **States**: `"light" | "dark" | "system"` (default: `"system"`).
- **Persistence**: `localStorage["theme"]`. Read on mount, write on change.
- **Apply**: `<html>` mang class `dark` khi resolved mode = dark (resolved từ explicit user choice hoặc `matchMedia("(prefers-color-scheme: dark)")` khi state = `"system"`).
- **Cycle order**: Light → Dark → System → Light (1 button trong AppHeader).
- **System listener**: `matchMedia` change event → re-resolve khi state = `"system"`.
- **Fallback**: localStorage disabled → default `"system"`, không throw.
- **Impl**: [apps/web/src/lib/theme.tsx](../../apps/web/src/lib/theme.tsx) (land T8.5).

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

| Icon      | Dùng ở                       | Label                            |
| --------- | ---------------------------- | -------------------------------- |
| `Sun`     | ThemeToggle (state = light)  | "Đang dùng chế độ sáng"          |
| `Moon`    | ThemeToggle (state = dark)   | "Đang dùng chế độ tối"           |
| `Monitor` | ThemeToggle (state = system) | "Theo chế độ hệ thống"           |
| `LogOut`  | AppHeader logout button      | "Đăng xuất" (kèm text, decor-ok) |
| `Search`  | SearchPage input affordance  | "Tìm kiếm" (T10)                 |

---

## 5. Component inventory

Mọi component dùng lại phải listed ở đây. Không variant mới / copy mới = không thêm row → component ổn.

### 5.1 Primitives — shadcn-style ([apps/web/src/components/ui/](../../apps/web/src/components/ui/))

| Component | Variants                                        | Sizes                            | File         |
| --------- | ----------------------------------------------- | -------------------------------- | ------------ |
| `Button`  | `default` / `destructive` / `outline` / `ghost` | `default` / `sm` / `lg` / `icon` | `button.tsx` |
| `Input`   | —                                               | default height `h-10`            | `input.tsx`  |
| `Label`   | —                                               | —                                | `label.tsx`  |

Thêm variant / component mới:

1. Propose trong commit spec: update bảng này + CHANGELOG §7.
2. User review + approve.
3. Implement + test.

### 5.2 Layout components ([apps/web/src/components/layout/](../../apps/web/src/components/layout/))

| Component       | Purpose                                          | Land ở    |
| --------------- | ------------------------------------------------ | --------- |
| `ErrorBoundary` | Catch render errors → fallback UI                | T4        |
| `RequireAuth`   | Gate route subtree behind `useMe()` session      | T8        |
| `AppHeader`     | App chrome: logo, user name, logout, ThemeToggle | T8 + T8.5 |
| `ThemeToggle`   | Tri-state button cycle light/dark/system (§1.2)  | T8.5      |

### 5.3 Feature components ([apps/web/src/components/features/](../../apps/web/src/components/features/))

Empty cho đến T9. Expect: `FeatureList`, `SectionIndicator`, `MarkdownView`, `FeatureSections`.

---

## 6. A11y floor (áp dụng mọi screen)

- **Keyboard**: tab order theo reading order; focus luôn visible qua `focus-visible:ring-2 ring-ring`.
- **Labels**: mọi `<input>` có `<Label htmlFor>`; icon-only button có `aria-label`.
- **Live regions**: error inline có `role="alert"` (hoặc wrap `aria-live="polite"`); loading state `aria-busy="true"`.
- **Contrast**: token đã chọn đảm bảo ≥ 4.5:1. Không được set màu cứng vì lý do gì ngoài token.
- **Landmarks**: `<main>` cho page content; `<header>` cho AppHeader; `<nav>` nếu có nav.
- **Motion**: tôn trọng `prefers-reduced-motion` — không auto-play animation > 200ms.

---

## 7. CHANGELOG

Thêm row khi đổi token, icon registry, component inventory. Breaking change (rename/remove token) → bump minor version của file này + migrate per-screen specs cùng PR.

| Date       | Change                                                                                 | PR / commit |
| ---------- | -------------------------------------------------------------------------------------- | ----------- |
| 2026-04-23 | Initial scaffold: 10 tokens + lucide-react icon rules + 3 primitives + 4 layout comps. | (this)      |

---

## 8. Open items

- Brand primary color — defer; hiện dùng neutral shadcn. Revisit sau pilot (M3) khi có feedback branding.
- Dark-mode screenshot snapshot test (Playwright) — defer T10/post-MVP.
- Toast system (sonner vs custom) — defer; lần đầu cần ở US-002/003 edit flows.
