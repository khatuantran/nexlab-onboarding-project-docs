# API Surface — MVP v1

<!-- exempt: registry (no template required) · per-endpoint blocks follow templates/02-api-contract-template.md shape in aggregate form -->

_Last updated: 2026-04-23 · Source of truth for all HTTP endpoints của `apps/api`._

Base URL dev: `http://localhost:3001/api/v1`
Cookie: `sid` (httpOnly, sameSite=lax, secure trong prod).
Request/Response content type: `application/json` (trừ `/features/:id/uploads` dùng `multipart/form-data`).

**Rule**: mỗi endpoint mới **must** được thêm vào bảng này cùng commit với route code.

---

## Endpoint catalog

Ký hiệu **Auth**: ❌ không yêu cầu · 🔐 session required · 👑 admin role required.

### Health

| Method | Path      | Auth | Request | Response (200)                                                                   | FR    | Task                                                                        |
| ------ | --------- | ---- | ------- | -------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| GET    | `/health` | ❌   | —       | `{ status: "ok"\|"degraded", db: "ok"\|"error", redis: "ok"\|"error", version }` | infra | [T2 ✅ `829a51a`](stories/US-001/tasks.md#t2--docker-compose--api-skeleton) |

### Auth

| Method | Path           | Auth | Request               | Response                                    | Errors                                                                | FR                                                                | Task                                                                 |
| ------ | -------------- | ---- | --------------------- | ------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| POST   | `/auth/login`  | ❌   | `{ email, password }` | 200 `{ data: { user } }` + Set-Cookie `sid` | 401 `INVALID_CREDENTIALS`; 429 `RATE_LIMITED`; 400 `VALIDATION_ERROR` | [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth) | [T6](stories/US-001/tasks.md#t6--auth-endpoints--session-middleware) |
| POST   | `/auth/logout` | 🔐   | —                     | 204 + clear cookie                          | —                                                                     | FR-AUTH-001                                                       | T6                                                                   |
| GET    | `/auth/me`     | 🔐   | —                     | 200 `{ data: { user } }`                    | 401 `UNAUTHENTICATED`                                                 | FR-AUTH-001                                                       | T6                                                                   |

### Users (admin invite)

| Method | Path              | Auth | Request                                                   | Response                                                                                                         | Errors                                                   | FR                                                                | Task                                                                        |
| ------ | ----------------- | ---- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/users`          | 👑   | `{ email, displayName, role }`                            | 201 `{ data: { user, temporaryPassword } }`                                                                      | 403 `FORBIDDEN`; 409 email-taken; 400 `VALIDATION_ERROR` | FR-AUTH-001                                                       | US-002 task (TBD)                                                           |
| GET    | `/users?q=&role=` | 🔐   | query `q?` ILIKE displayName, `role?` (`admin`\|`author`) | 200 `{ data: User[] }` (id, displayName, role; sort displayName asc; limit 50; **không** trả email/passwordHash) | 400 `VALIDATION_ERROR`                                   | [FR-USER-001](02-requirements.md#fr-user-001--user-list-endpoint) | [US-005 T5](stories/US-005/tasks.md#t5--get-users-endpoint--user-list-repo) |

### Projects

| Method | Path                      | Auth | Request                                  | Response                                                                           | Errors                                             | FR                                                                            | Task                                                                                                                                                            |
| ------ | ------------------------- | ---- | ---------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/projects`               | 🔐   | —                                        | 200 `{ data: ProjectSummary[] }` (non-archived, sorted updated-desc, featureCount) | —                                                  | [FR-PROJ-001](02-requirements.md#fr-proj-001--project-crud-minimal)           | [T2 ✅ `2939f56`](stories/US-004/tasks.md#t2--get-projects-list-api-loại-archived)                                                                              |
| POST   | `/projects`               | 👑   | `{ slug, name, description? }`           | 201 `{ data: Project }`                                                            | 403; 409 `PROJECT_SLUG_TAKEN`; 400                 | FR-PROJ-001                                                                   | [T2 ✅ `23f6c91`](stories/US-002/tasks.md#t2--project-create-api--admin-gate)                                                                                   |
| GET    | `/projects/:slug`         | 🔐   | —                                        | 200 `{ data: { project, features: FeatureListItem[] } }`                           | 404 `PROJECT_NOT_FOUND` (incl. archived)           | [FR-READ-001](02-requirements.md#fr-read-001--project-landing--feature-index) | [T7 ✅ `9af2fe1`](stories/US-001/tasks.md#t7--read-api--search-api); archived filter [T3 ✅ `3ae766f`](stories/US-004/tasks.md#t3--project-patch--archive-apis) |
| PATCH  | `/projects/:slug`         | 👑   | `{ name, description? }` (slug stripped) | 200 `{ data: Project }`                                                            | 403; 404 `PROJECT_NOT_FOUND` (incl. archived); 400 | [FR-PROJ-002](02-requirements.md#fr-proj-002--project-metadata-edit--archive) | [T3 ✅ `3ae766f`](stories/US-004/tasks.md#t3--project-patch--archive-apis)                                                                                      |
| POST   | `/projects/:slug/archive` | 👑   | —                                        | 204 (idempotent)                                                                   | 403; 404 `PROJECT_NOT_FOUND`                       | FR-PROJ-002                                                                   | [T3 ✅ `3ae766f`](stories/US-004/tasks.md#t3--project-patch--archive-apis)                                                                                      |

### Features

| Method | Path                                    | Auth | Request             | Response                                                    | Errors                                                 | FR                                                                         | Task                                                                              |
| ------ | --------------------------------------- | ---- | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/projects/:slug/features`              | 🔐   | `{ slug, title }`   | 201 `{ data: Feature }` (5 sections auto-init empty)        | 404 `PROJECT_NOT_FOUND`; 409 `FEATURE_SLUG_TAKEN`; 400 | [FR-FEAT-001](02-requirements.md#fr-feat-001--feature-crud-within-project) | [T3 ✅ `4869a68`](stories/US-002/tasks.md#t3--feature-create-api--5-section-init) |
| GET    | `/projects/:slug/features/:featureSlug` | 🔐   | —                   | 200 `{ data: { feature, sections: Section[5] } }` (ordered) | 404 `FEATURE_NOT_FOUND`                                | [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template)          | T7                                                                                |
| PATCH  | `/features/:id`                         | 🔐   | `{ title?, slug? }` | 200 `{ data: Feature }`                                     | 404; 409; 400                                          | FR-FEAT-001                                                                | US-002 task                                                                       |

### Sections

| Method | Path                           | Auth | Request                       | Response                | Errors                                                                                               | FR                                                                      | Task                                                                           |
| ------ | ------------------------------ | ---- | ----------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PUT    | `/features/:id/sections/:type` | 🔐   | `{ body: string }` (≤ 64 KiB) | 200 `{ data: Section }` | 404 `FEATURE_NOT_FOUND`; 400 `INVALID_SECTION_TYPE`; 413 `SECTION_TOO_LARGE`; 400 `VALIDATION_ERROR` | [FR-FEAT-003](02-requirements.md#fr-feat-003--per-section-multi-author) | [T5 ✅ `ddfb9ab`](stories/US-002/tasks.md#t5--section-put-api--413-validation) |

### Uploads

| Method | Path                    | Auth | Request          | Response                                                    | Errors                                                                      | FR                                                                              | Task                                                                       |
| ------ | ----------------------- | ---- | ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| POST   | `/features/:id/uploads` | 🔐   | multipart `file` | 201 `{ data: { id, url, sizeBytes, mimeType, createdAt } }` | 404 `FEATURE_NOT_FOUND`; 413 `FILE_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE` | [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots) | [T2 ✅ `b082416`](stories/US-003/tasks.md#t2--post-uploads-endpoint)       |
| GET    | `/uploads/:id`          | 🔐   | —                | 200 binary + `Content-Type`                                 | 404                                                                         | FR-UPLOAD-001                                                                   | [T3 ✅ `4690b8e`](stories/US-003/tasks.md#t3--get-uploads-id-static-serve) |

### Search

| Method | Path                                                                    | Auth | Request                                                                                                                                                         | Response                                                                                                                                                                                                                                                                       | Errors                                                                | FR                                                                                                                                                                                                                                                                                 | Task                                                                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/search?q=&projectSlug=&sectionTypes=&authorId=&updatedSince=&status=` | 🔐   | `q` (1-200 chars), `projectSlug?`, `sectionTypes?` (CSV trong 5 enum), `authorId?` (UUID), `updatedSince?` (ISO date), `status?` (`filled`\|`partial`\|`empty`) | **v2 (US-005, breaking)** 200 `{ data: { projects: ProjectHit[], features: FeatureHit[], sections: SectionHit[], authors: AuthorHit[], uploads: UploadHit[] } }` (≤5 hits/group, ranked desc); **v1 (US-001, deprecated cùng PR US-005)** 200 `{ data: SearchHit[] }` (top 20) | 400 `SEARCH_QUERY_EMPTY`, `SEARCH_QUERY_TOO_LONG`, `VALIDATION_ERROR` | [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search), [FR-SEARCH-002](02-requirements.md#fr-search-002--multi-entity-search), [FR-SEARCH-003](02-requirements.md#fr-search-003--search-filters), [FR-SEARCH-004](02-requirements.md#fr-search-004--query-semantics) | [US-001 T7](stories/US-001/tasks.md#t7--read-api--search-api), [US-005 T4](stories/US-005/tasks.md#t4--search-route-v2-with-filters), [US-006 T1-T5](stories/US-006/tasks.md) ✅ `648242b..adbdfa3` (v2.1 prefix + unaccent + fuzzy) |

---

## Response shape conventions

- **Success wrapper**: `{ data: T }` cho GET/POST/PUT/PATCH trả body. `204 No Content` cho action không có body.
- **Error wrapper**: `{ error: { code, message, details? } }`. Xem [error-codes.md](error-codes.md).
- **Pagination**: v1 không paginate (list size nhỏ). Thêm cursor-based khi cần.
- **Date**: ISO 8601 string UTC. VD `"2026-04-22T10:30:00.000Z"`.
- **IDs**: UUID v4.
- **Slugs**: lowercase kebab-case, 3-60 ký tự, regex `^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$`.

---

## Not yet in v1 (deferred)

- `DELETE /users/:id` (admin disable user)
- `DELETE /projects/:slug`, `DELETE /features/:id`
- `DELETE /uploads/:id`
- `GET /features/:id/history` (versioning)
- OpenAPI spec generation (xem [ADR-001 §2.3](adr/ADR-001-tech-stack.md))
