# UI Spec — Login page

<!-- template: 02-ui-spec-template.md@0.1 -->

> Retroactive spec: shipped ở T8 (`5e90753`). File này reverse-engineer trạng thái code hiện tại để user review. Nếu user muốn đổi layout/copy sau review → follow-up commit `fix(web): align LoginPage with .specs/ui/login.md`.

Referenced tokens, icons, components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `login`
- **Status**: Implemented v2 (`a2b347d`); **v4 Dark vivid + glassmorphism amend pending (CR-006 v4 — flips split + dark brand left + gradient CTA + stat pills)**.
- **Last updated**: 2026-05-16 (v4 amend)

## v4 amendments (CR-006 v4 — Dark vivid + glassmorphism) — supersedes v2 Wire-level below

Pilot scope per [CR-006 §Iteration v4](../changes/CR-006.md) + [visual-language v4](visual-language.md). Replaces v2 Workspace 2-pane layout. Route + Auth + State machine + A11y + Maps US unchanged.

- **Layout flip**: brand panel moves to **LEFT** (xl ≥ 1280px only, `flex-[0_0_620px]`); form on **RIGHT** (flex-1, max-w-[380px] centered). Mobile/tablet stack form full-width (brand hidden).
- **Brand panel** = `GradientHero` primitive (dark gradient + 3 radial blobs + dot grid + logo watermark). Content stack: logo lockup (38×38 plate gradient + "Nexlab" wordmark + "Portal" pill) → h1 "Onboard / nhanh hơn." with gradient text on line 2 → subtitle 1 line → 2×2 feature grid (Nghiệp vụ purple / User flow primary / Business rules green / Tech notes blue) glassmorphism cards → testimonial bottom (Avatar + 5 stars + italic quote + author).
- **Form pane** content: eyebrow chip "✦ Đăng nhập" (primary-purple gradient bg) + h1 "Chào mừng quay lại 👋" (font-display 38px black) + 1-line subtitle + Email + Password fields (height 50, rounded-12, focus halo 4px) + Remember me + gradient CTA "Đăng nhập ngay" (54h, rounded-14, primary→primary-700 gradient + shadow) + "hoặc" divider + Google SSO + 3 stat pills (42 projects / 86% doc / 18 engineers) + footer help text.
- **Stat pills row**: 3 inline chips below SSO button — each `rounded-full bg-{tone}-50 text-{tone}-700 + size-1.75 dot`. Replaces v2 FloatStat collage on right panel.
- DROP v2 components: `FloatStat`, `DecorativeMark` (still in code for now — phase B cleanup).

## Route

- **Path**: `/login`
- **Auth**: ❌ public (nhưng nếu đã login → redirect `next` hoặc `/`)
- **Redirect on unauth**: — (bản thân là trang login)
- **Query params**:
  - `next` (optional): URL-encoded pathname+search để redirect sau login thành công. Default `/`.

## State machine

```
idle
  ├── (user typing) → idle (rhf validates on submit, không realtime)
  ├── (submit + invalid client) → idle + inline validation alerts
  ├── (submit + valid client) → submitting
  │                               ├── → success → navigate(next, replace)
  │                               └── → error   → idle + server error banner
  └── (useMe() returns user)    → navigate(next, replace)   [auto, khi browser revisit /login trong state đã login]
```

- **States**:
  - `idle` — form sẵn sàng nhập; submit button enabled.
  - `submitting` — `login.isPending = true`; button disabled + copy "Đang đăng nhập…".
  - `success` — mutation resolved, effect redirect; form unmount trước khi user nhìn thấy kết quả.
  - `error` — server trả 4xx/5xx; `login.error` là `ApiError`; banner hiển thị `messageForCode(err.code)`; button re-enabled; user có thể retry.

## Interactions

| Trigger              | Action                                            | Next state                 | Side effect                                                     |
| -------------------- | ------------------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| Page load            | `useMe()` fetch session                           | idle hoặc auto-redirect    | Nếu đã login: `useEffect` push `next`                           |
| Click submit (empty) | rhf + zodResolver validate                        | idle + inline errors       | Hiện `role="alert"` text dưới mỗi field invalid                 |
| Click submit (valid) | `login.mutate({email, password})`                 | submitting → success/error | TanStack Query `authKeys.me` cache updated on success           |
| API success          | `onSuccess` → `navigate(next, { replace: true })` | success                    | Session cookie `sid` set bởi BE; `useMe()` invalidated implicit |
| API 401              | `login.error` = ApiError(INVALID_CREDENTIALS)     | error                      | Banner: "Email hoặc mật khẩu không đúng"                        |
| API 429              | `login.error` = ApiError(RATE_LIMITED)            | error                      | Banner: "Thử lại sau vài phút"                                  |
| Enter trong input    | Trigger form submit (rhf default)                 | (như submit)               | —                                                               |

## A11y

- **Keyboard**: tab order = Email → Mật khẩu → Đăng nhập button. Enter submit.
- **No auto-focus on error**: rhf `shouldFocusError: false`. Validation failures render inline alerts dưới field nhưng KHÔNG auto-focus về email — focus stays on submit button để user không bị "nhảy" bất ngờ.
- **Labels**: `<Label htmlFor="email">Email</Label>`, `<Label htmlFor="password">Mật khẩu</Label>`. Input có `autoComplete="username"` + `"current-password"` để password manager bắt đúng.
- **Validation signal**: `aria-invalid="true"` khi field lỗi. Message lỗi `<p role="alert">` ngay dưới field.
- **Server error**: banner `<p role="alert">` kiểu destructive-foreground trên destructive bg, ở giữa form và button.
- **Landmarks**: `<main>` wrap toàn trang (no header cho page này vì AppHeader chỉ mount sau RequireAuth).
- **Focus ring**: dùng token `--ring` (xem design-system §1).
- **Contrast**: theo token (4.5:1 đảm bảo).

## Wire-level description (UI uplift v2 — Workspace 2-pane — CR-002)

### Desktop (≥ 1280px)

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────┬──────────────────────────────────────────────┐  │
│ │ LEFT — FORM (540px white)  │ RIGHT — BRAND PANEL (gradient + collage)     │  │
│ │ py-15 px-16                 │ primary-50 → 100 → 200                        │  │
│ │                             │ position relative overflow-hidden             │  │
│ │ [NxLogo lockup 32]          │                                                │  │
│ │                             │  ┌─NxLogo MARK watermark abs top-right        │  │
│ │ flex-1 center, max-w-sm     │  │ size-[520px] opacity-0.18 rotate-[-8deg]   │  │
│ │                             │  └─                                            │  │
│ │ ONBOARDING PORTAL eyebrow   │                                                │  │
│ │                             │  ┌─FloatStat 1 (top-30 left-14)──────┐         │  │
│ │ Chào mừng quay lại 👋       │  │ 📁 Active projects                  │         │  │
│ │ ↑ h2 38/44 bold tracking    │  │ 42                                  │         │  │
│ │                             │  │ +3 tuần này (primary)               │         │  │
│ │ Dùng tài khoản nội bộ…      │  └─                                              │  │
│ │ ↑ subtitle 15/24 muted      │                                                │  │
│ │                             │  ┌─FloatStat 2 (top-75 left-72)──────┐         │  │
│ │ ┌─────────────────────────┐ │  │ 👥 Engineers onboarded             │         │  │
│ │ │ Email                   │ │  │ 18 (info indigo)                   │         │  │
│ │ │ [📧 ten.ban@nexlab.vn]  │ │  └─                                              │  │
│ │ │ height 48 rounded 10    │ │                                                │  │
│ │ └─────────────────────────┘ │  ┌─FloatStat 3 (top-125 left-20)─────┐         │  │
│ │                             │  │ ✓ Tỉ lệ feature có doc             │         │  │
│ │ ┌─────────────────────────┐ │  │ 86% (success green)                │         │  │
│ │ │ Mật khẩu      Quên?     │ │  │ +12% so với Q1                     │         │  │
│ │ │ [🔒 ••••••••]           │ │  └─                                              │  │
│ │ └─────────────────────────┘ │                                                │  │
│ │                             │  ┌─FloatStat 4 (top-155 left-80)─────┐         │  │
│ │ ☑ Ghi nhớ tôi 7 ngày        │  │ ⏱ Time-to-onboard                   │         │  │
│ │                             │  │ 2.3h (warning amber)                │         │  │
│ │ ┌─────────────────────────┐ │  │ ↓ 45 phút                           │         │  │
│ │ │   Đăng nhập         →   │ │  └─                                              │  │
│ │ │ primary 48 shadow       │ │                                                │  │
│ │ └─────────────────────────┘ │  ┌─TESTIMONIAL CARD bottom-9 px-14──┐         │  │
│ │                             │  │ glassmorphism rgba(255,255,255,0.78)│         │  │
│ │ ───── hoặc ─────            │  │ backdrop-blur-md ring border        │         │  │
│ │                             │  │                                     │         │  │
│ │ ┌─────────────────────────┐ │  │ [NL] Ngọc Linh · Senior Dev        │         │  │
│ │ │ G  Tiếp tục với Google  │ │  │      Onboard 14/03/2026             │         │  │
│ │ │   Workspace             │ │  │                                     │         │  │
│ │ │ outline 44              │ │  │ italic "Trang này giúp mình hiểu    │         │  │
│ │ └─────────────────────────┘ │  │ nghiệp vụ trong 2 ngày — trước     │         │  │
│ │                             │  │ đây mất cả tuần đi hỏi từng người." │         │  │
│ │ Chưa có tài khoản? Liên hệ  │  └─                                              │  │
│ │ → quản trị viên link        │                                                │  │
│ └────────────────────────────┴──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile / Tablet (<1280px) — brand pane hidden, form full-width centered

### Layout primitives

- **Page container**: `min-h-screen flex overflow-hidden`. No AppHeader (login is pre-auth).
- **2-pane split** xl breakpoint:
  - Left form pane: `flex-shrink-0 w-[540px] flex flex-col py-15 px-16 bg-background`.
  - Right brand pane: `hidden xl:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#FFF8EE] via-[#FDEED7] to-[#FBDAAD] dark:from-primary-950/40 dark:via-primary-900/30 dark:to-primary-800/30`.

### Left pane — Form

- **NxLogo** lockup variant size-32 (height 32px) top-aligned, click → noop.
- **Form block** flex-1 center, max-w-sm:
  - Eyebrow: `font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary-600` "ONBOARDING PORTAL".
  - h2 (was h1): `font-display text-[38px] leading-[44px] font-bold tracking-[-0.02em] text-foreground mt-3.5 mb-2` "Chào mừng quay lại 👋".
  - Subtitle: `font-body text-[15px] leading-6 text-muted-foreground mb-8` "Dùng tài khoản nội bộ để xem và đóng góp tài liệu onboarding cho các feature đang phát triển."
  - **Field stack** `flex flex-col gap-4`:
    - **Email** field 48px height, leading icon `<Mail size-4 text-muted-foreground>`, placeholder "ten.ban@nexlab.vn", autoComplete="username".
    - **Mật khẩu** field 48px height, leading icon `<Lock>`, type="password", autoComplete="current-password", right-link "Quên?" — `font-ui text-xs font-semibold text-primary-600` placeholder click → toast "Đặt lại mật khẩu liên hệ admin trong v1".
    - Field container: `border border-border rounded-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12` with input transparent inside.
  - **Remember me checkbox** `mt-4.5 flex items-center gap-2.5 font-ui text-[13px] font-medium text-foreground/80`:
    - Custom checkbox: 18×18 `rounded-md transition-all` (active: `bg-primary` với `<Check size-3 text-white strokeWidth=2.4>`; idle: `border border-border bg-background`).
    - Label: "Ghi nhớ tôi 7 ngày".
  - **Submit button** `mt-7 h-12 rounded-lg bg-primary text-primary-foreground font-ui font-bold text-sm shadow-[0_4px_12px_rgba(226,99,20,0.32),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] hover:brightness-105 flex items-center justify-center gap-2 transition-all`: "Đăng nhập" + `<ArrowRight size-4>`. Loading state: disabled + copy "Đang đăng nhập…" + spinner.
  - **Divider** `my-7 flex items-center gap-3.5`: `flex-1 h-px bg-border` + `font-ui text-xs text-muted-foreground` "hoặc" + `flex-1 h-px bg-border`.
  - **Google button** `h-11 w-full rounded-lg border border-border bg-background hover:bg-muted font-ui font-semibold text-sm flex items-center justify-center gap-2.5 transition-all`: "G" badge (18×18 white border rounded-sm bold) + "Tiếp tục với Google Workspace". v1 placeholder click → toast "SSO đang phát triển trong v2".
  - **Footer help text** `mt-7 font-body text-xs text-muted-foreground` "Chưa có tài khoản? Liên hệ <a className=\"text-primary-600 font-semibold\">quản trị viên</a> để được cấp quyền truy cập." Link → `mailto:admin@nexlab.vn` hoặc placeholder toast.

### Right pane — Brand panel (xl only)

- **DecorativeMark** abs `top-[-60px] right-[-60px] size-[520px] opacity-[0.18] rotate-[-8deg]`, NxLogo mark variant gradient-masked với primary tone. `aria-hidden`.
- **4 FloatStat cards** (charter §10) positioned absolutely với offsets:
  1. **Active projects** — `top-30 left-14`, primary tone, value "42", delta "+3 tuần này".
  2. **Engineers onboarded** — `top-75 left-72`, info tone, value "18", delta "2 đang làm việc".
  3. **Tỉ lệ feature có doc** — `top-125 left-20`, success tone, value "86%", delta "+12% so với Q1".
  4. **Time-to-onboard** — `top-155 left-80`, warning tone, value "2.3h", delta "↓ 45 phút".
- **FloatStat container**: `absolute w-60 p-4.5 rounded-2xl bg-white/92 dark:bg-card/90 backdrop-blur-md shadow-[0_12px_32px_rgba(149,59,23,0.16),0_0_0_1px_rgba(255,255,255,0.6)] flex flex-col gap-2.5`. Inside:
  - Top row: icon plate 36×36 `rounded-lg bg-{tone}/10%` + lucide icon size-4.5 + label `font-ui text-xs leading-snug text-muted-foreground`.
  - Value: `font-display text-[28px] leading-none font-bold tracking-[-0.02em]`.
  - Delta: `font-ui text-xs font-medium text-{tone}-600 dark:text-{tone}-400`.
- **Testimonial card** abs `bottom-9 left-14 right-14 p-6 rounded-2xl bg-white/78 dark:bg-card/85 backdrop-blur-md ring-1 ring-white/60 dark:ring-border`:
  - Header `flex items-center gap-3 mb-2.5`: `<Avatar size="md">` 40×40 với "NL" gradient + stack: `font-ui text-[13px] font-semibold` "Ngọc Linh · Senior Dev" + sub `font-ui text-[11px] leading-snug text-muted-foreground mt-1` "Onboard ngày 14/03/2026".
  - Quote: `font-body italic text-sm leading-[20px] text-foreground/80` "Trang này giúp mình hiểu nghiệp vụ trong 2 ngày — trước đây mất cả tuần đi hỏi từng người."

### Out of scope v1 / placeholder

- 4 FloatStat numbers all hardcoded (42 / 18 / 86% / 2.3h) — no admin dashboard query yet.
- Testimonial card hardcoded (Ngọc Linh persona, fixed copy).
- "Quên?" link → toast.
- Google SSO button → toast "SSO đang phát triển v2".
- "Liên hệ quản trị viên" link → mailto / toast.
- "Ghi nhớ tôi 7 ngày" checkbox: cosmetic v1 (session cookie default behavior; not actually extending TTL).
- Brand panel hidden on tablet/mobile breakpoints (<1280px).

### Components introduced/reused

- **NEW**: `LoginBrandPanel` (right pane wrapper với decorative mark + 4 FloatStats + testimonial card).
- **NEW**: `FloatStat` (charter §10 — 4-tone variant glassmorphism card).
- **NEW**: `Avatar` size="md" 40×40 extension of existing avatar primitive.
- **REUSE**: existing form (Input/Label/Button), `NxLogo` (lockup variant), checkbox primitive.
- **lucide**: `Mail`, `Lock`, `Check`, `ArrowRight`, `FolderOpen`, `Users`, `CheckCircle`, `Clock`.

### Tokens & typography

- Eyebrow: `text-[12px] font-semibold uppercase tracking-[0.16em] text-primary-600`.
- h2: `font-display text-[38px] leading-[44px] font-bold tracking-[-0.02em]`.
- Subtitle: `font-body text-[15px] leading-6 text-muted-foreground`.
- Field label: `font-ui text-xs font-semibold text-foreground/80`.
- Submit button: `font-ui text-sm font-bold`.
- FloatStat value: `font-display text-[28px] font-bold tracking-[-0.02em]`.
- Testimonial quote: `font-body italic text-sm leading-[20px]`.
- Brand panel gradient (light): `from-[#FFF8EE] via-[#FDEED7] to-[#FBDAAD]`.

### Spacing

- Form pane: `py-15 px-16` (60/64px).
- Form block max-w-sm: heading→subtitle mb-8, fields gap-4, fields→checkbox mt-4.5, checkbox→submit mt-7, submit→divider my-7, Google btn→footer mt-7.
- Brand pane: FloatStats positioned via absolute offsets (collage feel). Testimonial bottom-9, p-6.

## Error / empty / loading states

- **Loading (submitting)**: button disabled + text đổi sang "Đang đăng nhập…". Inputs vẫn focusable (user có thể edit nếu mutation chậm) nhưng re-submit bị block qua `disabled`.
- **Empty**: N/A (login không có empty state).
- **Error — client validation**: Zod issue → text đỏ `text-xs text-destructive` dưới field sai, `role="alert"`.
- **Error — server (401 INVALID_CREDENTIALS)**: banner text `text-sm text-destructive` giữa form + button. Copy từ `errorMessages.ts` = "Email hoặc mật khẩu không đúng".
- **Error — server (429 RATE_LIMITED)**: cùng banner, copy "Thử lại sau vài phút".
- **Error — network / 5xx**: cùng banner, copy mặc định "Có lỗi xảy ra, thử lại" (INTERNAL_ERROR fallback).
- **Unauthenticated**: N/A (this page is the destination).

## Maps US

- [US-001](../stories/US-001.md) — AC-1 (đăng nhập thành công), AC-2 (lỗi credentials), AC-10 (redirect về `next`), AC-11 (session persist cross-refresh).

## Implementation

- **Task**: [T8](../stories/US-001/tasks.md#t8--login-page--auth-guard) — shipped `5e90753`
- **Page component**: [apps/web/src/pages/LoginPage.tsx](../../apps/web/src/pages/LoginPage.tsx)
- **Queries**: [apps/web/src/queries/auth.ts](../../apps/web/src/queries/auth.ts) (`useMe`, `useLogin`)
- **Schema**: `loginRequestSchema` từ [@onboarding/shared](../../packages/shared/src/schemas/auth.ts)
- **Error copy map**: [apps/web/src/lib/errorMessages.ts](../../apps/web/src/lib/errorMessages.ts)
- **Tests**: [apps/web/tests/pages/LoginPage.test.tsx](../../apps/web/tests/pages/LoginPage.test.tsx) — 5 cases

## Open items (for user review)

Lần đầu viết UI spec retroactive cho login. User review và đánh dấu rõ những mục muốn đổi:

- [ ] Heading copy "Đăng nhập" — OK? (thay "Đăng nhập vào portal"?)
- [ ] Sub-copy "Dùng tài khoản nội bộ để xem tài liệu onboarding." — OK?
- [ ] Button copy "Đăng nhập" / loading "Đang đăng nhập…" — OK?
- [ ] Layout: form vertical-centered full viewport — OK? (thay thành top-aligned với margin?)
- [ ] Container width `max-w-sm` (384px) — OK? (rộng hơn / hẹp hơn?)
- [ ] Không có logo/brand ở trang login — OK hay muốn thêm?
- [ ] Error banner style: inline text giữa form (plain) — OK hay muốn bordered alert box?
- [ ] Không có "Forgot password?" link — OK? (v1 không có reset flow; admin reset thủ công)
