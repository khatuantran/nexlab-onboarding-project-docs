# Error Code Registry

<!-- exempt: registry (no template required) -->

*Last updated: 2026-04-22 · Source of truth for all API error codes.*

Mọi error response tuân theo format:

```json
{
  "error": {
    "code": "FEATURE_NOT_FOUND",
    "message": "Human-readable Vietnamese message",
    "details": { "...": "optional structured info" }
  }
}
```

**Rule**:
- `code` là **string stable**, SCREAMING_SNAKE_CASE, không bao giờ đổi giá trị sau khi land (chỉ add new, deprecate old).
- Định nghĩa chính thức ở `packages/shared/src/errors.ts` (Task T4) + reuse ở FE để map sang toast/UI copy.
- HTTP status mapping **must** consistent với bảng dưới.
- Khi thêm code mới: update bảng này **trước**, rồi implement.

---

## Canonical codes (v1 MVP)

| Code | HTTP | Meaning | Source FR | Introduced by task |
|---|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email OR wrong password (không phân biệt để chống user enumeration). | [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth) | T4 |
| `UNAUTHENTICATED` | 401 | Request không có session hợp lệ. Client nên redirect `/login`. | FR-AUTH-001 | T4 |
| `FORBIDDEN` | 403 | Authenticated nhưng thiếu quyền (VD non-admin tạo project). | [FR-PROJ-001](02-requirements.md#fr-proj-001--project-crud-minimal) | T4/T5 |
| `RATE_LIMITED` | 429 | Quá giới hạn req (chỉ `/auth/login` v1, 10/min/IP). | [NFR-SEC-001](02-requirements.md#nfr-sec-001--security-baseline) | T4 |
| `PROJECT_NOT_FOUND` | 404 | Slug project không tồn tại. | FR-PROJ-001 | T5 |
| `PROJECT_SLUG_TAKEN` | 409 | Duplicate slug khi tạo project. | FR-PROJ-001 | T5 (US-002) |
| `FEATURE_NOT_FOUND` | 404 | Slug feature không tồn tại trong project. | [FR-FEAT-001](02-requirements.md#fr-feat-001--feature-crud-within-project) | T5 |
| `FEATURE_SLUG_TAKEN` | 409 | Duplicate feature slug trong cùng project. | FR-FEAT-001 | T5 (US-002) |
| `INVALID_SECTION_TYPE` | 400 | Section type ngoài 5 enum. | [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template) | T5 (US-002) |
| `SECTION_TOO_LARGE` | 413 | Section body > 64 KiB. | FR-FEAT-002 | T5 (US-002) |
| `SEARCH_QUERY_EMPTY` | 400 | Search query rỗng hoặc chỉ whitespace. | [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search) | T5 |
| `SEARCH_QUERY_TOO_LONG` | 400 | Search query > 200 chars. | FR-SEARCH-001 | T5 |
| `FILE_TOO_LARGE` | 413 | Upload > 5 MiB. | [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots) | T5 (US-003) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Upload MIME ngoài `image/png`, `image/jpeg`, `image/webp`. | FR-UPLOAD-001 | T5 (US-003) |
| `VALIDATION_ERROR` | 400 | Zod parse fail. `details.issues` chứa ZodIssue[]. | cross-cutting | T2 |
| `INTERNAL_ERROR` | 500 | Unexpected exception. `details` không leak stack. | cross-cutting | T2 |

---

## Client-side mapping (recommended)

FE `apps/web/src/lib/errorMessages.ts` map code → Vietnamese toast/inline:

| Code | Vietnamese copy (mẫu) |
|---|---|
| `INVALID_CREDENTIALS` | "Email hoặc mật khẩu không đúng" |
| `UNAUTHENTICATED` | (silent, redirect /login) |
| `FORBIDDEN` | "Bạn không có quyền thực hiện thao tác này" |
| `RATE_LIMITED` | "Thử lại sau vài phút" |
| `PROJECT_NOT_FOUND` / `FEATURE_NOT_FOUND` | "Không tìm thấy" |
| `PROJECT_SLUG_TAKEN` / `FEATURE_SLUG_TAKEN` | "Slug đã được dùng, chọn slug khác" |
| `SECTION_TOO_LARGE` | "Nội dung section quá lớn (>64 KiB)" |
| `SEARCH_QUERY_EMPTY` | "Nhập từ khoá để tìm" |
| `FILE_TOO_LARGE` | "File quá lớn (max 5 MiB)" |
| `UNSUPPORTED_MEDIA_TYPE` | "Chỉ chấp nhận png, jpg, webp" |
| `VALIDATION_ERROR` | map theo `details.issues[].path` + `message` |
| default / `INTERNAL_ERROR` | "Có lỗi xảy ra, thử lại" |

---

## Deprecated / removed

*(Trống — v1 chưa có code nào bị deprecate.)*

Khi deprecate: giữ row trên bảng, thêm cột "Replaced by" + "Removed at commit".
