# UI Spec — Create Project Dialog

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `create-project-dialog`
- **Status**: Implemented (T4 `956b959`)
- **Last updated**: 2026-04-23
- **Kind**: overlay dialog (Radix portal) — không có URL riêng.

## Route

- **Trigger**: button "Tạo project" trong `AppHeader` (admin only, hidden qua `AdminGate`). Click mở dialog.
- **Host routes**: bất kỳ protected route nào (dialog portal render ở body, không ảnh hưởng routing).
- **Auth**: 🔐 admin only (UI gate + server-side 403 fallback).
- **API call**: `POST /api/v1/projects` với body `{ slug, name, description? }`. Response 201: `{ data: { id, slug, name, description, createdAt, updatedAt } }`.

## State machine

```text
closed → open (click "Tạo project")
open:
  idle → typing (input change, realtime slug derive from name)
  typing → submitting (user click "Tạo" | Enter)
  submitting:
    ├── 201 → toast success "Đã tạo project" → close dialog → navigate("/projects/:slug")
    ├── 409 PROJECT_SLUG_TAKEN → inline error cạnh slug input; stay open; keep draft
    ├── 400 VALIDATION_ERROR → per-field error bên dưới input tương ứng
    ├── 403 FORBIDDEN → sonner destructive "Bạn không có quyền tạo project" + close (UI gate rò rỉ = bug)
    └── other → sonner destructive "Có lỗi xảy ra, thử lại" + stay open
  open → closed (click X | ESC | overlay click | "Hủy" | success navigate)
```

- **States**: `closed`, `idle`, `typing`, `submitting`, `error-inline` (409/400), `error-toast` (403/5xx).

## Interactions

| Trigger                      | Action                                                                                                                        | Next state                | Side effect                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| Click "Tạo project" header   | Open dialog, focus first input (`name`)                                                                                       | closed → idle             | Radix sets `aria-modal=true`; body scroll lock   |
| Type `name`                  | Update form.name; auto-derive `slug` via `toKebabCase(name)` nếu user chưa tự sửa slug                                        | idle → typing             | —                                                |
| Type `slug` thủ công         | User override auto-derive (flag `slugTouched=true`); validate regex `^[a-z0-9-]+$` realtime                                   | typing                    | —                                                |
| Submit (Enter / click "Tạo") | `POST /projects` với trimmed body                                                                                             | typing → submitting       | Disable submit button; loading spinner in button |
| 201                          | Toast "Đã tạo project" 2s; close dialog; `navigate("/projects/:slug")`; TanStack Query invalidate `["projects"]` (future use) | submitting → closed       | —                                                |
| 409                          | Inline error dưới slug input; re-enable submit                                                                                | submitting → error-inline | Keep `name`/`description`/`slug` drafts          |
| 400                          | Map `error.details` → per-field inline error                                                                                  | submitting → error-inline | —                                                |
| 403                          | sonner destructive "Bạn không có quyền tạo project"                                                                           | submitting → closed       | Reload user (maybe stale cache)                  |
| 5xx / network                | sonner destructive "Có lỗi xảy ra, thử lại"                                                                                   | submitting → error-toast  | Re-enable submit                                 |
| ESC / overlay click / "Hủy"  | Confirm if form dirty (>1 char typed): `confirm("Hủy project đang tạo?")` → close                                             | → closed                  | Reset form state                                 |

## A11y

- **Radix Dialog primitives** provide:
  - `role="dialog"`, `aria-modal="true"`, focus trap, ESC to close, overlay click dismiss (configurable).
  - `DialogTitle` auto-linked qua `aria-labelledby`; `DialogDescription` qua `aria-describedby`.
- **Form**:
  - Mỗi input có `<Label htmlFor>`; slug input có hint text "URL-friendly, auto-điền từ tên".
  - Inline errors: `<p role="alert" id="slug-error">...`; input `aria-describedby="slug-error"` + `aria-invalid="true"` khi có error.
  - Submit button disabled khi submitting; `aria-busy="true"`.
- **Focus**:
  - Open: first input (`name`) nhận focus.
  - Close: return focus về trigger button (Radix default).
- **Keyboard**:
  - Enter trong input → submit form.
  - Tab order: `name` → `slug` → `description` → "Hủy" → "Tạo".
  - ESC → close (với confirm nếu dirty).
- **Contrast**: token-based, không raw color.

## Wire-level description

### Desktop (≥ 640px)

```text
┌─────────── overlay (backdrop blur, bg-black/40) ───────────┐
│                                                             │
│       ┌─────────────────────────────────────────┐          │
│       │ Tạo project                         [×] │          │
│       │ Khởi tạo catalog cho dự án mới.         │          │
│       ├─────────────────────────────────────────┤          │
│       │                                         │          │
│       │ Tên project *                           │          │
│       │ [Pilot Project_________________________]│          │
│       │                                         │          │
│       │ Slug *                                  │          │
│       │ [pilot-project________________________] │          │
│       │ URL-friendly, auto-điền từ tên.         │          │
│       │                                         │          │
│       │ Mô tả (tùy chọn)                        │          │
│       │ ┌─────────────────────────────────────┐ │          │
│       │ │ MVP v1 for onboarding...            │ │          │
│       │ │                                     │ │          │
│       │ └─────────────────────────────────────┘ │          │
│       │                                         │          │
│       ├─────────────────────────────────────────┤          │
│       │              [Hủy]  [ + Tạo project ]   │          │
│       └─────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 640px)

```text
┌──────────────────────┐
│ Tạo project     [×]  │
│ Khởi tạo catalog...  │
├──────────────────────┤
│ Tên *                │
│ [___________________]│
│                      │
│ Slug *               │
│ [___________________]│
│ URL-friendly...      │
│                      │
│ Mô tả                │
│ [___________________]│
│ [___________________]│
├──────────────────────┤
│ [Hủy] [+ Tạo project]│
└──────────────────────┘
```

- **Layout**:
  - Dialog content: `max-w-md` (desktop) / full-width `rounded-none` (mobile `< 640px`).
  - Padding: header `p-6 pb-4`, body `px-6 pb-6`, footer `px-6 py-4 border-t border-border`.
  - Form stack: `space-y-4`.
- **Key components** (design-system §5):
  - `Dialog` + `DialogTrigger` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` + `DialogFooter` (new T10.5 scaffold).
  - `Input` — name, slug.
  - `Textarea` (new) — description (rows=3, resize-none).
  - `Label` — form labels.
  - `Button` — `default` variant cho "Tạo project", `outline` cho "Hủy".
  - `Toaster` (mount at app root) cho success/error toast.
- **Key icons** (design-system §4):
  - `Plus` — leading icon trong submit button (`size-4`).
  - `X` — close button góc phải dialog header (`size-4`), Radix DialogClose.
- **Key tokens**:
  - `bg-background` dialog content.
  - `border-border` footer divider.
  - `text-foreground` labels + inputs.
  - `text-muted-foreground` description text + hint.
  - `text-destructive` inline errors.
  - `ring-ring` focus inputs + buttons.
- **Typography**:
  - Dialog title: `text-lg font-semibold`.
  - Dialog description (sub): `text-sm text-muted-foreground`.
  - Label: `text-sm font-medium`.
  - Hint (slug): `text-xs text-muted-foreground mt-1`.
  - Error: `text-xs text-destructive mt-1`.
- **Spacing**:
  - Field stack: `space-y-4`.
  - Label → input: `mt-1.5`.
  - Input → hint/error: `mt-1`.

## Error / empty / loading states

- **Loading (submitting)**: submit button disabled, spinner `animate-spin` trong button thay `Plus` icon. Dialog overlay giữ nguyên, không block input (giả sử 1 retry).
- **Inline 409 slug**: `<p role="alert" class="text-xs text-destructive mt-1">Slug đã được dùng, chọn slug khác</p>` dưới slug input; input border `border-destructive`.
- **Inline 400 field errors**: per-field error text dưới input; `aria-invalid="true"` + `aria-describedby="<field>-error"`.
- **Toast 403 / 5xx**: sonner destructive, action "Thử lại" (5xx only — không 403).
- **Empty / cancel**: đóng dialog, form state reset. Nếu dirty → confirm dialog trước.

## Validation (Zod shared schema — `packages/shared/src/schemas/project.ts`)

```ts
createProjectRequestSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug phải có ít nhất 2 ký tự")
    .max(60, "Slug quá dài (>60)")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Slug chỉ chứa a-z, 0-9, dấu gạch ngang"),
  name: z.string().min(1, "Tên không được rỗng").max(120),
  description: z.string().max(1000).optional(),
});
```

Client-side: react-hook-form + zodResolver. Server-side: same schema via `zodValidate({ body })` middleware (T7 pattern).

## Maps US

- [US-002](../stories/US-002.md) — AC-1 (admin gate), AC-2 (happy path), AC-3 (slug conflict).

## Implementation

- **Task**: US-002 tasks TBD (viết ở `.specs/stories/US-002/tasks.md`).
- **Page component**: N/A (dialog is overlay).
- **Component**: `apps/web/src/components/features/CreateProjectDialog.tsx`.
- **Mutation**: `apps/web/src/queries/projects.ts` — `useCreateProject()` TanStack mutation → `POST /projects`.
- **Shared schema**: `packages/shared/src/schemas/project.ts` — `createProjectRequestSchema`, `ProjectCreateResponse`.
- **AdminGate**: `apps/web/src/components/layout/AdminGate.tsx` — wrap trigger button, read `useMe()` role.
- **Slug helper**: `apps/web/src/lib/slug.ts` — `toKebabCase(str)` strip diacritics + lowercase + non-alphanum → "-".

## Gate 1 decisions (approved 2026-04-23)

- [x] Title copy = **"Tạo project"** (ngắn, match domain term).
- [x] Slug auto-derive = `toKebabCase` với **strip Vietnamese diacritics** (VD "Dự án A" → "du-an-a") → ASCII URL-safe.
- [x] User edit slug thủ công → **sticky**, không auto-update tiếp khi name đổi.
- [x] Cancel khi dirty → **native `window.confirm`** (MVP, không phát minh wheel).
- [x] Slug regex max length = **60** chars (URL-friendly, DB index).
- [x] Post-201 flow = **close dialog → navigate** `/projects/:slug` (animation smoother).
