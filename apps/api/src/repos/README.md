# `repos/` — Data access layer

**Convention**: each repo owns queries against a set of related tables. Drizzle queries only — no business rules, no HTTP.

```
repo.findX(id) → db.select()...where() → return row | null
```

**One file per aggregate root**: `userRepo.ts`, `projectRepo.ts`, `featureRepo.ts`, `searchRepo.ts`. Import `db` from `../db/client.js`, export async functions returning typed rows.

**Testing**: repos hit real Postgres ([TESTING.md §Integration](../../../../docs/TESTING.md) — real containers, not mocks). Factory helpers live in `apps/api/tests/lib/factories.ts`.

Empty ở T3 (scaffold). First real repo lands ở [T6](../../../.specs/stories/US-001/tasks.md#t6--auth-endpoints--session-middleware) (`userRepo`).
