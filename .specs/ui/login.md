# UI Spec — Login page

<!-- template: 02-ui-spec-template.md@0.1 -->

> Retroactive spec: shipped ở T8 (`5e90753`). File này reverse-engineer trạng thái code hiện tại để user review. Nếu user muốn đổi layout/copy sau review → follow-up commit `fix(web): align LoginPage with .specs/ui/login.md`.

Referenced tokens, icons, components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `login`
- **Status**: Implemented
- **Last updated**: 2026-04-23

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

## Wire-level description

```
┌─────────────────────────────────────────┐
│  (trang centered vertical, no header)   │
│                                         │
│         ╔══════════════════════╗        │
│         ║ Đăng nhập            ║  h1    │
│         ║ Dùng tài khoản nội…  ║  muted │
│         ║                      ║        │
│         ║ Email                ║  label │
│         ║ [______________]     ║  input │
│         ║                      ║        │
│         ║ Mật khẩu             ║  label │
│         ║ [______________]     ║  input │
│         ║                      ║        │
│         ║ [Error banner khi có]║  alert │
│         ║                      ║        │
│         ║ [   Đăng nhập   ]    ║  btn   │
│         ╚══════════════════════╝        │
│                                         │
└─────────────────────────────────────────┘
```

- **Layout**: 1-col centered. Container `max-w-sm` (384px). Padding `px-6 py-12`. Min-height full viewport (`min-h-screen`) + `flex flex-col justify-center` để card căn giữa dọc.
- **Responsive**: mobile 375px — container giữ `max-w-sm` nhưng padding `px-6` vẫn thoáng; không breakpoint-specific override.
- **Key components** (từ design-system §5):
  - `Button` variant `default`, size `default`, `type="submit"`.
  - `Input` (2×: email, password).
  - `Label` (2×).
- **Key tokens** (từ design-system §1):
  - `bg-background` trên `<main>`.
  - `text-foreground` cho heading + input text.
  - `text-muted-foreground` cho sub-copy "Dùng tài khoản nội bộ…".
  - `text-destructive` cho inline validation errors + server error banner.
  - Focus ring `ring-ring`.
- **Typography** (design-system §2):
  - Heading: `text-2xl font-semibold`.
  - Sub-copy: `text-sm text-muted-foreground`.
  - Input body: `text-sm`.
  - Validation error: `text-xs` cho per-field, `text-sm` cho server banner.
- **Spacing**:
  - Form vertical gap: `gap-4`.
  - Label → input gap: `gap-1`.
  - Heading → sub-copy gap: `mt-1`.
  - Sub-copy → form gap: `mt-6`.

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
