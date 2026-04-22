---
version: 0.1
last-updated: 2026-04-22
target: .specs/api-surface.md
required_sections:
  - Metadata
  - Request schema
  - Response (success)
  - Response (errors)
  - Error codes
  - Maps FR
---

# API Contract — <Method> <Path>

<!-- template: 02-api-contract-template.md@0.1 -->

## Metadata

- **Method**: `GET` | `POST` | `PUT` | `PATCH` | `DELETE`
- **Path**: `/api/v1/<...>`
- **Auth**: ❌ none · 🔐 session required · 👑 admin role required
- **Content-Type**: `application/json` | `multipart/form-data`
- **Idempotent**: yes | no
- **Rate limit**: <N req/min/user or none>

## Request schema

### Path params

| Name | Type | Notes |
|---|---|---|
| `<name>` | `uuid` / `string` / ... | <constraint regex, length> |

### Query params

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | `string` | yes | 1-200 chars |

### Body (Zod shape)

```ts
{
  field: z.string().min(1).max(60),
  ...
}
```

## Response (success)

**Status**: `200` | `201` | `204`

**Body** (nếu có):

```ts
{
  data: {
    // shape
  }
}
```

## Response (errors)

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod parse fail |
| 401 | `UNAUTHENTICATED` | Không session |
| 403 | `FORBIDDEN` | Thiếu role |
| 404 | `<RESOURCE>_NOT_FOUND` | Không tồn tại |
| 409 | `<RESOURCE>_<CONFLICT>` | Duplicate / conflict |

Full error code definitions: [.specs/error-codes.md](../.specs/error-codes.md).

## Error codes

New error codes introduced by endpoint (nếu có) → **phải add vào [error-codes.md](../.specs/error-codes.md) trong cùng PR**:

- `<NEW_CODE>` — HTTP <status> — <when>.

## Maps FR

- [FR-XXX-NNN](../.specs/02-requirements.md#fr-xxx-nnn) — <relation>

## Implementation

- **Task**: [T-N](../.specs/stories/US-NNN/tasks.md#t-n)
- **Route file**: `apps/api/src/routes/<name>.ts`
- **Service**: `apps/api/src/services/<name>.ts`
- **Repo**: `apps/api/src/repos/<name>Repo.ts`
