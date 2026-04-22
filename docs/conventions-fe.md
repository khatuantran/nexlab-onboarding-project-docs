# Frontend Coding Conventions (`apps/web`)

_Last updated: 2026-04-23 · Áp dụng cho mọi PR/commit vào `apps/web/`._

**Enforcement**: Tasks phải tuân thủ. ESLint/Prettier + React plugin catch cơ bản.

## 1. Folder layout

```
src/
├── main.tsx            → entry: Router + QueryClient + ErrorBoundary providers
├── App.tsx             → route tree shell
├── routes/             → route definitions (createBrowserRouter)
├── pages/              → page-level components (1 route = 1 page file)
├── components/
│   ├── ui/             → shadcn primitives (copied, không edit trừ khi update shadcn)
│   ├── layout/         → AppHeader, AppShell, ErrorBoundary, RequireAuth
│   └── features/<area>/ → domain-scoped components (FeatureList, SectionIndicator)
├── queries/            → TanStack Query hooks (useMe, useProject, ...)
├── hooks/              → pure custom hooks
├── lib/                → api.ts, cn.ts, errorMessages.ts, relativeTime.ts
├── styles/             → index.css (Tailwind directives), theme
└── test/               → setup.ts, msw-handlers.ts, test-utils.tsx
```

**Rule**: `pages/` render data; `components/features/` là presentational blocks tái dùng trong page; `components/layout/` là app-wide chrome.

## 2. Component conventions

- **PascalCase** file + component name: `LoginPage.tsx` export `LoginPage`.
- **1 component / file**. Sub-component chỉ inline khi < 30 dòng + không reuse nơi khác.
- **Functional component + hooks only** (không class trừ ErrorBoundary).
- **Props type**: export interface `XProps` cùng file; không dùng `React.FC` (mặc định lỗi thời trong TS).

## 3. TypeScript

- `strict: true` + `noUncheckedIndexedAccess`.
- Không `any` không comment.
- Type props đầy đủ. Không dùng `any` / `unknown` cho children prop — dùng `React.ReactNode`.
- ESM + path alias `@/*` → `src/*`.

## 4. State management

- **Server state**: TanStack Query qua hooks trong `queries/`. KHÔNG `useState` để cache server data.
- **Client state**: React state mặc định. Zustand CHỈ khi cần global (theme, user preference cross-component).
- KHÔNG Redux / MobX (xem [ADR-001](../.specs/adr/ADR-001-tech-stack.md)).

## 5. Forms

- **react-hook-form + zodResolver**. Zod schema từ `packages/shared/src/schemas/`.
- Inline validation hiển thị dưới input; error message dùng copy từ `errorMessages.ts` khi map từ API error.
- Submit button `disabled` khi `form.formState.isSubmitting`.

## 6. Styling

- **Tailwind utility-first**. KHÔNG CSS-in-JS (styled-components, emotion).
- **shadcn/ui** primitives là nguồn cho button/input/dialog/...; copy vào `components/ui/`.
- Utility class sort qua Prettier plugin (nếu add).
- `cn()` helper (from `lib/cn.ts`, uses `clsx` + `tailwind-merge`) cho conditional class.
- KHÔNG inline `style` prop trừ khi dynamic value không thể dùng Tailwind.

## 7. Accessibility (baseline)

- Semantic HTML: `<button>` cho action, `<a>` cho navigation, `<nav>`/`<main>`/`<header>` cho landmarks.
- Mọi `<input>` có `<label>` liên kết qua `htmlFor`/`id`.
- Icon-only button phải có `aria-label`.
- Error message vùng live: `aria-live="polite"`.
- Loading state: `aria-busy`.
- Color contrast ≥ 4.5:1 (shadcn defaults đã đạt).
- Test keyboard: tab → Enter → focus visible ring.

## 8. API calls

- **Mọi fetch qua `apiFetch` từ `lib/api.ts`** (đặt `credentials: "include"`, parse error shape).
- KHÔNG `fetch()` trần trong component.
- Error → throw `ApiError` với `code` khớp `ErrorCode` enum; component bắt qua TanStack Query `error` state hoặc `onError` mutation.
- UI copy map từ `ErrorCode` qua `lib/errorMessages.ts`.

## 9. Routing

- **React Router v6** `createBrowserRouter` trong `routes/`.
- Protected routes wrap bằng `<RequireAuth>` (check `useMe()`; unauth → `<Navigate to="/login?next=...">`).
- Lazy load route khi bundle size > 200 KB/page (measure trước khi optimize).

## 10. Markdown / HTML injection

- **DOMPurify sanitize** trước `dangerouslySetInnerHTML`. Config allowlist strict.
- `<mark>` cho search highlight OK; `<script>`, `on*` attribute KHÔNG.
- Render markdown qua `markdown-it` (hoặc `react-markdown`) → HTML → DOMPurify.

## 11. Testing

- Vitest + `@testing-library/react` + `jsdom`.
- MSW cho API mock.
- File ở `tests/` mirror `src/` (không co-locate).
- **Test behavior, không test implementation**: query by role/label/text, không query by CSS class hay test id trừ khi bắt buộc.
- Form test: fill by label → submit → assert message / router navigate.
- KHÔNG snapshot test cho component có data động.

## 12. Internationalization

- UI copy **tiếng Việt**. Code/test/commit tiếng Anh.
- Date/time qua `date-fns/formatDistance` locale `vi`.
- Số lớn: chưa cần `Intl.NumberFormat` v1.

## 13. Naming

| Kind                    | Convention                          | Example                           |
| ----------------------- | ----------------------------------- | --------------------------------- |
| Component file + export | PascalCase                          | `FeatureList.tsx` → `FeatureList` |
| Hook                    | camelCase, `use` prefix             | `useFeature`, `useRelativeTime`   |
| Non-component file      | camelCase                           | `api.ts`, `errorMessages.ts`      |
| Type / Interface        | PascalCase, optional `Props` suffix | `Feature`, `FeatureListProps`     |
| Constant                | SCREAMING_SNAKE_CASE                | `SECTION_ORDER`                   |
| CSS variable            | kebab-case                          | `--color-primary`                 |

## 14. Hard DO NOTs

- ❌ `any` không comment.
- ❌ `fetch()` trần (phải qua `apiFetch`).
- ❌ `useState` để cache API response.
- ❌ Inline prop drilling > 3 levels (dùng hook / context).
- ❌ `dangerouslySetInnerHTML` không sanitize.
- ❌ CSS-in-JS library.
- ❌ `React.FC` hoặc `PropTypes`.
- ❌ `console.log` commit.
- ❌ Test bằng `container.querySelector('.css-class')` (brittle).
- ❌ Click handler bằng `<div onClick>` khi có thể dùng `<button>`.

## References

- [CLAUDE.md](../CLAUDE.md) — SDD contract.
- [ADR-001 §2.2](../.specs/adr/ADR-001-tech-stack.md#22-frontend-appsweb) — FE stack rationale.
- [docs/TESTING.md](TESTING.md) — test strategy.
- [.specs/error-codes.md](../.specs/error-codes.md) — UI copy map (§Client-side mapping).
