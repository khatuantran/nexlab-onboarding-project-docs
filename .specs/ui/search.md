# UI Spec — Search

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md). Visual quality bar per [visual-language.md](visual-language.md) charter (CR-002).

## Screen metadata

- **Screen ID**: `search`
- **Status**: Implemented (T10 `5ca8e49`) · UI uplift draft v2 Workspace (CR-002 / Phase 1B-4, 2026-04-25)
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

## Maps US

- [US-001](../stories/US-001.md) — AC-7 (FTS search), AC-8 (empty query không fetch).

## Implementation

- **Task**: [T10](../stories/US-001/tasks.md#t10--search-page--playwright-smoke--setup-validation)
- **Page component**: `apps/web/src/pages/SearchPage.tsx`
- **Query**: `apps/web/src/queries/search.ts` — `useSearch({ q, projectSlug })` (key `["search", q, projectSlug ?? null]`).
- **Sub-components** (new T10):
  - `apps/web/src/components/search/SearchInput.tsx` (used in AppHeader + optional page).
  - `apps/web/src/components/search/SearchResultRow.tsx`.
  - `apps/web/src/components/common/FilterChip.tsx`.
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
