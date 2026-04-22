# `services/` — Business logic layer

**Convention**: thin functions that orchestrate repos + enforce domain rules. No HTTP concerns (req/res) — those live in `routes/`. No direct SQL — delegate to `repos/`.

```
service(input) → validate business rules → repo(...) → map result → return
```

**One file per domain noun**: `userService.ts`, `projectService.ts`, etc. Import repos via relative path, export pure async functions.

**Error handling**: throw `HttpError` from `../errors.js` with a `ErrorCode` from `@onboarding/shared`. Route layer just lets errors bubble to the error middleware.

Empty ở T3 (scaffold). First real service lands ở [T6](../../../.specs/stories/US-001/tasks.md#t6--auth-endpoints--session-middleware) (auth) + [T7](../../../.specs/stories/US-001/tasks.md#t7--read-api--search-api) (feature read).
