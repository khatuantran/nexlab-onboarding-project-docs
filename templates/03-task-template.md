---
version: 0.1
last-updated: 2026-04-22
target: .specs/stories/US-NNN/tasks.md (per-task block)
required_sections:
  - Metadata
  - Goal
  - TDD cycle
  - DoD checklist
  - Commit example
---

# T<N> — <Title>

<!-- template: 03-task-template.md@0.1 -->

## Metadata

- **Effort**: <2-4>h
- **FR covered**: [FR-XXX-NNN](../../02-requirements.md#fr-xxx-nnn)
- **AC covered (US-NNN)**: AC-<N>, AC-<M>
- **Deps**: T<N-1> (hoặc "none")
- **Parallel**: yes | no — <with which other tasks>

## Goal

<1-2 sentence: what's done when task complete. Must be observable.>

## TDD cycle

### Red

<Test file path + what test asserts>. Chạy → fail vì <expected reason>.

Example:
```ts
// apps/api/src/routes/<name>.test.ts
it('GET /<path> returns 200 with <shape>', async () => {
  const res = await request(app).get('/<path>');
  expect(res.status).toBe(200);
  expect(res.body.data).toMatchObject({ /* ... */ });
});
```

### Green

Implement tối thiểu để pass:

- `apps/<app>/src/<file>`: <what>.
- `apps/<app>/src/<file2>`: <what>.
- Wire route / mount middleware.

### Refactor

- Extract constants → shared.
- Tidy error handling.
- Verify tests vẫn xanh.

## DoD checklist

- [ ] Tests passing (`pnpm test`).
- [ ] `pnpm lint` + `pnpm typecheck` green.
- [ ] AC <N> có automated test.
- [ ] Spec files updated (api-surface / error-codes / traceability) nếu áp dụng.
- [ ] Commit landed on `main`.

## Commit example

```
<type>(<scope>): <subject> (US-NNN / T<N> / FR-XXX-NNN)
```

Example: `feat(api): session middleware with connect-redis (US-001 / T4 / FR-AUTH-001)`
