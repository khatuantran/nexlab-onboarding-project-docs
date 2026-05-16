# US-019 — Task Breakdown

_Story_: [US-019 — Cover image upload](../US-019.md). Effort ~4-5h.

| #   | Title                                                                     | Effort | AC        | Status     |
| --- | ------------------------------------------------------------------------- | ------ | --------- | ---------- |
| T1  | Migration 0013 + Drizzle schema + shared `coverUrl` field on Auth/Project | 0.5h   | prereq    | ✅ shipped |
| T2  | BE `POST /me/cover` + `POST /projects/:slug/cover` + repo updates + tests | 2h     | AC-1..11  | ✅ shipped |
| T3  | FE `CoverUploadDialog` + ProfilePage + ProjectHero wire + tests           | 2h     | AC-12..14 | ✅ shipped |

## T1 — Migration + shared

- Migration `apps/api/src/db/migrations/0013_users_projects_cover_url.sql`:
  ```sql
  ALTER TABLE users ADD COLUMN cover_url TEXT NULL;
  ALTER TABLE projects ADD COLUMN cover_url TEXT NULL;
  ```
- Drizzle schema: `users` + `projects` table thêm `coverUrl: text("cover_url")`.
- Journal `_journal.json` entry idx 13.
- Shared types extend: `AuthUser.coverUrl: string | null`, `ProjectSummary.coverUrl: string | null`, `ProjectResponse.coverUrl: string | null`.
- DoD: `APP_ENV=test pnpm db:migrate` applies 0013; shared test green.

## T2 — BE cover endpoints

- `apps/api/src/repos/userRepo.ts` — `updateCoverUrl(userId, url): Promise<UserRow | null>`.
- `apps/api/src/repos/projectRepo.ts` — `updateCoverUrl(slug, url): Promise<ProjectRow | null>`. `null` return → caller emits 404.
- `apps/api/src/routes/me.ts` — add `uploadCover` handler mirror `uploadAvatar` (separate `multerSingle` instance with `COVER_MAX_BYTES = 4 * 1024 * 1024`). Mount `router.post("/cover", requireAuth, multerCoverSingle, uploadCover)`. Cloudinary folder param `cloudinaryUserCoversFolder`.
- `apps/api/src/routes/projects.ts` — add `uploadProjectCover` handler with same multer + admin gate `requireAdmin`. Slug lookup → 404 nếu missing. Cloudinary folder `cloudinaryProjectCoversFolder`.
- `apps/api/src/index.ts` — wire 2 new folder configs (`${cloudinaryFolder}/covers/users`, `${cloudinaryFolder}/covers/projects`) vào createMeRouter + createProjectsRouter.
- `GET /me` toAuthUser mapper thêm `coverUrl: row.coverUrl ?? null`.
- `GET /projects` + `GET /projects/:slug` mapper thêm `coverUrl`.
- Tests:
  - `apps/api/tests/routes/me-cover.test.ts` — 6 cases (200, 413, 415, 401, 502, 503).
  - `apps/api/tests/routes/projects-cover.test.ts` — 4 cases (200 admin, 403 author, 404 missing, GET includes coverUrl).
  - Update existing `me-*` test files to pass new `cloudinaryUserCoversFolder` dep.
- DoD: api test ≥ 268 green; commit `feat(api): cover upload endpoints for /me + /projects/:slug (US-019 / T1-T2)`.

## T3 — FE dialog + wire

- `apps/web/src/components/profile/CoverUploadDialog.tsx` (NEW): clone AvatarUploadDialog shape; props `{ scope: "me" | "project", projectSlug?: string, onSuccess?: () => void }`. Submit calls correct endpoint based on scope. 4 MB cap client-side + mime check.
- `apps/web/src/queries/auth.ts` — extend `useUpdateMyCover` mutation. Invalidates `authKeys.me`.
- `apps/web/src/queries/projects.ts` — add `useUploadProjectCover(slug)`. Invalidates `["projects", slug]`.
- `apps/web/src/pages/ProfilePage.tsx`:
  - Header section: if `me.coverUrl` set → render `<img src={coverUrl} alt="" class="absolute inset-0 size-full object-cover" />` + `<div class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />` overlay. Else giữ gradient.
  - "Đổi ảnh bìa" button thay `placeholderToast` bằng `setCoverDialogOpen(true)`. Render `<CoverUploadDialog scope="me" />`.
- `apps/web/src/components/projects/ProjectHero.tsx`:
  - Prop `coverUrl?: string | null` (added qua ProjectLandingPage truyền xuống).
  - Khi set: thay `GradientHero` bg bằng `<img>` + overlay; blobs render trên cùng. Khi null: giữ `GradientHero` hiện tại.
  - Admin button "Đổi ảnh bìa" trong cluster actions (mirror existing "Edit project" pattern).
- Tests:
  - Extend `ProfilePage.test.tsx` — 2 cases (cover render khi set + empty state khi null).
  - Extend `ProjectLandingPage.test.tsx` — 1 case (hero cover render).
  - New `CoverUploadDialog.test.tsx` — 2 cases (open + invalid mime rejection).
- DoD: web test ≥ 188 green; commit `feat(web): CoverUploadDialog + ProfilePage/ProjectHero cover render (US-019 / T3)`.
