# UI Spec — Search

<!-- template: 02-ui-spec-template.md@0.1 -->

> **v4 amend (CR-006 v4 — 2026-05-16)**: Hero block uses `GradientHero` (blue + orange blobs + dot grid + watermark). Eyebrow chip "✦ Tìm kiếm" (blue-200) + h1 white `Kết quả cho "{q}"` with gradient text on the query + result count line in white/70. Filter bar + result body remain in `max-w-5xl px-10 pt-6` light container below. Empty state + scope chip + FilterBar logic unchanged.

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `search`
- **Status**: Implemented (US-005 v2 multi-entity + filters shipped `a9fbf86` 2026-04-25). Previously Implemented v1: T10 `5ca8e49`; UI uplift v2 Workspace CR-002 / Phase 2-4 `4407c53`.
- **Last updated**: 2026-04-25

## Route

- **Path**: `/search?q=<term>&projectSlug=<slug?>`
- **Auth**: 🔐 session required
- **Redirect on unauth**: `/login?next=/search?q=...`
- **API call**: `GET /api/v1/search?q=<term>&projectSlug=<slug?>` (T7 đã ship). Response: `{ hits: SearchHit[] }` với `SearchHit = { projectSlug, featureSlug, title, snippet, rank }`.

## Route cho AppHeader search input

- **Host**: `AppHeader` (từ T8) — thêm `<SearchInput>` persistent bên phải logo, trái user menu.
- **Behavior**: Enter hoặc click icon → navigate `/search?q=<value>&projectSlug=<currentProjectSlug?>`.
- **Scope detection**: đọc `useParams<{ slug?: string }>()` trong header context; nếu URL hiện là `/projects/:slug/...` → auto prepend `projectSlug=<slug>`. Ngược lại → không set.

## State machine

```
idle (no q in URL) → empty-placeholder
q present → loading
            ├── success (hits.length > 0) → list view
            ├── success (hits.length === 0) → empty-result
            └── error
                 ├── 400 SEARCH_QUERY_EMPTY / TOO_LONG → inline hint dưới input
                 └── other → generic error banner
```

- **States**:
  - `empty-placeholder` — chưa có `q`: icon `Search` + copy "Nhập từ khoá để tìm feature".
  - `loading` — skeleton: 3 row placeholder (title + 2 line snippet).
  - `list` — danh sách hits dọc.
  - `empty-result` — "Không tìm thấy feature nào khớp với '<q>'".
  - `error-query` — inline input hint (từ Zod validation).
  - `error-other` — banner.

## Interactions

| Trigger                          | Action                                                  | Next state              | Side effect                                             |
| -------------------------------- | ------------------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| Type trong header input + Enter  | `navigate("/search?q=<v>&projectSlug=<scope>")`         | idle → loading          | URL push; scope inferred từ current route               |
| Click icon 🔍 trong header       | Same as Enter                                           | idle → loading          | —                                                       |
| Page mount có `q`                | `useSearch({ q, projectSlug })` fetch                   | loading → success/error | TanStack Query key `["search", q, projectSlug ?? null]` |
| Click result row                 | Navigate `/projects/:projectSlug/features/:featureSlug` | unmount                 | SPA push                                                |
| Click "×" trên filter chip scope | Remove `projectSlug` param → re-fetch toàn repo         | loading                 | URL replace (giữ `q`)                                   |
| Change `q` trong header (submit) | URL replace với `q` mới; chip scope giữ nguyên          | loading                 | Query key đổi → new fetch                               |
| Empty input + Enter              | Client guard: không navigate. Inline "Nhập từ khoá"     | —                       | No API call                                             |

## A11y

- **Input**: `<input type="search" role="searchbox" aria-label="Tìm feature">`. Wrapper `<form role="search">` để screen reader announce landmark.
- **Keyboard**: Enter submit; Esc clear input (standard input[type=search] behavior).
- **Results**: mỗi row = `<a>` tab-focusable, `aria-label="<title> — <projectSlug>"`.
- **Live region**: khi loading xong, `aria-live="polite"` announce "<N> kết quả" hoặc "Không tìm thấy kết quả".
- **Mark highlight**: `<mark>` element — screen reader thường không đọc nhấn, OK semantically.
- **Chip scope**: button `aria-label="Remove filter: search trong project <name>"`.
- **Contrast**: `<mark>` background phải ≥ 3:1 với `bg-background` cả light + dark; sẽ add token mới (`--highlight` → design-system.md).

## Wire-level description (UI uplift v2 — Workspace style — CR-002)

### Desktop (≥ 1024px)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppHeader (search input đã có ở top)                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ max-w-5xl, px-10, py-7                                                        │
│                                                                               │
│  HERO BLOCK (flat — no panel)                                                 │
│   TÌM KIẾM ← eyebrow text-xs uppercase tracking-wide primary-600              │
│   Kết quả cho "đăng nhập"   ← h1 32/38 bold + query inline primary highlight │
│   18 kết quả · trong toàn workspace   ← stats text-base muted                 │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ FILTER ROW (rounded-xl bg-muted/40 border px-4 py-3)                 │    │
│  │  PHẠM VI: [Toàn workspace] [Project: Pilot ✕] [Loại: Tất cả ▾]      │    │
│  │  Sắp xếp: [Liên quan nhất ▾]                  18 kết quả             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ ┌──┐ Đăng nhập bằng email           [Đủ doc]              →         │    │
│  │ │📁│ Pilot Project › login-with-email                                │    │
│  │ └──┘ context breadcrumb muted xs                                     │    │
│  │                                                                       │    │
│  │  …<mark>Đăng nhập</mark> bằng email + password. Người dùng nhập       │    │
│  │  email vào input và nhấn nút submit để gửi yêu cầu xác thực…         │    │
│  │  ↑ snippet sanitized HTML, prose, line-clamp-3                       │    │
│  │ ─────────────────────────────────────────────────────────────────── │    │
│  │ Section: 🏷 Nghiệp vụ · @TríMinh · 2 giờ trước                       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ ┌──┐ Webhook Momo                                  [Đang viết]  →    │    │
│  │ │📁│ Pilot Project › webhook-momo                                     │    │
│  │ └──┘                                                                   │    │
│  │  …flow xác thực <mark>đăng nhập</mark> SSO đi qua Momo gateway…       │    │
│  │ ─────────────────────────────────────────────────────────────────── │    │
│  │ Section: 🔧 Tech notes · @NgọcLinh · 1 ngày trước                    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Idle state (no `q` in URL)

```text
┌──────────────────────┐
│       🔍 size-16      │
│   text-primary/40     │
│                       │
│  Tìm trong workspace  │
│  ↑ font-display xl    │
│                       │
│  Nhập từ khóa vào...  │
│                       │
│  ┌─────────────────┐  │
│  │ ⓘ MẸO TÌM KIẾM │  │
│  │ • Tìm theo title  │
│  │ • Bao "..." cho  │
│  │   exact phrase   │
│  │ • Click chip để  │
│  │   filter project │
│  └─────────────────┘  │
└──────────────────────┘
```

### Zero-result state (q valid, results empty)

```text
┌──────────────────────────────┐
│   🔍❌ SearchX size-16        │
│   text-primary/40             │
│                               │
│  Không tìm thấy kết quả nào  │
│                               │
│  Không có feature match...    │
│                               │
│  [Bỏ filter project]          │
│  [Quay về catalog]            │
└──────────────────────────────┘
```

### Mobile (< 768px) — 1-col, hero stacks, filter row scrolls horizontally

### Layout primitives

- **Container**: `mx-auto max-w-5xl px-10 py-7`. Mobile: `px-4`.
- **Hero block** (flat, no panel charter §3):
  - Eyebrow `text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 mb-2` "TÌM KIẾM".
  - h1: `font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em]` "Kết quả cho \"<query>\"" với `<query>` rendered inline `text-primary` để emphasize.
  - Stats line `mt-2 text-base text-muted-foreground` = `{count} kết quả · {scope}` (scope = "trong project <projectName>" nếu có projectSlug filter, else "trong toàn workspace").
- **Filter row** (NEW): `mt-6 mb-6 rounded-xl bg-muted/40 border border-border px-4 py-3 flex flex-col gap-3`:
  - Top row: label "PHẠM VI:" + filter chip group (Toàn workspace / Project chip removable / Loại dropdown placeholder).
  - Bottom row: "Sắp xếp:" + dropdown placeholder + count right.

### Filter chips (REDESIGN existing FilterChip)

- Active scope chip ("Toàn workspace" or "Project: <name>"): `inline-flex items-center gap-1.5 h-7 px-3 rounded-md font-ui text-xs font-semibold bg-card shadow-sm text-foreground`.
- Idle: `text-muted-foreground hover:text-foreground hover:bg-muted/50`.
- Removable chip: append `<X size-3>` button với `aria-label="Bỏ filter project {name}"`.
- "Loại" dropdown chip: same pill shape + `<ChevronDown size-3>` — disabled v1, click → toast.
- Sort dropdown: `font-ui font-semibold text-xs h-7 px-2.5 rounded-md border bg-card flex items-center gap-1.5` "Liên quan nhất ▾" — placeholder v1.

### Result card (REDESIGN — replaces SearchResultRow)

- Container: semantic `<Link>` `group rounded-xl border border-border bg-card p-5 flex flex-col gap-3.5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring`.
- **Top row** `flex items-start gap-3`:
  - **Icon plate 36×36**: `rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0` chứa `<FolderOpen className="size-4.5 text-primary-600">`.
  - **Body** flex-1 min-w-0:
    - Title row `flex items-center gap-2`: `<h2 className="font-display text-lg leading-tight font-bold line-clamp-1 flex-1">{feature.title}</h2>` + `<Badge tone={statusTone} size="sm" dot>{statusLabel}</Badge>` (chỉ render nếu hit có filledCount; v1 skip if missing).
    - Context breadcrumb `mt-1 font-ui text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5`: project name (fallback projectSlug) + `<ChevronRight size-3>` + featureSlug.
  - Chevron `size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0`.
- **Snippet block**: `font-body text-sm leading-relaxed text-foreground/90 line-clamp-3`. HTML sanitized via existing markdown pipeline (snippet contains `<mark>` from tsvector ts_headline). DOMPurify whitelist `<mark>` already; style: `bg-primary-100 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100 px-0.5 rounded`.
- **Footer** `pt-3 border-t border-border flex items-center gap-2 font-ui text-xs text-muted-foreground`:
  - Section icon size-3.5 + label "Section: <strong className='text-foreground/80'>{sectionLabel}</strong>" (placeholder if `sectionType` not in SearchHit response — show "—" instead).
  - Separator `·`.
  - Author `@{updatedByName ?? "—"}` (placeholder fallback).
  - Separator `·`.
  - `<RelativeTime>` (placeholder if missing).

### Idle state (no query)

Centered `py-16 px-6 max-w-md mx-auto flex flex-col items-center text-center`:

- Icon: `<Search className="size-16 text-primary/40">`.
- Heading: `font-display text-xl font-semibold mt-6` "Tìm trong workspace".
- Description: `mt-2 text-sm text-muted-foreground` "Nhập từ khóa vào search box ở thanh top để tìm features. FTS hỗ trợ tiếng Việt có dấu."
- Tips card NEW `mt-6 rounded-lg bg-info-50 dark:bg-info-950/30 border border-info-200 dark:border-info-800 p-4 text-left w-full`:
  - Header `flex items-center gap-2 mb-2`: `<Info size-3.5 text-info-500>` + `font-ui text-xs font-bold text-info-700 dark:text-info-300` "MẸO TÌM KIẾM".
  - Bullet list `font-body text-xs leading-relaxed text-foreground/80 list-disc list-inside space-y-1`:
    - "Tìm theo title hoặc nội dung section."
    - "Bao quanh cụm từ với <code>\"...\"</code> để match exact phrase."
    - "Filter theo project bằng cách click chip <strong>Project: ...</strong> trên kết quả."

### Zero-result state

Centered `py-16 px-6 max-w-md mx-auto flex flex-col items-center text-center`:

- Icon: `<SearchX className="size-16 text-primary/40">`.
- Heading: `font-display text-xl font-semibold mt-6` "Không tìm thấy kết quả nào".
- Description: `mt-2 text-sm text-muted-foreground` "Không có feature nào match với từ khóa <strong>\"{query}\"</strong>{scope}. Thử từ khóa khác hoặc bỏ filter project."
- Actions `mt-6 flex flex-wrap gap-3 justify-center`:
  - `<Button variant="outline" size="sm">Bỏ filter project</Button>` (chỉ render nếu projectSlug filter active) — click removes scope, refetches.
  - `<Button variant="default" size="sm">Quay về catalog</Button>` → navigate `/`.

### Loading / error

- **Loading**: hero static, count = "—" placeholder; filter row visible nhưng disabled. Below: 3 result card skeletons match shape (icon plate 36×36 + 2 text bars + 3-line snippet skeleton + footer line). `aria-busy="true"` trên `<main>`.
- **Error 5xx**: charter §5 banner `role="alert"` above results area. Filter row + hero giữ.
- **Error 400 (query empty/too long)**: inline hint dưới search input trong header (existing behavior preserved).
  - Count sub: `text-sm text-muted-foreground`.
  - Row title: `font-display text-base font-semibold`.
  - Row breadcrumb: `text-xs text-muted-foreground`.
  - Row snippet: `text-sm text-muted-foreground leading-relaxed line-clamp-3`.
  - `<mark>`: `bg-[hsl(var(--highlight))] text-foreground px-0.5 rounded-sm`.
- **Spacing**:
  - Row padding: `p-4`.
  - Row gap: `space-y-3`.
  - Chip gap từ heading: `gap-4`.

## Error / empty / loading states

- **Empty-placeholder** (no `q`): center icon + 2 copy lines, không CTA. Không fetch.
- **Loading**: 3 skeleton row (`bg-muted animate-pulse` on title + 2 line body). `aria-busy="true"`.
- **Empty-result**: center panel:
  ```
  🔍 Không tìm thấy feature nào khớp với "<q>"
  Thử từ khoá ngắn hơn hoặc kiểm tra chính tả.
  ```
- **Error `SEARCH_QUERY_EMPTY`**: client guard trước khi submit → không hit API.
- **Error `SEARCH_QUERY_TOO_LONG`**: inline text đỏ dưới header input "Từ khoá tối đa 200 ký tự".
- **Error other**: banner `text-destructive` trên list; vẫn render chip + count nếu cached.
- **Unauthenticated**: `RequireAuth` redirect `/login?next=/search?q=...`.

## Security: snippet XSS

**AC: snippet chứa user content; backend return `<mark>` bao quanh match, có thể chứa ký tự HTML escape.**

- Frontend `SearchResultRow` pass snippet qua `sanitizeSnippet()` (new helper in `apps/web/src/lib/markdown.ts` hoặc `lib/sanitize.ts`) — DOMPurify allow **chỉ** `<mark>`, strip mọi tag khác, giữ text.
- Test: inject `<script>alert(1)</script><mark>login</mark>` → chỉ còn literal escaped + `<mark>`.

## Design-system additions (required trước khi implement)

Thêm vào `design-system.md` trong commit riêng TRƯỚC khi code T10:

- **Token**: `--highlight` (light `48 96% 89%` ~ soft yellow; dark `48 60% 35%`). Contrast ≥ 3:1 với `--background`.
- **Component**: `SearchInput`, `SearchResultRow`, `FilterChip`. Icon-only variants.
- **Icon**: `Search`, `X` (lucide-react — đã có lib, chỉ declare).
- **§7 CHANGELOG row**: `2026-04-23 — Add highlight token + SearchInput/SearchResultRow/FilterChip primitives for T10 search page.`

---

## US-005 v2 — Multi-entity grouped + filters

> Below additions superseded v1 single-entity layout starting from US-005 ship. v1 sections above remain for historical reference until US-005 T9 lands.

### State machine v2

```text
idle (no q) → empty-placeholder
q present  → loading
              ├── success (any group has hits) → grouped-list
              ├── success (all groups empty)   → zero-result (with active-filter chip list nếu có)
              └── error
                   ├── 400 SEARCH_QUERY_EMPTY / TOO_LONG → inline hint dưới input
                   ├── 400 VALIDATION_ERROR (filter param) → inline error trong FilterBar
                   └── 5xx → banner role=alert phía trên list
```

### Interactions v2 (additive)

| Trigger                                    | Action                                                                 | Next state       | Side effect                               |
| ------------------------------------------ | ---------------------------------------------------------------------- | ---------------- | ----------------------------------------- |
| Toggle SectionType chip                    | Update `sectionTypes` URL param (CSV)                                  | refetch          | Filter narrows sections + features groups |
| Change Author dropdown                     | Update `authorId` URL param                                            | refetch          | Filter narrows sections + uploads groups  |
| Change TimeRange dropdown                  | Update `updatedSince` URL param (ISO)                                  | refetch          | Filter narrows mọi group có `updatedAt`   |
| Toggle Status chip                         | Update `status` URL param (single-select-or-clear)                     | refetch          | Filter narrows features + sections        |
| Click "× <filter>" trong zero-result panel | Remove that filter param                                               | refetch          | URL replace                               |
| Click ProjectResultCard                    | Navigate `/projects/:slug`                                             | unmount          | SPA push                                  |
| Click SectionResultCard                    | Navigate `/projects/:projectSlug/features/:featureSlug#section-{type}` | unmount          | Browser scroll vào section anchor         |
| Click AuthorResultCard                     | v1 placeholder → toast "Trang user defer v2"                           | —                | None                                      |
| Click UploadResultCard                     | Navigate parent feature `/projects/:p/features/:f#section-screenshots` | unmount          | SPA push                                  |
| AuthorPicker input typing                  | Debounced 300ms `useUsers({ q })`                                      | dropdown refresh | TanStack Query key `["users", q]`         |
| Empty AuthorPicker selection               | Clear `authorId` param                                                 | refetch          | URL replace                               |

### A11y v2

- **FilterBar**: `<section role="search" aria-label="Bộ lọc tìm kiếm">` wrap toàn bộ filter cluster.
- **SectionTypeChips**: group `role="group" aria-label="Lọc theo loại section"`. Mỗi chip = `<button role="checkbox" aria-checked>` (multi-select).
- **Status chips**: group `role="radiogroup" aria-label="Lọc theo trạng thái feature"`. Mỗi chip = `<button role="radio" aria-checked>`.
- **AuthorPicker**: combobox pattern WAI-ARIA 1.2 — `<input role="combobox" aria-expanded aria-controls="author-listbox">`.
- **TimeRangeDropdown**: `<button aria-haspopup="listbox">` mở `<ul role="listbox">`.
- **Group section header**: `<h2>` + `<span aria-label="N kết quả">`. Live region `aria-live="polite"` announce tổng kết khi list update.
- **Section anchor target**: FeatureDetailPage section heading có `id="section-<type>"` + `tabindex="-1"` để focus when scrolled.

### Wire-level v2 — Desktop (≥ 1024px)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppHeader (search input)                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ max-w-5xl, px-10, py-7                                                        │
│                                                                               │
│ HERO BLOCK (flat)                                                             │
│  TÌM KIẾM ← eyebrow primary                                                   │
│  Kết quả cho "đăng nhập"                                                      │
│  18 kết quả · trong toàn workspace                                            │
│                                                                               │
│ ┌──────────────────────────────────────────────────────────────────────┐     │
│ │ FILTER BAR (rounded-xl bg-muted/40 px-4 py-3 flex flex-wrap gap-3)   │     │
│ │  [Loại: ▢ Business ▣ User-flow ▢ Rules ▢ Tech ▢ Screenshots]        │     │
│ │  [Author: Tất cả ▾]  [Cập nhật: Mọi lúc ▾]  [Trạng thái: ◯ Đủ ◯ ◯] │     │
│ └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│ ┌─ 📁 Projects · 2 ─────────────────────────────────────────────────────┐    │
│ │  [ProjectResultCard] [ProjectResultCard]                              │    │
│ └───────────────────────────────────────────────────────────────────────┘    │
│ ┌─ 📄 Features · 5 ─────────────────────────────────────────────────────┐    │
│ │  [FeatureResultCard] [FeatureResultCard] ... (max 5)                  │    │
│ └───────────────────────────────────────────────────────────────────────┘    │
│ ┌─ 📝 Sections · 4 ─────────────────────────────────────────────────────┐    │
│ │  [SectionResultCard with section-type icon + breadcrumb + snippet]    │    │
│ └───────────────────────────────────────────────────────────────────────┘    │
│ ┌─ 👤 Authors · 1 ──────────────────────────────────────────────────────┐    │
│ │  [AuthorResultCard]                                                   │    │
│ └───────────────────────────────────────────────────────────────────────┘    │
│ ┌─ 📎 Uploads · 0 ─────  (skipped — không render khi count=0)                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Wire-level v2 — Group section header

`mt-8 mb-3 flex items-center justify-between`:

- Left `flex items-center gap-2`:
  - Icon (size-5 text-primary): FolderOpen / FileText / FileType / User / Paperclip per entity.
  - h2 `font-display text-base font-bold tracking-tight`: "Projects" / "Features" / "Sections" / "Authors" / "Uploads".
  - Count badge `text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5`.
- Right (defer v2): "Xem tất cả →" link placeholder, hidden v1 (top-5 đủ).

### Card variants v2

#### ProjectResultCard

`flex items-center gap-4 p-5 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md`:

- ProjectAvatar 40 (gradient bucket via `avatarBucket(slug)`).
- Body min-w-0: name `font-display text-lg font-semibold line-clamp-1`; description `text-sm text-muted-foreground line-clamp-1`; meta `flex items-center gap-3 text-xs text-muted-foreground` (FolderOpen `{featureCount} feature` + Clock RelativeTime).
- Chevron right.

#### FeatureResultCard

(refactor existing SearchResultRow, keep current shape) — icon plate FolderOpen + title + breadcrumb + snippet line-clamp-3 + footer (section + author + time).

#### SectionResultCard

`flex flex-col gap-3 p-5 rounded-xl border bg-card hover:border-primary/30`:

- Top `flex items-start gap-3`:
  - Section-type icon plate 36 (icon by type: ScrollText / Workflow / ListChecks / Wrench / Image).
  - Body: section-type label `font-ui text-xs font-bold uppercase tracking-wider text-primary-700`; breadcrumb projectName › featureTitle (text-xs text-muted-foreground line-clamp-1).
- Snippet: `font-body text-sm leading-relaxed line-clamp-3` với `<mark>` highlight.
- Footer `flex items-center gap-2 text-xs text-muted-foreground`: Avatar xs (updatedBy) + display name + RelativeTime.
- Anchor href: `/projects/:projectSlug/features/:featureSlug#section-{type}`.

#### AuthorResultCard

`flex items-center gap-4 p-4 rounded-xl border bg-card`:

- Avatar md (display name initial, gradient bucket).
- Body: displayName `font-display text-base font-semibold` + role badge (`admin` tone primary / `author` tone neutral) + meta `text-xs text-muted-foreground` "Đã touch {N} feature".
- Click → toast "Trang user defer v2" (skeleton-UI policy).

#### UploadResultCard

`flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/30`:

- File icon plate 36 (FileImage / FileText by mime).
- Body: filename `font-mono text-sm line-clamp-1` + caption nếu có `text-xs text-muted-foreground line-clamp-1`; meta breadcrumb projectName › featureTitle + uploadedByName + RelativeTime.
- Anchor href: parent feature page screenshots section.

### Filter bar layout

`mt-6 mb-6 rounded-xl bg-muted/40 border border-border px-4 py-3 flex flex-wrap items-center gap-3`. Order kiosk-style:

1. **SectionTypeChips** (eyebrow "Loại:" left): horizontal chip group 5 items, multi-select toggle.
2. **AuthorPicker** (eyebrow "Tác giả:"): combobox button placeholder "Tất cả tác giả ▾" → mở dropdown listbox với search input on top.
3. **TimeRangeDropdown** (eyebrow "Cập nhật:"): button "Mọi lúc ▾" / "24 giờ" / "7 ngày" / "30 ngày".
4. **StatusChips** (eyebrow "Trạng thái:"): 3 toggle "Đủ doc / Đang viết / Chưa có" — single-select with clear (click chip đang active để clear).

Mobile: filter bar overflow-x-auto, no wrap; eyebrow labels visually hidden but `aria-label` retained.

### Idle state v2 (no `q`)

(unchanged từ v1, keep tip card; thêm tip "Filter loại section để tìm theme cụ thể (vd. user-flow cho business flow).")

### Zero-result state v2 (q valid, all groups empty)

```text
┌──────────────────────────────┐
│   🔍❌ SearchX size-16        │
│                               │
│  Không tìm thấy kết quả nào  │
│                               │
│  Không có gì khớp "<query>"   │
│  với filter hiện tại.         │
│                               │
│  Filter đang áp dụng:         │
│  [✕ Loại: User-flow]         │
│  [✕ Tác giả: Lan]            │
│                               │
│  [Xoá tất cả filter]          │
│  [Quay về catalog]            │
└──────────────────────────────┘
```

- Active-filter chips removable: click chip × → remove that filter param → refetch.
- "Xoá tất cả filter": reset toàn bộ filter params, giữ `q`.
- Hidden filter chip list nếu không có filter active.

### Loading v2

- Hero static, count "—".
- FilterBar visible nhưng disabled (`aria-busy`).
- 3 group skeletons (Projects + Features + Sections fake) với shape match real cards.

### Section anchor verification (US-005 T9 in-scope)

FeatureDetailPage hiện tại render section heading. Verify:

- Heading element `<h2 id="section-business">`, `<h2 id="section-user-flow">`, ... đã có id chuẩn hoá `section-<type>`.
- Nếu chưa, T9 thêm id + `tabindex="-1"` + `scroll-margin-top: 5rem` để header sticky không che heading khi scroll-into-view.
- Update [.specs/ui/feature-detail.md](feature-detail.md) §A11y nếu fix anchor.

### Component additions cho US-005

Thêm vào [.specs/ui/design-system.md](design-system.md) trong commit T7/T8 (FE):

- **Components**:
  - `FilterBar` (composite container)
  - `SectionTypeChips` (multi-select chip group)
  - `AuthorPicker` (combobox + listbox với search-as-you-type)
  - `TimeRangeDropdown` (preset 4 values)
  - `StatusChips` (single-select chip group)
  - `ProjectResultCard`, `SectionResultCard`, `AuthorResultCard`, `UploadResultCard`
  - `FeatureResultCard` (rename `SearchResultRow`)
  - `EntityGroup<T>` wrapper (header + skip-when-empty pattern)
- **Icons** (lucide-react, đã có lib): `ScrollText`, `Workflow`, `ListChecks`, `Wrench`, `Image`, `User`, `Paperclip`, `FileImage`, `FileText`, `Clock`, `Filter`.
- **CHANGELOG row design-system.md**:
  `2026-04-25 — Add FilterBar + 4 sub-filters + 5 entity result cards + EntityGroup wrapper for US-005 search v2.`

### Gate decisions US-005 (approved 2026-04-25)

- **Filter bar order**: SectionType → Author → TimeRange → Status (most-frequent leftmost).
- **Status chip semantics**: single-select with toggle-clear (không multi-select 3 tone vì mâu thuẫn — "filled" và "partial" loại trừ nhau).
- **Group skip when empty**: ✅ skip; không render zero-card placeholder per group.
- **Author card click**: placeholder toast (skeleton-UI policy — defer routing).
- **Upload card click**: target screenshots section của parent feature.
- **URL serialization**: only non-default values; `sectionTypes` CSV; status enum literal.
- **Mobile filter bar**: horizontal scroll, không drawer/sheet (defer drawer pattern).
- **AuthorPicker debounce**: 300ms.
- **Skeleton-UI policy**: AuthorResultCard click target defer; touched feature count tính qua subquery, không cần endpoint mới.

---

## Maps US

- [US-001](../stories/US-001.md) — AC-7 (FTS search), AC-8 (empty query không fetch).
- [US-005](../stories/US-005.md) — AC-1 đến AC-15 (multi-entity + filters + URL state + section anchor + sanitize).

## Implementation

- **Task**: [T10](../stories/US-001/tasks.md#t10--search-page--playwright-smoke--setup-validation)
- **Page component**: `apps/web/src/pages/SearchPage.tsx`
- **Query**: `apps/web/src/queries/search.ts` — `useSearch({ q, projectSlug })` (key `["search", q, projectSlug ?? null]`).
- **Sub-components** (new T10):
  - `apps/web/src/components/search/SearchInput.tsx` (used in AppHeader + optional page).
  - `apps/web/src/components/search/SearchResultRow.tsx`.
  - `apps/web/src/components/common/FilterChip.tsx`.
- **Sub-components US-005 v2** (T7-T9):
  - `apps/web/src/components/search/FilterBar.tsx`
  - `apps/web/src/components/search/SectionTypeChips.tsx`
  - `apps/web/src/components/search/AuthorPicker.tsx`
  - `apps/web/src/components/search/TimeRangeDropdown.tsx`
  - `apps/web/src/components/search/StatusChips.tsx`
  - `apps/web/src/components/search/ProjectResultCard.tsx`
  - `apps/web/src/components/search/FeatureResultCard.tsx` (rename from `SearchResultRow.tsx`)
  - `apps/web/src/components/search/SectionResultCard.tsx`
  - `apps/web/src/components/search/AuthorResultCard.tsx`
  - `apps/web/src/components/search/UploadResultCard.tsx`
  - `apps/web/src/components/search/EntityGroup.tsx`
- **Queries (US-005)**:
  - Update `apps/web/src/queries/search.ts` — `useSearch({ q, projectSlug, sectionTypes?, authorId?, updatedSince?, status? })` returning `SearchResultsV2`.
  - New `apps/web/src/queries/users.ts` — `useUsers({ q?, role? })`.
- **Shared helper**: `apps/web/src/lib/sanitize.ts` (hoặc extend `lib/markdown.ts`) — `sanitizeSnippet()` allow-list chỉ `<mark>`.
- **AppHeader update**: wire SearchInput, detect current project slug qua `useLocation` + parse path.
- **Playwright E2E**: `e2e/us-001.spec.ts` (new) — full happy path login → landing → feature → search với `<mark>` assertion. Playwright config `playwright.config.ts` + `pnpm test:e2e` script wire-up.

## Gate 1 decisions (approved 2026-04-23)

User approved all Proposed defaults:

- Placeholder text input: `"Tìm kiếm..."`.
- Scope chip copy: `"Trong <project.name>"` (fetched từ project name, fallback slug nếu API chưa resolve).
- Standalone `/search` (no current project) → không render chip; search toàn repo.
- Click row → SPA same-tab navigate.
- `--highlight` = vàng soft (HSL `48 96% 89%` light / `48 60% 35%` dark).
- Count copy: `"3 feature"` (hoặc `"Không có feature nào"` khi zero).
- Empty-result tip: `"Thử từ khoá ngắn hơn hoặc kiểm tra chính tả."`.
- Mobile: input full-width row riêng dưới logo, không click-to-expand.
