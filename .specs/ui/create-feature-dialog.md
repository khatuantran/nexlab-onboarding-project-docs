# UI Spec — Create Feature Dialog

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `create-feature-dialog`
- **Status**: Draft
- **Last updated**: 2026-04-23
- **Kind**: overlay dialog (Radix portal) — không có URL riêng.

## Route

- **Trigger**: button "Thêm feature" trên project landing page `/projects/:slug` (admin/author only, ẩn nếu chỉ viewer).
- **Host route**: chỉ mở từ project landing (cần `projectSlug` context).
- **Auth**: 🔐 admin/author (UI gate + server-side 403 fallback).
- **API call**: `POST /api/v1/projects/:projectSlug/features` với body `{ slug, title }`. Response 201: `{ data: { id, slug, title, createdAt, updatedAt } }`. Server tạo 5 section rows atomic trong 1 transaction.

## State machine

```text
closed → open (click "Thêm feature")
open:
  idle → typing (input change, realtime slug derive from title)
  typing → submitting (click "Tạo" | Enter)
  submitting:
    ├── 201 → toast "Đã tạo feature" → close → navigate("/projects/:projectSlug/features/:featureSlug")
    ├── 409 FEATURE_SLUG_TAKEN → inline error cạnh slug; stay open; keep draft
    ├── 400 VALIDATION_ERROR → per-field inline error
    ├── 403 FORBIDDEN → sonner destructive + close
    └── other → sonner destructive + stay open
  open → closed (click X | ESC | overlay | "Hủy" | 201 navigate)
```

- **States**: `closed`, `idle`, `typing`, `submitting`, `error-inline` (409/400), `error-toast` (403/5xx).

## Interactions

| Trigger                      | Action                                                                                                                               | Next state                | Side effect                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------- |
| Click "Thêm feature"         | Open dialog, focus first input (`title`)                                                                                             | closed → idle             | Radix `aria-modal=true`; body scroll lock |
| Type `title`                 | Update form.title; auto-derive `slug = toKebabCase(stripDiacritics(title))` nếu `slugTouched=false`                                  | idle → typing             | —                                         |
| Type `slug` thủ công         | Set `slugTouched=true`; realtime regex validate `^[a-z0-9]+(?:-[a-z0-9]+)*$`                                                         | typing                    | —                                         |
| Submit (Enter / click "Tạo") | `POST /projects/:projectSlug/features` với trimmed body                                                                              | typing → submitting       | Disable submit; spinner in button         |
| 201                          | Sonner "Đã tạo feature" 2s; close; `navigate("/projects/:projectSlug/features/:featureSlug")`; invalidate `["project", projectSlug]` | submitting → closed       | —                                         |
| 409                          | Inline error dưới slug; re-enable submit; keep draft                                                                                 | submitting → error-inline | —                                         |
| 400                          | Map `error.details` → per-field inline error                                                                                         | submitting → error-inline | —                                         |
| 403                          | Sonner destructive "Bạn không có quyền tạo feature"; close                                                                           | submitting → closed       | Reload user cache                         |
| 5xx / network                | Sonner destructive "Có lỗi xảy ra, thử lại"; keep draft                                                                              | submitting → error-toast  | Re-enable submit                          |
| ESC / overlay / "Hủy"        | Confirm `window.confirm("Hủy feature đang tạo?")` nếu dirty (>1 char)                                                                | → closed                  | Reset form                                |

## A11y

- **Radix Dialog primitives**: `role="dialog"`, `aria-modal="true"`, focus trap, ESC-to-close, overlay-click dismiss, `DialogTitle`/`DialogDescription` auto-linked.
- **Form**:
  - `<Label htmlFor>` cho mỗi input; slug có hint "URL-friendly, auto-điền từ tiêu đề".
  - Inline error `<p role="alert" id="<field>-error">`; input `aria-describedby` + `aria-invalid="true"` khi có error.
  - Submit disabled khi submitting + `aria-busy="true"`.
- **Focus**:
  - Open: input `title` nhận focus.
  - Close: return focus về trigger "Thêm feature".
- **Keyboard**:
  - Enter trong input → submit.
  - Tab order: `title` → `slug` → "Hủy" → "Tạo".
  - ESC → close (confirm nếu dirty).
- **Contrast**: token-based, không raw color.

## Wire-level description

### Desktop (≥ 640px)

```text
┌─────────── overlay (bg-black/40, backdrop blur) ───────────┐
│                                                             │
│       ┌─────────────────────────────────────────┐          │
│       │ Thêm feature                        [×] │          │
│       │ Tạo feature mới trong project           │          │
│       │ "Pilot Project".                        │          │
│       ├─────────────────────────────────────────┤          │
│       │                                         │          │
│       │ Tiêu đề *                               │          │
│       │ [Đăng nhập bằng email_________________] │          │
│       │                                         │          │
│       │ Slug *                                  │          │
│       │ [dang-nhap-bang-email_________________] │          │
│       │ URL-friendly, auto-điền từ tiêu đề.     │          │
│       │                                         │          │
│       ├─────────────────────────────────────────┤          │
│       │                 [Hủy]  [ + Tạo feature ]│          │
│       └─────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 640px)

```text
┌──────────────────────┐
│ Thêm feature    [×]  │
│ Tạo feature trong... │
├──────────────────────┤
│ Tiêu đề *            │
│ [___________________]│
│                      │
│ Slug *               │
│ [___________________]│
│ URL-friendly...      │
├──────────────────────┤
│ [Hủy] [+ Tạo feature]│
└──────────────────────┘
```

- **Layout**:
  - Dialog content: `max-w-md` (desktop) / full-width `rounded-none` (mobile `< 640px`).
  - Padding: header `p-6 pb-4`, body `px-6 pb-6`, footer `px-6 py-4 border-t border-border`.
  - Form stack: `space-y-4`.
- **Key components** (design-system §5):
  - New: `CreateFeatureDialog` (wrapper với shadcn `Dialog` primitive + react-hook-form + zodResolver).
  - Reused: `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` / `DialogClose` (primitive rows trong design-system).
  - Reused: `Input`, `Label`, `Button` (variants `default` + `ghost`).
  - Reused: `Toaster` (`sonner`).
  - Reused: icon `Plus` (button label icon).

## Error / empty / loading states

- **Loading (submitting)**: submit button disabled + inline spinner (16px) thay icon `Plus`; `aria-busy="true"`.
- **Empty**: N/A (form chỉ có required field, không depend fetch).
- **Error inline (409/400)**:
  - `<p role="alert" class="text-xs text-destructive mt-1">Slug đã được dùng, chọn slug khác</p>` dưới slug input.
  - Input border `border-destructive` khi `aria-invalid="true"`.
- **Error toast (403/5xx)**: sonner destructive 5s với action "Đóng"; stay open (5xx) hoặc close (403).
- **Unauthenticated (401)**: `api.ts` interceptor redirect `/login?next=<current>` (global handler).

## Validation

Zod schema (reuse trong shared):

```ts
export const createFeatureRequestSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug tối thiểu 2 ký tự")
    .max(80, "Slug tối đa 80 ký tự")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Slug chỉ gồm chữ thường, số, dấu gạch ngang"),
  title: z.string().min(1, "Tiêu đề bắt buộc").max(160, "Tiêu đề tối đa 160 ký tự"),
});
```

- Client: `react-hook-form` + `zodResolver` cho per-field validation realtime.
- Server: `zodValidate` middleware ở `POST /projects/:projectSlug/features`.

## Gate 1 decisions (approved 2026-04-23)

Inherit cùng pattern với [create-project-dialog.md](create-project-dialog.md):

- [x] Title copy = **"Thêm feature"** (match button label).
- [x] Slug auto-derive = `toKebabCase` + **strip Vietnamese diacritics** (reuse `lib/slug.ts`).
- [x] User edit slug thủ công → **sticky** sau khi touched.
- [x] Cancel khi dirty → **native `window.confirm`**.
- [x] Slug max length = **80** chars (feature slug hơi dài hơn project slug, match `features.slug` DB column).
- [x] Post-201 flow = **close → navigate** `/projects/:projectSlug/features/:featureSlug`.

## Maps US

- [US-002](../stories/US-002.md) — AC-4 (tạo feature happy path), AC-8 (unauthenticated redirect).

## Implementation

- **Task**: US-002 tasks TBD (sẽ viết ở `.specs/stories/US-002/tasks.md`).
- **Dialog component**: `apps/web/src/components/features/CreateFeatureDialog.tsx`.
- **Trigger button**: extend `apps/web/src/pages/ProjectLandingPage.tsx` header section với `<CreateFeatureDialog projectSlug={slug} />` trigger (wrapped bởi `AuthorGate`).
- **Mutation hook**: `apps/web/src/queries/features.ts` — `useCreateFeature(projectSlug)` qua TanStack Query `useMutation`.
- **Shared schema**: `packages/shared/src/schemas/feature.ts` — `createFeatureRequestSchema`.
- **Slug util**: reuse `apps/web/src/lib/slug.ts` (`toKebabCase` + diacritic strip — share với create-project-dialog).
- **Author gate**: new `apps/web/src/components/common/AuthorGate.tsx` — render children nếu `user.role === "admin" | "author"`, else null.
