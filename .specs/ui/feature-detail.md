# UI Spec — Feature Detail

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `feature-detail`
- **Status**: Implemented (read path, T9 `879b15b`) + Ready (edit-in-place, US-002)
- **Last updated**: 2026-04-23

## Route

- **Path**: `/projects/:slug/features/:featureSlug`
- **Auth**: 🔐 session required
- **Redirect on unauth**: `/login?next=<current>`
- **API call**: `GET /api/v1/projects/:slug/features/:featureSlug` (T7, return `{ feature, sections: SectionResponse[5] }` — always 5 sections trong `SECTION_ORDER`).

## State machine

```
idle → loading
        ├── success → render breadcrumb + toc + 5 sections (stacked or via toc scroll)
        └── error
             ├── 404 FEATURE_NOT_FOUND → "Không tìm thấy feature" + link về project landing
             └── other → generic error banner
```

- **States**:
  - `loading` — skeleton: breadcrumb strip + 5 section header placeholder.
  - `success` — full page với TOC + rendered markdown.
  - `error-404` — inline panel.
  - `error-other` — banner.

Each **section content state** (trong success):

- `empty` (body === "") — placeholder "Chưa có nội dung" + muted icon.
- `filled` — MarkdownView render sanitized HTML.

## Interactions

| Trigger                        | Action                                              | Next state              | Side effect                                         |
| ------------------------------ | --------------------------------------------------- | ----------------------- | --------------------------------------------------- |
| Page mount                     | `useFeature(slug, featureSlug)` fetch               | loading → success/error | TanStack Query key `["feature", slug, featureSlug]` |
| Click TOC link (desktop)       | Scroll to section anchor (smooth)                   | —                       | Update `window.location.hash` + active state        |
| Select TOC dropdown (mobile)   | Scroll to section                                   | —                       | Dropdown collapse                                   |
| Click breadcrumb "Demo"        | Navigate `/projects/<slug>`                         | unmount                 | SPA push                                            |
| Scroll (desktop)               | Active TOC item highlight theo IntersectionObserver | —                       | Highlight token `text-foreground` vs muted          |
| Click markdown link (internal) | SPA push nếu `/projects/...`                        | —                       | External → new tab rel="noopener"                   |
| Click markdown link (external) | Open `target="_blank" rel="noopener"`               | —                       | —                                                   |

## A11y

- **Keyboard**: TOC links tab-focusable. Markdown content tab qua links/headings.
- **Labels**: Breadcrumb `<nav aria-label="Breadcrumb">`; sections wrapped trong `<section aria-labelledby="section-<type>">` với `<h2 id="section-<type>">`.
- **Anchors**: mỗi section có `id="section-business"` etc, match `SECTION_ORDER`.
- **Live regions**: loading `aria-busy="true"`; error `role="alert"`.
- **Landmarks**: `<main>` wrap toàn content; `<aside>` cho TOC sticky desktop; `<nav>` breadcrumb.
- **Markdown**: DOMPurify đã strip unsafe. Links external kèm rel="noopener noreferrer".
- **Contrast**: theo token. Code block `bg-muted` vs `text-foreground` ≥ 4.5:1.
- **Motion**: smooth scroll respect `prefers-reduced-motion: reduce` → fallback instant jump.

## Wire-level description

### Desktop (≥ 1024px)

```
┌───────────────────────────────────────────────────────────┐
│ AppHeader                                                  │
├───────────────────────────────────────────────────────────┤
│  max-w-5xl, px-6, py-8                                     │
│                                                            │
│  Demo / Login with email                     breadcrumb sm │
│                                                            │
│  # Đăng nhập bằng email                       h1 2xl       │
│  Cập nhật 2 giờ trước · bởi @admin            muted xs     │
│                                                            │
│  ┌──────────────┬────────────────────────────────────┐     │
│  │ Sections     │ ## Business                        │     │
│  │ (sticky)     │ Markdown content...                │     │
│  │              │                                    │     │
│  │ ▸ Business   │ ## User flow                       │     │
│  │   User flow  │ ...                                │     │
│  │   Rules      │                                    │     │
│  │   Tech       │ ## Business rules                  │     │
│  │   Screens    │ [Chưa có nội dung]  (empty)        │     │
│  │              │                                    │     │
│  │ (top: 96px)  │ ## Tech notes                      │     │
│  │              │ ...                                │     │
│  │              │                                    │     │
│  │              │ ## Screenshots                     │     │
│  │              │ ...                                │     │
│  └──────────────┴────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────┘
```

### Mobile (< 1024px)

```
┌──────────────────────┐
│ AppHeader            │
├──────────────────────┤
│ Demo / Login with…   │
│ # Đăng nhập bằng…    │
│ cập nhật 2 giờ…      │
│                      │
│ [Sections ▾]         │  ← Collapsible TOC dropdown
│                      │
│ ## Business          │
│ content...           │
│                      │
│ ## User flow         │
│ ...                  │
│                      │
│ (stacked all 5)      │
└──────────────────────┘
```

- **Layout**:
  - Desktop: grid `grid-cols-[180px_1fr] gap-8` dưới heading block. TOC `aside` `sticky top-24 self-start` (96px = AppHeader + margin).
  - Mobile: `<details>` dropdown dưới heading, content stack bình thường.
- **Key components** (design-system §5):
  - `Breadcrumb` — `<nav>` với separator `ChevronRight size-3.5 text-muted-foreground`.
  - `SectionToc` — desktop sticky aside with 5 anchor link, active state via IntersectionObserver; mobile `<details>` dropdown.
  - `MarkdownView` — wraps sanitized markdown, class `prose prose-sm max-w-none`.
  - `RelativeTime` — meta line "cập nhật 2 giờ trước".
  - `EmptyState` (inline variant) cho section body empty.
- **Key icons** (design-system §4):
  - `ChevronRight` — breadcrumb separator.
  - `Clock` — relative time.
  - `AlertCircle` — empty section placeholder.
- **Key tokens**:
  - `bg-background` main.
  - `text-foreground` heading + body.
  - `text-muted-foreground` breadcrumb items, sub-copy, TOC inactive items, inline code muted.
  - `bg-muted` code block bg + empty-section placeholder bg.
  - `border-border` TOC right divider desktop.
- **Typography**:
  - Breadcrumb: `text-sm`.
  - H1 feature title: `text-2xl font-semibold`.
  - H2 section: `text-xl font-semibold mt-10 mb-4 scroll-mt-24` (scroll-mt offset sticky header).
  - Body prose: `text-base leading-relaxed` (`prose` class).
  - Code inline: `text-sm font-mono`.
  - Code block: `text-sm font-mono bg-muted p-3 rounded-md`.
- **Spacing**:
  - Heading block → grid: `mt-8`.
  - Section to section: H2 `mt-10` (tự separator visual, không cần HR).
  - Empty placeholder padding: `py-6`.

## Error / empty / loading states

- **Loading**: breadcrumb skeleton + h1 skeleton + 5 section header placeholders. TOC skeleton bên trái (desktop). `aria-busy="true"`.
- **Empty section** (body === ""): thay MarkdownView bằng:
  ```
  ┌─────────────────────────────────┐
  │  ⚠ Chưa có nội dung              │
  │  BA hoặc dev chưa điền section   │
  │  này.                            │
  └─────────────────────────────────┘
  ```
  Class: `rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground flex items-center gap-3`. Icon `AlertCircle size-5`.
- **Error 404**: panel thay main:
  ```
  Không tìm thấy feature "<featureSlug>"
  Có thể slug sai, hoặc feature đã bị xóa.
  [← Về project Demo]
  ```
- **Error other**: inline `text-destructive` banner trên cùng.
- **Unauthenticated**: RequireAuth → `/login?next=/projects/:slug/features/:featureSlug`.

## Security: markdown XSS

**AC: inject `<script>` trong body → không execute.**

- markdown-it config: `html: false` (raw HTML không parse, đã thoát literal).
- DOMPurify sau markdown-it output, whitelist theo design-system §6.1.
- Test case (T9 red test): set section body = `<script>alert(1)</script>hello` → rendered HTML không chứa `<script>`, chỉ chứa text hoặc literal-escaped `&lt;script&gt;`.

## Implementation

- **Task**: [T9](../stories/US-001/tasks.md#t9--landing--feature-detail-pages)
- **Page component**: `apps/web/src/pages/FeatureDetailPage.tsx`
- **Queries**: `apps/web/src/queries/projects.ts` — `useFeature(slug, featureSlug)`
- **Sub-components** (mới land T9):
  - `apps/web/src/components/features/FeatureSections.tsx` (dùng `SECTION_ORDER`)
  - `apps/web/src/components/features/SectionToc.tsx`
  - `apps/web/src/components/common/Breadcrumb.tsx`
  - `apps/web/src/components/common/MarkdownView.tsx`
- **Shared helpers**: `apps/web/src/lib/markdown.ts` — markdown-it instance + DOMPurify.sanitize wrapper.
- **Response type**: `FeatureResponse + SectionResponse[]` từ [@onboarding/shared/schemas/feature.ts](../../packages/shared/src/schemas/feature.ts).

## Edit-in-place mode (US-002)

Thêm capability edit section trong cùng route (không tách `/edit`). Admin/author toggle per-section via "Sửa" button; multiple section có thể edit song song (independent state).

### Scope edit-in-place

- **Editable sections**: `business`, `user-flow`, `business-rules` (3 business sections). `tech-notes` + `screenshots` defer US-003.
- **Not editable v1**: title feature, slug, project metadata, section order, delete section.

### Per-section state machine

```text
read (default)
  ↓ click "Sửa" (admin/author)
editing:
  idle-draft (textarea bằng server body) →
  typing (debounced 200ms preview) →
    ├── click "Lưu" → saving
    └── click "Hủy" → (confirm nếu dirty) → read
  saving:
    ├── 200 → toast "Đã lưu" → refresh meta → read
    ├── 413 SECTION_TOO_LARGE → sonner destructive "Nội dung section quá lớn (>64 KiB)" → editing (keep draft)
    ├── 400 VALIDATION_ERROR → inline error dưới textarea → editing
    ├── 401 → redirect `/login?next=<current>`
    ├── 403 → sonner destructive "Bạn không có quyền sửa" → read
    └── 5xx / network → sonner destructive "Có lỗi xảy ra, thử lại" → editing (retry enabled)
```

Mỗi section slot độc lập (3 section cùng lúc ở editing cũng OK).

### Per-section interactions (edit)

| Trigger                                   | Action                                                                                                         | Next state                | Side effect                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- |
| Click "Sửa" icon (pencil, top-right card) | Toggle section slot → editing; load `body` server vào textarea draft                                           | read → editing idle-draft | Textarea auto-focus; body scroll giữ nguyên              |
| Gõ textarea                               | Update draft; debounce 200ms → update preview pane                                                             | typing                    | Preview render qua cùng `MarkdownView` sanitize pipeline |
| Click "Lưu"                               | `PUT /api/v1/features/:featureId/sections/:type` với `{ body }`                                                | editing → saving          | Disable save button + spinner                            |
| 200                                       | Sonner "Đã lưu" 2s; refresh `updated_at` + `updated_by` meta; section collapse về read mode với mới saved body | saving → read             | Invalidate `["feature", slug, featureSlug]` query        |
| 413                                       | Sonner destructive (copy trên); draft giữ nguyên                                                               | saving → editing          | —                                                        |
| Click "Hủy"                               | Confirm `window.confirm("Hủy chỉnh sửa?")` nếu dirty (draft != server body) → revert                           | editing → read            | Textarea reset; preview clear                            |
| ESC trong textarea                        | Không trigger cancel (ESC = native textarea behavior, no-op)                                                   | —                         | —                                                        |

### Per-section wire-level (edit)

**Read mode (existing)**:

```text
┌─ Section card ─────────────────────────────────────┐
│  ## Business                              [✏️ Sửa] │   ← Pencil icon top-right, admin/author only
│  cập nhật 2 giờ trước · bởi @lan                   │
│  <MarkdownView sanitized body>                     │
└────────────────────────────────────────────────────┘
```

**Editing mode (new — 2-col split desktop)**:

```text
┌─ Section card (editing) ────────────────────────────────────────┐
│  ## Business                                                     │
│  ┌──────────────────────────┬──────────────────────────────────┐│
│  │ Markdown source          │ Preview (realtime 200ms debounce)││
│  │ ┌──────────────────────┐ │ ┌──────────────────────────────┐ ││
│  │ │ # Tổng quan          │ │ │ <h1>Tổng quan</h1>           │ ││
│  │ │ Lorem ipsum...       │ │ │ <p>Lorem ipsum...</p>        │ ││
│  │ │ - bullet             │ │ │ <ul><li>bullet</li></ul>     │ ││
│  │ │                      │ │ │                              │ ││
│  │ └──────────────────────┘ │ └──────────────────────────────┘ ││
│  │ 12,340 / 64 KiB          │                                  ││
│  └──────────────────────────┴──────────────────────────────────┘│
│  ─────────────────────────────────────────────────────────────── │
│                                         [Hủy]  [ 💾 Lưu ]       │
└─────────────────────────────────────────────────────────────────┘
```

**Editing mode mobile (stack dọc)**:

```text
┌──────────────────────┐
│ ## Business          │
│ [Source] [Preview]  ◁│   ← Tab switch (default Source)
│ ┌──────────────────┐ │
│ │ # Tổng quan      │ │
│ │ ...              │ │
│ └──────────────────┘ │
│ 12,340 / 64 KiB      │
├──────────────────────┤
│      [Hủy] [💾 Lưu]  │
└──────────────────────┘
```

### Edit mode components

- **SectionCard** (existing, extend): thêm prop `editable?: boolean` → render pencil button top-right. Track `mode: "read" | "editing"` local state.
- **SectionEditor** (new): wraps textarea (trái) + preview pane (phải) với `useDeferredValue` + 200ms debounce. Char count + byte count bottom-left.
- **AuthorGate** (new, shared với create-feature-dialog): render children nếu `user.role === "admin" | "author"`, else null.
- **Icon**: `Pencil` (design-system §4 — đã add ở Gate 0 scaffold).
- **Toast**: `Toaster` (sonner) already mounted ở AppShell sau US-002 T1.

### Edit validation

- **Client**: textarea `maxLength` guard ~70000 chars (soft limit cho UX; real limit byte-level ở server).
- **Server**: Zod `body: z.string().max(65536)` (64 KiB) + middleware check `Buffer.byteLength(body, "utf8") <= 65536` → 413 `SECTION_TOO_LARGE` nếu vượt.
- **Empty save**: cho phép save `body === ""` (clear section back về empty state).

### Edit A11y additions

- Pencil button `aria-label="Sửa section <type>"`.
- Edit mode wrap trong `<section aria-label="Đang chỉnh sửa <type>">`.
- Save button `aria-busy="true"` khi saving; textarea `aria-describedby="<type>-byte-count"` linkto char counter.
- Live region `aria-live="polite"` cho toast + success meta update.
- Keyboard: Tab order trong edit card = textarea → preview (readonly, tabIndex=-1) → "Hủy" → "Lưu". Ctrl+Enter không bind (explicit save only).

### Edit-related Gate 1 decisions (approved 2026-04-23 — inherit US-002 Gate 0)

- [x] Layout 2-col (textarea | preview) desktop, stack + tab switch mobile.
- [x] Preview debounce = **200ms** (match Gate 0).
- [x] Per-section toggle độc lập (không force 1 section edit tại 1 thời điểm).
- [x] Cancel confirm = **native `window.confirm`** (consistent với dialog patterns).
- [x] Save button icon = **`Save` / `Check`** — TBD: dùng `Check` (design-system §4 chưa add `Save`). **Decision: dùng `Check` icon + text "Lưu"** (avoid new icon, minimal scope).
- [x] Section separator edit vs read = border card `border-primary/20` + bg `bg-muted/30` để visually distinguish editing card.
- [x] Byte counter reuse util `Buffer.byteLength` server-side; client ước tính bằng `new Blob([text]).size`.

## Maps US

- [US-001](../stories/US-001.md) — AC-3 (feature + sections), AC-5 (5 section ordered), AC-6 (markdown render), AC-4 (empty section variant).
- [US-002](../stories/US-002.md) — AC-5 (edit business section), AC-6 (save 2 section độc lập), AC-7 (413 section too large), AC-8 (401 redirect).
