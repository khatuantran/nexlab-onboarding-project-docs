# UI Spec — Edit Project Dialog

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `edit-project-dialog`
- **Status**: Ready
- **Last updated**: 2026-04-24
- **Kind**: overlay dialog (Radix portal) — không có URL riêng.

## Route

- **Trigger**: button "Sửa project" trên `ProjectLandingPage` (`/projects/:slug`), admin only (ẩn qua `AdminGate`).
- **Host route**: chỉ mở từ project landing (cần current project data pre-fill).
- **Auth**: 👑 admin only (UI gate + server-side 403 fallback).
- **API call**: `PATCH /api/v1/projects/:slug` với body `{ name, description? }`. Response 200: `{ data: ProjectResponse }`. Slug trong body sẽ bị server ignore (FR-PROJ-002 slug immutable).

## State machine

```text
closed → open (click "Sửa project")
open:
  idle-prefilled (form load từ current project) → typing (input change)
  typing → submitting (click "Lưu" | Enter)
  submitting:
    ├── 200 → sonner "Đã cập nhật project" → close dialog → landing refresh
    ├── 400 VALIDATION_ERROR → per-field inline error; stay open; keep draft
    ├── 403 FORBIDDEN → sonner destructive "Bạn không có quyền sửa" + close (UI gate rò rỉ = bug)
    ├── 404 PROJECT_NOT_FOUND → sonner destructive + redirect `/` (project có thể đã archive bên session khác)
    └── 5xx / network → sonner destructive "Có lỗi xảy ra, thử lại" + stay open
  open → closed (click X | ESC | overlay | "Hủy" | 200 success)
```

- **States**: `closed`, `idle-prefilled`, `typing`, `submitting`, `error-inline` (400), `error-toast` (403/404/5xx).

## Interactions

| Trigger                | Action                                                                              | Next state                | Side effect                               |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------- |
| Click "Sửa project"    | Open dialog, pre-fill form từ project data (name + description từ useProject cache) | closed → idle-prefilled   | Radix `aria-modal=true`; body scroll lock |
| Edit `name`            | Update form.name                                                                    | idle-prefilled → typing   | —                                         |
| Edit `description`     | Update form.description                                                             | typing                    | —                                         |
| Submit (Enter / "Lưu") | `PATCH /projects/:slug` với `{ name, description }`                                 | typing → submitting       | Disable button + spinner                  |
| 200                    | Sonner "Đã cập nhật project" 2s; close; invalidate `["project", slug]` query        | submitting → closed       | Landing header refresh tên mới            |
| 400                    | Map `error.details.issues` → per-field inline error                                 | submitting → error-inline | Re-enable submit                          |
| 403                    | Sonner destructive; close                                                           | submitting → closed       | Reload user cache (role có thể stale)     |
| 404                    | Sonner destructive; navigate `/`                                                    | submitting → closed       | Project có thể archived bên session khác  |
| 5xx / network          | Sonner destructive; keep draft                                                      | submitting → error-toast  | Re-enable submit                          |
| ESC / overlay / "Hủy"  | Confirm `window.confirm("Hủy chỉnh sửa project?")` nếu dirty (draft ≠ pre-fill)     | → closed                  | Reset form state                          |

## A11y

- **Radix Dialog primitives**: `role="dialog"`, `aria-modal="true"`, focus trap, ESC-to-close, overlay-click dismiss, `DialogTitle` / `DialogDescription` auto-linked.
- **Form**:
  - `<Label htmlFor>` cho mọi input; slug input `readOnly` + `aria-readonly="true"` + hint text bên dưới.
  - Inline error `<p role="alert" id="<field>-error">`; input `aria-describedby` + `aria-invalid="true"` khi có error.
  - Submit button disabled khi submitting + `aria-busy="true"`.
- **Focus**:
  - Open: input `name` (first editable) nhận focus (không phải slug readonly).
  - Close: return focus về trigger "Sửa project".
- **Keyboard**:
  - Enter trong input → submit (trừ khi focus slug readonly — no-op).
  - Tab order: `name` → `slug (readonly, skipped nếu tabIndex=-1)` → `description` → "Hủy" → "Lưu".
  - ESC → close (confirm nếu dirty).
- **Contrast**: token-based. Slug readonly dùng `bg-muted` + `text-muted-foreground` để phân biệt disabled state.

## Wire-level description

### Desktop (≥ 640px)

```text
┌─────────── overlay (bg-black/40, backdrop blur) ───────────┐
│                                                             │
│       ┌─────────────────────────────────────────┐          │
│       │ Sửa project                         [×] │          │
│       │ Cập nhật thông tin project.             │          │
│       ├─────────────────────────────────────────┤          │
│       │                                         │          │
│       │ Tên project *                           │          │
│       │ [Pilot Project_______________________]  │          │
│       │                                         │          │
│       │ Slug                                    │          │
│       │ [pilot-project_______________________]  │ ← readonly│
│       │ Slug không đổi được sau khi tạo.        │          │
│       │                                         │          │
│       │ Mô tả (tùy chọn)                        │          │
│       │ ┌─────────────────────────────────────┐ │          │
│       │ │ MVP v1 for onboarding pilot team A. │ │          │
│       │ │                                     │ │          │
│       │ └─────────────────────────────────────┘ │          │
│       │                                         │          │
│       ├─────────────────────────────────────────┤          │
│       │                    [Hủy]   [💾 Lưu]     │          │
│       └─────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 640px)

```text
┌──────────────────────┐
│ Sửa project     [×]  │
│ Cập nhật thông tin.. │
├──────────────────────┤
│ Tên *                │
│ [___________________]│
│                      │
│ Slug                 │
│ [___________________]│ ← readonly
│ Không đổi được.      │
│                      │
│ Mô tả                │
│ [___________________]│
│ [___________________]│
├──────────────────────┤
│ [Hủy]      [💾 Lưu]  │
└──────────────────────┘
```

- **Layout**:
  - Dialog content: `max-w-md` (desktop) / full-width `rounded-none` (mobile `< 640px`) — parity với CreateProjectDialog.
  - Padding: header `p-6 pb-4`, body `px-6 pb-6`, footer `px-6 py-4 border-t border-border`.
  - Form stack: `space-y-4`.
- **Key components** (design-system §5):
  - New: `EditProjectDialog` wrapper (React + react-hook-form + zodResolver).
  - Reused: `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` / `DialogClose` primitives.
  - Reused: `Input` (slug variant = readonly), `Label`, `Textarea`, `Button` variants `default` + `ghost`.
  - Reused: `Toaster` (sonner).
  - Reused icon: `Check` (save button, đã có từ US-002 T7 SectionEditor).
- **Key tokens**:
  - Slug readonly input: `bg-muted text-muted-foreground cursor-not-allowed`.
  - Hint text dưới slug: `text-xs text-muted-foreground`.

## Error / empty / loading states

- **Loading (submitting)**: submit button disabled + spinner 16px thay icon `Check`; `aria-busy="true"`.
- **Pre-fill source**: từ `useProject(slug)` cache — đã fetch khi user ở ProjectLandingPage. Không cần refetch trong dialog. Nếu cache stale (rare) → response PATCH sẽ override.
- **Empty**: N/A — name luôn có pre-fill (required field không thể empty sau create).
- **Error inline (400)**:
  - Per-field `<p role="alert" class="text-xs text-destructive mt-1">...</p>`.
  - Input border `border-destructive` khi `aria-invalid="true"`.
- **Error toast (403/404/5xx)**: sonner destructive 5s.
- **Unauthenticated (401)**: `api.ts` interceptor redirect `/login?next=<current>`.

## Validation

Zod schema reuse từ shared (extend pattern):

```ts
// packages/shared/src/schemas/project.ts
export const updateProjectRequestSchema = z.object({
  name: z.string().min(1, "Tên project bắt buộc").max(120, "Tên tối đa 120 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
});
// Slug intentionally omitted — immutable per FR-PROJ-002.
```

- Client: `react-hook-form` + `zodResolver` cho per-field validation realtime.
- Server: `zodValidate` middleware ở `PATCH /projects/:slug`. Body có field `slug` → strip silent (Zod không có field thì ignore, OK).

## Gate 1 decisions (approved 2026-04-24 via AskUserQuestion)

- [x] **Slug display**: Readonly visible với hint "Slug không đổi được sau khi tạo". User thấy context slug đang edit đúng project, nhưng disabled.
- [x] **Submit button text**: **"Lưu"** — consistent với SectionEditor (US-002 T7). Ngắn, action-focused.
- [x] **Cancel khi dirty**: **Native `window.confirm`** match CreateProjectDialog + SectionEditor patterns. Prevent lose draft accidentally.

## Maps US

- [US-004](../stories/US-004.md) — AC-5 (admin edit metadata happy path), AC-6 (slug không edit được), AC-8 (non-admin không thấy trigger).

## Implementation

- **Task**: US-004 tasks TBD.
- **Dialog component**: `apps/web/src/components/projects/EditProjectDialog.tsx`.
- **Trigger button**: extend `apps/web/src/pages/ProjectLandingPage.tsx` header với `<AdminGate><EditProjectDialog project={project} /></AdminGate>`. (Chi tiết position + admin action bar → [project-landing.md](project-landing.md) spec 3/3.)
- **Mutation hook**: `apps/web/src/queries/projects.ts` — `useUpdateProject(slug)` TanStack Query `useMutation`; onSuccess invalidate `projectKeys.byId(slug)` + `["projects"]` (catalog).
- **Shared schema**: `packages/shared/src/schemas/project.ts` — add `updateProjectRequestSchema`.
- **Pre-fill**: đọc từ TanStack cache `projectKeys.byId(slug)` (đã được `useProject()` populate ở ProjectLandingPage mount).
- **Form reset**: khi dialog open, reset form với current project data; slugTouched/sticky logic không cần (slug read-only).
