# API Surface — MVP v1

*Last updated: 2026-04-22 · Source of truth for all HTTP endpoints của `apps/api`.*

Base URL dev: `http://localhost:3001/api/v1`
Cookie: `sid` (httpOnly, sameSite=lax, secure trong prod).
Request/Response content type: `application/json` (trừ `/features/:id/uploads` dùng `multipart/form-data`).

**Rule**: mỗi endpoint mới **must** được thêm vào bảng này cùng commit với route code.

---

## Endpoint catalog

Ký hiệu **Auth**: ❌ không yêu cầu · 🔐 session required · 👑 admin role required.

### Health

| Method | Path | Auth | Request | Response (200) | FR | Task |
|---|---|---|---|---|---|---|
| GET | `/health` | ❌ | — | `{ status, db, redis, version }` | infra | [T2](stories/US-001/tasks.md#t2--docker-compose--api-skeleton) |

### Auth

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| POST | `/auth/login` | ❌ | `{ email, password }` | 200 `{ data: { user } }` + Set-Cookie `sid` | 401 `INVALID_CREDENTIALS`; 429 `RATE_LIMITED`; 400 `VALIDATION_ERROR` | [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth) | [T4](stories/US-001/tasks.md#t4--auth-endpoints--session-middleware) |
| POST | `/auth/logout` | 🔐 | — | 204 + clear cookie | — | FR-AUTH-001 | T4 |
| GET | `/auth/me` | 🔐 | — | 200 `{ data: { user } }` | 401 `UNAUTHENTICATED` | FR-AUTH-001 | T4 |

### Users (admin invite)

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| POST | `/users` | 👑 | `{ email, displayName, role }` | 201 `{ data: { user, temporaryPassword } }` | 403 `FORBIDDEN`; 409 email-taken; 400 `VALIDATION_ERROR` | FR-AUTH-001 | US-002 task (TBD) |

### Projects

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| GET | `/projects` | 🔐 | — | 200 `{ data: Project[] }` (sorted updated-desc) | — | [FR-PROJ-001](02-requirements.md#fr-proj-001--project-crud-minimal) | T5 |
| POST | `/projects` | 👑 | `{ slug, name, description? }` | 201 `{ data: Project }` | 403; 409 `PROJECT_SLUG_TAKEN`; 400 | FR-PROJ-001 | US-002 task |
| GET | `/projects/:slug` | 🔐 | — | 200 `{ data: { project, features: FeatureListItem[] } }` | 404 `PROJECT_NOT_FOUND` | [FR-READ-001](02-requirements.md#fr-read-001--project-landing--feature-index) | [T5](stories/US-001/tasks.md#t5--read-api--search-api) |

### Features

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| POST | `/projects/:slug/features` | 🔐 | `{ slug, title }` | 201 `{ data: Feature }` (5 sections auto-init empty) | 404 `PROJECT_NOT_FOUND`; 409 `FEATURE_SLUG_TAKEN`; 400 | [FR-FEAT-001](02-requirements.md#fr-feat-001--feature-crud-within-project) | US-002 task |
| GET | `/projects/:slug/features/:featureSlug` | 🔐 | — | 200 `{ data: { feature, sections: Section[5] } }` (ordered) | 404 `FEATURE_NOT_FOUND` | [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template) | T5 |
| PATCH | `/features/:id` | 🔐 | `{ title?, slug? }` | 200 `{ data: Feature }` | 404; 409; 400 | FR-FEAT-001 | US-002 task |

### Sections

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| PUT | `/features/:id/sections/:type` | 🔐 | `{ body: string }` (≤ 64 KiB) | 200 `{ data: Section }` | 404 `FEATURE_NOT_FOUND`; 400 `INVALID_SECTION_TYPE`; 413 `SECTION_TOO_LARGE`; 400 `VALIDATION_ERROR` | [FR-FEAT-003](02-requirements.md#fr-feat-003--per-section-multi-author) | US-002 task |

### Uploads

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| POST | `/features/:id/uploads` | 🔐 | multipart `file` | 201 `{ data: { id, url, sizeBytes, mimeType, createdAt } }` | 404 `FEATURE_NOT_FOUND`; 413 `FILE_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE` | [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots) | US-003 task |
| GET | `/uploads/:id` | 🔐 | — | 200 binary + `Content-Type` | 404 | FR-UPLOAD-001 | US-003 task |

### Search

| Method | Path | Auth | Request | Response | Errors | FR | Task |
|---|---|---|---|---|---|---|---|
| GET | `/search?q=&projectSlug=` | 🔐 | query `q` (1-200 chars), optional `projectSlug` | 200 `{ data: SearchHit[] }` (top 20) | 400 `SEARCH_QUERY_EMPTY`, `SEARCH_QUERY_TOO_LONG` | [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search) | T5 |

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

- `GET /users` (admin list users)
- `DELETE /users/:id` (admin disable user)
- `DELETE /projects/:slug`, `DELETE /features/:id`
- `DELETE /uploads/:id`
- `GET /features/:id/history` (versioning)
- OpenAPI spec generation (xem [ADR-001 §2.3](adr/ADR-001-tech-stack.md))
