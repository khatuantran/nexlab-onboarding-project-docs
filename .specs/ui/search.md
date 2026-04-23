# UI Spec — Search

<!-- template: 02-ui-spec-template.md@0.1 -->

Referenced tokens / icons / components từ [design-system.md](design-system.md).

## Screen metadata

- **Screen ID**: `search`
- **Status**: Implemented (T10 `5ca8e49`)
- **Last updated**: 2026-04-23

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

## Wire-level description

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────────┐
│ AppHeader                                                   │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Logo  [🔍 Tìm kiếm...____________]  ThemeToggle  ⚙  │    │
│ └──────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│  max-w-3xl, px-6, py-8                                      │
│                                                             │
│  Kết quả cho "login"               [× Trong Demo]           │
│  3 feature                                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Demo › Login with email                              │    │
│  │ Đăng nhập bằng email                                 │    │
│  │ ...user <mark>login</mark> với email + password...   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Demo › Search features                               │    │
│  │ ...                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### Empty-placeholder (không q)

```
┌────────────────────────────┐
│         🔍 (size-12)        │
│                             │
│  Nhập từ khoá để tìm        │
│       feature               │
│                             │
│  VD: "login", "upload"      │
└────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ AppHeader            │
│ [🔍________]  ☰      │
├──────────────────────┤
│ Kết quả cho "login"  │
│ [× Trong Demo]       │
│ 3 feature            │
│                      │
│ ┌──────────────────┐ │
│ │ Demo › Login...  │ │
│ │ ...<mark>login</mark>... │ │
│ └──────────────────┘ │
└──────────────────────┘
```

- **Layout**:
  - Page container: `max-w-3xl px-6 py-8`.
  - Header block (heading + chip + count): `flex items-center justify-between gap-4 mb-6`.
  - Result list: `space-y-3` (stack, không grid).
  - Empty placeholder: flex center `min-h-[60vh]`.
- **Key components** (design-system §5):
  - `SearchInput` (mới) — input + submit icon button. Reuse trong AppHeader + optional page-level (không v1).
  - `SearchResultRow` (mới) — `<a>` wrap breadcrumb + title + sanitized snippet HTML.
  - `FilterChip` (mới) — pill với X button, `bg-muted`, `text-foreground`.
  - `EmptyState` (từ T9) — reuse cho empty-placeholder + empty-result variants.
- **Key icons** (design-system §4):
  - `Search` — input prefix icon (`size-4 text-muted-foreground`); empty placeholder (`size-12`).
  - `X` — chip remove button (`size-3.5`).
  - `ChevronRight` — breadcrumb separator (đã có trong T9).
- **Key tokens**:
  - `bg-background` main.
  - `bg-muted` chip + input bg.
  - `text-foreground` title.
  - `text-muted-foreground` breadcrumb + snippet + count.
  - `ring-ring` focus input + card.
  - `--highlight` (new token, xem §design-system change below) cho `<mark>` bg.
- **Typography**:
  - Heading "Kết quả cho …": `text-xl font-semibold`.
  - Count sub: `text-sm text-muted-foreground`.
  - Row title: `text-base font-medium`.
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
