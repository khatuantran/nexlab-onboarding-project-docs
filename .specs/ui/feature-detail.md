# UI Spec — Feature Detail

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `feature-detail`
- **Status**: Implemented (read T9 `879b15b`; edit T7 `03c83ba`; US-003 embed+upload+ownership T4-T6 `a262cf3`/`f75f75a`/`dd1c213`; E2E T7 `c6c57fc`; UI uplift v2 Workspace CR-002 / Phase 2-3 `2a0caad`)
- **Last updated**: 2026-04-25

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

## Wire-level description (UI uplift v2 — Workspace style — CR-002)

### Desktop (≥ 1280px)

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                                           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Breadcrumb: Projects › <projectSlug> › <featureTitle>                              │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐      │
│  │ FEATURE HEADER (no panel — flat block)                                   │      │
│  │  [Đang viết] [v2] · Cập nhật 18 giờ · @TríMinh    [👁 PR] [⭐ Theo dõi] │      │
│  │                                                   [✎ Sửa nhanh] [⋯]     │      │
│  │  Đăng nhập bằng email   ← h1 32/40 bold tracking-tight                  │      │
│  │  Tài liệu nghiệp vụ + tech notes...                                     │      │
│  └──────────────────────────────────────────────────────────────────────────┘      │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐      │
│  │ PROGRESS STRIP                                                            │      │
│  │  2/5 ████ ████ ░░░░ ░░░░ ░░░░  Nghiệp vụ · Flow · Rules · Tech · Screens│      │
│  │      labels muted xs evenly distributed              │ live placeholder │      │
│  └──────────────────────────────────────────────────────────────────────────┘      │
│                                                                                     │
│  ┌─────────────┐ ┌──────────────────────────────────────┐ ┌─────────────────┐     │
│  │ SECTIONS    │ │ MAIN CONTENT (sections)              │ │ HOẠT ĐỘNG       │     │
│  │ sticky 240  │ │  ┌──────────────────────────────────┐ │ │ sticky 280      │     │
│  │             │ │  │ 🏷 Nghiệp vụ      @X · 2h    ✎  │ │ │ Hoạt động       │     │
│  │ ▎🏷 Nghiệp ✓│ │  │   icon plate primary-50          │ │ │ Xem tất cả →    │     │
│  │   active    │ │  │  {MarkdownView prose}            │ │ │                 │     │
│  │  📊 Flow ✓  │ │  └──────────────────────────────────┘ │ │ [TM] Trí Minh   │     │
│  │  📋 Rules ○ │ │  ┌──────────────────────────────────┐ │ │ chỉnh tech-notes│     │
│  │  🔧 Tech ○  │ │  │ 📊 User flow              ...    │ │ │ 12 phút trước   │     │
│  │  🖼 Screen ○│ │  │  EmptyDashedCard nếu trống       │ │ │ [NL] Ngọc Linh  │     │
│  │             │ │  └──────────────────────────────────┘ │ │ thêm screenshot │     │
│  │ [+ Thêm     │ │                                       │ │                 │     │
│  │  section]   │ │                                       │ │ ──────────      │     │
│  └─────────────┘ └──────────────────────────────────────┘ │ │ MẸO ONBOARDING  │     │
│                                                            │ │ Đọc Nghiệp vụ.. │     │
│                                                            │ └─────────────────┘     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Tablet (1024-1279px) — 2-col (TOC + main, drop activity rail)

### Mobile (< 1024px) — 1-col, TOC collapsed `<details>` dropdown, activity hidden v1

### Layout primitives

- **Container**: `mx-auto max-w-7xl px-10 py-6`. Mobile: `px-4 py-4`.
- **Breadcrumb** (top, existing): muted text-sm.
- **Feature header** (flat block, charter §3 no panel):
  - `mb-5 flex items-start justify-between gap-6`.
  - Left flex-1:
    - Status row `mb-2 flex items-center gap-2`: `<Badge tone={statusTone} dot size="sm">{statusLabel}</Badge>` (derived: filledCount=5 → "Đủ doc" success / 1-4 → "Đang viết" primary / 0 → "Draft" neutral) + `<Badge tone="info" size="sm">v2</Badge>` (placeholder hardcoded) + `<span className="text-xs text-muted-foreground">· Cập nhật {RelativeTime} · @{updatedByName ?? "—"}</span>`.
    - h1: `font-display text-[32px] leading-10 font-bold tracking-[-0.02em]` = `feature.title`.
    - Subtitle: `mt-2 text-sm leading-relaxed text-foreground/80 max-w-3xl` placeholder copy "Tài liệu nghiệp vụ + tech notes. Mọi section đều có thể chỉnh sửa song song bởi BA và Dev."
  - Right action cluster `flex flex-wrap gap-2`:
    - Outline: `[Eye] Xem PR` placeholder toast.
    - Outline: `[Bookmark] Theo dõi` placeholder toast.
    - Default: `[Pencil] Sửa nhanh` — scrolls to first empty section editor (or first section if all filled).
    - Outline icon-only: `[⋯]` admin overflow placeholder (defer real menu to v2).

### Progress strip (NEW — charter §10)

`mb-7 rounded-xl bg-muted/40 border border-border px-4.5 py-3.5 flex items-center gap-6`:

- **Big fraction** `flex items-center gap-2.5`: value `font-display text-[22px] leading-none font-bold text-primary` `{filled}` + meta stack `text-xs leading-tight font-ui text-muted-foreground` "/5\nsection đã có".
- **Bar+labels** flex-1 stack:
  - 5 segments: `flex gap-1.5 mb-1.5`, each `flex-1 h-1.5 rounded-full bg-{filled?primary-500:neutral-200}`.
  - Labels row: `flex justify-between font-ui text-[11px] text-muted-foreground` evenly distributed = `{Nghiệp vụ, User flow, Rules, Tech, Screens}` shorthand.
- **Divider**: `w-px h-8 bg-border`.
- **Live indicator placeholder**: `flex items-center gap-2.5` `<AvatarStack ids={[updatedByName, ...]} size="sm">` + stack với pulse dot success-500 + "Live · cập nhật {RelativeTime}". v1 hardcode count=0, hide entirely if no data.

### 3-column main layout

`grid gap-8 xl:grid-cols-[240px_1fr_280px] lg:grid-cols-[200px_1fr] grid-cols-1`.

### TOC sidebar (left, sticky)

`sticky top-5 self-start rounded-xl border border-border bg-card p-3.5`:

- Eyebrow `font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-2.5` "Sections".
- Items per existing `<SectionToc>` scrollspy, redesigned:
  - `flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-ui text-[13px] font-semibold transition-colors relative`.
  - Active: `text-primary bg-primary-50` + `before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary`.
  - Idle: `text-foreground/70 hover:text-foreground hover:bg-muted/50`.
  - Inside: section icon size-3.5 colored (primary if active, muted if idle) + label flex-1 + status indicator:
    - **filled** = green disc 3.5 round bg-success-500 với white check icon.
    - **empty** = `size-3.5 rounded-full border-1.5 border-dashed border-border-strong`.
- **Footer** `mt-3.5 pt-3.5 border-t border-border`: button "+ Thêm section" full-width `h-8 rounded-lg border border-dashed border-border-strong bg-transparent hover:border-primary/40 hover:text-primary text-muted-foreground font-ui font-semibold text-xs flex items-center justify-center gap-1.5`. v1 placeholder click → toast "5 sections cố định trong v1; custom sections trong v2".

### Section blocks (center)

Stack `flex flex-col gap-4`. Mỗi `<SectionBlock>`:

- Container: `id="section-{type}" scroll-mt-24 rounded-xl border border-border bg-card p-5 transition-all`. Active section (currently visible per scrollspy) → `border-primary-200 shadow-[0_0_0_3px_rgba(240,118,19,0.06)]`.
- **Header row** `mb-3.5 flex items-center gap-2.5`:
  - Icon plate 32×32: `rounded-lg flex items-center justify-center bg-{statusBg}` — `success-50` if filled, `neutral-100` if empty. Icon size-4 colored matching tone (success-500 / muted-foreground).
  - h2 `font-display text-[18px] leading-none font-bold flex-1 line-clamp-1` = section label.
  - Ownership inline (filled only): `font-ui text-xs text-muted-foreground` "Cập nhật bởi <b className='text-foreground/80'>@{updatedByName}</b> · {RelativeTime}". Khi `updatedByName === null` (deleted user) → "(người dùng đã xóa)".
  - Edit button: `<Button variant="outline" size="sm" className="h-8 px-3"><Pencil className="size-3.5 mr-1.5" />Sửa</Button>`. Visibility per existing `<AuthorGate>`.
- **Body**:
  - **Filled**: `<MarkdownView source={body} />` (existing component, prose readable max 65ch per charter §6).
  - **Empty**: `<EmptyDashedCard>` charter §10 — `rounded-lg border border-dashed border-border bg-muted/30 px-5 py-5 flex items-center gap-3.5`:
    - Circle icon 40×40: `rounded-full bg-card border border-border flex items-center justify-center` chứa `<Info className="size-4.5 text-muted-foreground">`.
    - Body flex-1: `font-ui font-semibold text-sm text-foreground` "Chưa có nội dung" + `font-body text-xs leading-snug text-muted-foreground mt-1` "{role} hoặc dev chưa điền section này. Bấm <b>Sửa</b> để bắt đầu — hoặc dùng template gợi ý." (role: business/user-flow/business-rules → "BA"; tech-notes/screenshots → "Dev").
    - Right action: `<Button variant="outline" size="sm" className="h-8">Dùng template</Button>` v1 placeholder toast.
  - **Editing**: existing `<SectionEditor>` flow unchanged (border-primary/30 bg-primary-50/60 from US-002 T7 + Nexlab DS).

### Activity rail (right sidebar, sticky, placeholder v1)

`sticky top-5 self-start rounded-xl border border-border bg-card p-4`:

- **Header** `mb-3.5 flex items-center justify-between`:
  - h3 `font-ui text-[13px] font-bold` "Hoạt động".
  - `<a href="#" className="font-ui text-xs font-semibold text-primary">Xem tất cả</a>` placeholder toast.
- **Activity list** `flex flex-col gap-3.5`, **v1 hardcoded 3-4 dummy items** seed từ feature data (use existing `sections.updatedBy` + `sections.updatedAt` to construct plausible activities):
  - Each item `flex gap-2.5`: `<Avatar size="sm">` ring-2 ring-background size-7 + body flex-1 (`font-body text-xs leading-snug text-foreground/80`):
    - `<b>{name}</b> {action}` (e.g., "Trí Minh chỉnh **tech-notes**", "Ngọc Linh thêm **screenshot**").
    - Sub: `mt-1 font-ui text-[11px] text-muted-foreground` "{relative time}".
- **Tip card** `mt-4.5 rounded-lg bg-info-50 dark:bg-info-950/30 border border-info-200 dark:border-info-800 p-3.5`:
  - Header `flex items-center gap-2 mb-1.5`: `<Info className="size-3.5 text-info-500">` + `font-ui text-xs font-bold text-info-700 dark:text-info-300` "MẸO ONBOARDING".
  - Copy `font-body text-xs leading-snug text-foreground/80` "Đọc <b>Nghiệp vụ</b> trước rồi đến <b>User flow</b> để hiểu bối cảnh, sau đó mới sang <b>Tech notes</b>."

### Section icons map

| Section type   | Icon         | Status tone (filled / empty)   |
| -------------- | ------------ | ------------------------------ |
| business       | `Briefcase`  | success-500 / muted-foreground |
| user-flow      | `Workflow`   | success-500 / muted-foreground |
| business-rules | `ListChecks` | success-500 / muted-foreground |
| tech-notes     | `Code`       | success-500 / muted-foreground |
| screenshots    | `Image`      | success-500 / muted-foreground |

### Out of scope v1 / placeholder

- Activity feed: hardcoded 3-4 dummy items seeded từ section.updatedBy/At.
- Tip card: static copy.
- Live indicator (count đang chỉnh): hardcoded 0 / hidden.
- v2 badge in header: hardcoded.
- Xem PR / Theo dõi buttons: placeholder toasts.
- Sửa nhanh: implements scroll-to-first-empty-section behavior.
- "+ Thêm section" footer button: placeholder toast.
- "Dùng template" empty state action: placeholder toast.
- "⋯" feature-level admin overflow: placeholder (defer real menu).
- Tablet+mobile activity rail: hidden.
- Mobile TOC: collapse `<details>` dropdown summary "Sections ▾".

### Components introduced/reused

- **NEW**: `ProgressStrip` (charter §10, used Feature only v1 — extract if reused), `EmptyDashedCard` (charter §10, also Project Landing), `ActivityRail` (right sidebar with hardcoded dummy data v1), `TipCard` (info-tinted callout).
- **UPDATE**: `SectionToc` — bigger sticky pill list với status indicators (check disc / dashed circle), left primary rail bar trên active. Footer "+ Thêm section" placeholder.
- **UPDATE**: `FeatureSections` — wrap each section in `<SectionBlock>` với icon plate + ownership inline + edit button (move from current heading-row layout).
- **REUSE**: `Breadcrumb`, `MarkdownView` (existing), `SectionEditor` (existing), `Badge`, `Button`, `AvatarStack` (NEW from Home spec), `Avatar`, `RelativeTime`.
- **lucide**: `Briefcase`, `Workflow`, `ListChecks`, `Code`, `Image`, `Eye`, `Bookmark`, `Pencil`, `MoreHorizontal`, `Info`, `Plus`, `CheckCircle`.
- **Typography**:
  - Breadcrumb: `text-sm`.
  - H1 feature title: `font-display text-3xl font-bold tracking-tight` (Inter, Nexlab ADR-003).
  - H2 section: `font-display text-2xl font-bold mt-10 mb-4 scroll-mt-24` (Inter, scroll-mt offset sticky header).
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

- **Editable sections**: **all 5 sections** (US-003 flips `tech-notes` + `screenshots` from defer → editable). Per Gate 1 Q2, upload widget enabled on `tech-notes` + `screenshots` (dev có thể embed arch diagrams trong tech-notes).
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

## Tech context additions (US-003)

US-003 layers 3 capabilities trên existing edit-in-place flow mà không tách route riêng: image upload, embed card render, per-section ownership metadata visible. Reuses SectionEditor + MarkdownView pipelines; adds `UploadButton` toolbar + `EmbedCard` renderer + parser util.

### US-003 scope additions

- **Sections enabled for edit**: `tech-notes` + `screenshots` (previously deferred). Flow identical to 3 business sections (US-002 T7) — thêm upload toolbar only.
- **Upload widget**: toolbar button trong SectionEditor footer cho 2 sections. Max 5 MiB; png / jpg / webp only. Auto-insert markdown `![filename](/uploads/:id)` tại cursor position.
- **Embed card render**: inline trong MarkdownView read view + preview pane. URL matching 3 whitelisted hostnames → render `EmbedCard`; else → plain `<a target="_blank" rel="noopener noreferrer">`.
- **Per-section ownership**: subtitle under section h2 — "Cập nhật bởi \<displayName\>, N trước" dùng `RelativeTime`. Renders for both read + edit modes (meta persist during save).

### Upload widget (§A1 — Gate 1 Q2+Q3)

```text
┌─ Section card (editing, tech-notes hoặc screenshots) ─────────────┐
│  ## Screenshots                                                    │
│  cập nhật bởi @hung, vừa xong                                     │
│  ┌──────────────────────────┬────────────────────────────────────┐│
│  │ Markdown source          │ Preview                            ││
│  │ ┌──────────────────────┐ │ ┌──────────────────────────────┐  ││
│  │ │ # UI                 │ │ │ <h1>UI</h1>                  │  ││
│  │ │ ![login.png](/upl…)  │ │ │ <img src="/uploads/…" …/>    │  ││
│  │ │                      │ │ │                              │  ││
│  │ └──────────────────────┘ │ └──────────────────────────────┘  ││
│  │ 340 / 65536 B            │                                   ││
│  └──────────────────────────┴───────────────────────────────────┘│
│  ──────────────────────────────────────────────────────────────── │
│  [📎 Upload ảnh]                          [Hủy]  [ ✓ Lưu ]       │
└──────────────────────────────────────────────────────────────────┘
```

- **Trigger**: button ghost variant, `Upload` lucide icon + label "Upload ảnh". `aria-label="Upload ảnh vào section"`.
- **Flow**:
  1. Click → OS file picker (`accept="image/png,image/jpeg,image/webp"`).
  2. File chosen → POST `/api/v1/features/:featureId/uploads` multipart.
  3. While uploading: button disabled + spinner thay Upload icon.
  4. 201 → response `{ id, url, sizeBytes, mimeType }` → insert `![filename](/uploads/:id)\n` tại textarea `selectionStart` → cursor advances → preview debounces update.
  5. Toast success: sonner `"Đã upload <filename>"` 2s.
- **Error handling**:
  - 413 `FILE_TOO_LARGE` → sonner destructive `"File quá lớn (max 5 MiB)"` + markdown không đổi (AC-5).
  - 415 `UNSUPPORTED_MEDIA_TYPE` → sonner destructive `"Chỉ chấp nhận png, jpg, webp"` + markdown không đổi (AC-6).
  - 401 → redirect `/login?next=<current>` (AC-9 / reuse interceptor).
  - 5xx / network → sonner destructive `"Có lỗi xảy ra, thử lại"`.
- **Section-type gate**: upload button chỉ render khi `section.type === "tech-notes" || section.type === "screenshots"`. 3 business sections không thấy button.
- **Cursor preservation**: dùng `textareaRef.current.selectionStart` snapshot trước khi click upload; restore sau insert để Tab chain hoạt động bình thường.

### Embed card render (§A2 — Gate 1 Q1+Q5)

Inline detection: bất kỳ `<a href>` được markdown-it emit → check `new URL(href).hostname`. Nếu match whitelist → replace anchor với `EmbedCard`. Else → anchor giữ nguyên (plain link per AC-3).

**Whitelist** (strict 3):

| Hostname          | Icon (design-system §4) | Domain subtitle |
| ----------------- | ----------------------- | --------------- |
| `github.com`      | `Github` (custom SVG)   | "github.com"    |
| `*.atlassian.net` | `Jira` (custom SVG)     | "atlassian.net" |
| `figma.com`       | `Figma` (custom SVG)    | "figma.com"     |

Subdomain handling: `hostname === domain || hostname.endsWith("." + domain)` → match. Chặn spoof `evil.com/github.com` (path ≠ hostname).

**Card layout**:

```text
┌──────────────────────────────────────────────┐
│  [icon 24px]  github.com/acme/repo/pull/42   │
│               github.com                     │
└──────────────────────────────────────────────┘
```

- **Content**:
  - Row 1: `text-sm` truncate URL path (strip protocol, show first ~60 chars with ellipsis).
  - Row 2: `text-xs text-muted-foreground` domain subtitle.
- **Interactions**: `<a target="_blank" rel="noopener noreferrer">` wrapping the card. Hover `border-primary/40`. Focus `ring-2 ring-ring`. Cursor pointer.
- **Rendered in**: both read-mode MarkdownView + edit-mode preview pane (unified pipeline).
- **Security** (§US-003 Risks): `new URL()` throws on invalid URLs — try/catch → fallback plain anchor. Hostname match strict (no substring). DOMPurify still strips `<script>` first.

### Per-section ownership metadata (§A3 — Gate 1 Q6)

Under each section h2, render meta line: `"cập nhật bởi @<displayName>, <relative time>"`. Uses `RelativeTime` component + user.displayName from section.updatedBy foreign key.

**API contract change required for US-003**: `SectionResponse` must include resolved `updatedByName: string | null` (join users.display_name via section.updated_by). Current shape only has `updatedBy: string | null` (id). T6 task extends response shape.

```text
## Tech notes
cập nhật bởi @hùng, 2 phút trước     ← meta line, muted xs
<body markdown>
```

- **Fallback**: `updatedBy === null` (user deleted per `ON DELETE SET NULL`) → show "cập nhật bởi (người dùng đã xóa), N trước".
- **Empty section** (body === ""): skip meta line (no author yet).
- **Typography**: `text-xs text-muted-foreground mt-1 mb-4`.

### US-003 interactions additions

| Trigger                                     | Action                                                       | Next state          | Side effect                      |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------- | -------------------------------- |
| Click "Upload ảnh" (tech-notes/screenshots) | Open OS file picker                                          | editing             | —                                |
| File chosen (valid)                         | POST `/features/:id/uploads` multipart                       | editing → uploading | Button disabled + spinner        |
| 201                                         | Insert `![filename](/uploads/:id)` at cursor; toast success  | uploading → editing | Preview re-renders with `<img>`  |
| 413                                         | Toast destructive "File quá lớn (max 5 MiB)"                 | uploading → editing | Markdown unchanged               |
| 415                                         | Toast destructive "Chỉ chấp nhận png, jpg, webp"             | uploading → editing | Markdown unchanged               |
| Read view render sees whitelisted URL       | Replace `<a>` với `EmbedCard` inline                         | —                   | `<a target="_blank">` wraps card |
| Read view render sees non-whitelist URL     | Plain anchor `<a target="_blank" rel="noopener noreferrer">` | —                   | —                                |

### US-003 A11y additions

- Upload button: `aria-label="Upload ảnh vào section <type>"`, `aria-busy="true"` during upload.
- EmbedCard: outer `<a>` carries `aria-label="Mở <URL> trong tab mới — <domain>"` (screen reader context).
- Ownership meta: decorative `@` prefix marked `aria-hidden="true"`; displayName + time readable by SR.
- Uploaded `<img>` trong read view: `alt` derives from markdown alt text; fallback filename if empty.

### US-003 Gate 1 decisions (approved 2026-04-24 via AskUserQuestion)

1. [x] **Embed whitelist strict 3**: atlassian.net + figma.com + github.com. GitLab / Google Docs defer v2 based on pilot feedback.
2. [x] **Upload enabled on both `tech-notes` + `screenshots`**: dev có thể paste arch diagrams trong tech-notes. Section-type guard in SectionEditor.
3. [x] **Upload UX = toolbar button**: `[📎 Upload ảnh]` cạnh Hủy/Lưu. OS file picker → POST → auto-insert markdown at cursor. Drag-drop / paste-image deferred.
4. [x] **Upload validation = magic bytes via `file-type` lib**: server reads first bytes → detect real MIME. Chặn spoof `evil.exe → evil.png` per story §Risks.
5. [x] **Embed card inline render**: URL match → card replaces `<a>` tại vị trí gốc trong markdown flow. "Related links" block-at-end deferred.
6. [x] **Per-section ownership visible**: subtitle "cập nhật bởi @X, N trước" dưới section h2. API T6 extends SectionResponse với `updatedByName`.
7. [x] **File serve session-protected**: `GET /uploads/:id` requires `sid` cookie (401 if missing). Same-origin `<img>` tag gửi cookie auto.

## Maps US

- [US-001](../stories/US-001.md) — AC-3 (feature + sections), AC-5 (5 section ordered), AC-6 (markdown render), AC-4 (empty section variant).
- [US-002](../stories/US-002.md) — AC-5 (edit business section), AC-6 (save 2 section độc lập), AC-7 (413 section too large), AC-8 (401 redirect).
- [US-003](../stories/US-003.md) — AC-1 (Hùng opens Lan's feature with ownership intact), AC-2 (tech-notes edit + GitHub card render), AC-3 (non-whitelist → plain anchor), AC-4 (upload happy path), AC-5 (413 too large), AC-6 (415 bad MIME), AC-7 (per-section ownership visible), AC-8 (embed card renders in read view), AC-9 (unauth upload blocked).
