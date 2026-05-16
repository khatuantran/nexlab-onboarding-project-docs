# Bugs

<!-- exempt: registry (no template required) -->

_Last updated: 2026-05-16 · Index of reported faults._

Mỗi file `BUG-NNN.md` clone từ [templates/05-bug-template.md](../../templates/05-bug-template.md). TDD rule: failing regression test commit trước fix.

Related: [CLAUDE.md §When a request comes in](../../CLAUDE.md#when-a-request-comes-in), [CLAUDE.md §SDD guardrail](../../CLAUDE.md#sdd-guardrail--flag-khi-user-đi-lệch-quy-trình).

---

## Items

| ID      | Title                                             | Severity  | Status | Fixed at  | File                     |
| ------- | ------------------------------------------------- | --------- | ------ | --------- | ------------------------ |
| BUG-001 | `pnpm docker:*` scripts không load `.env.local`   | 🟡 Medium | Fixed  | `908c37e` | [BUG-001.md](BUG-001.md) |
| BUG-002 | Theme toggle cần 2 click để chuyển dark → light   | 🟡 Medium | Fixed  | `51d0543` | [BUG-002.md](BUG-002.md) |
| BUG-003 | Uploaded images render broken in production       | 🟠 High   | Fixed  | `db94afc` | [BUG-003.md](BUG-003.md) |
| BUG-004 | Overflow ⋯ menu đè lên ChevronRight ở ProjectCard | 🟢 Low    | Fixed  | `1adc157` | [BUG-004.md](BUG-004.md) |
| BUG-005 | Hero secondary text khó đọc trong dark mode       | 🟡 Medium | Open   | —         | [BUG-005.md](BUG-005.md) |

---

## Conventions

- **ID**: `BUG-001`, ... zero-padded 3 digits, never reuse.
- **Severity**: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.
- **Priority**: `P0` (ship blocker) · `P1` (this milestone) · `P2` (next milestone).
- **Status**: `Open` → `In Progress` → `Fixed` (commit hash filled) | `Wontfix` (kèm rationale).
- **Fixed at**: commit hash của fix commit (không phải test commit).

## Process

1. Bug report received → check nếu duplicate với row bên dưới. Nếu mới, clone template:  
   `cp templates/05-bug-template.md .specs/bugs/BUG-NNN.md`.
2. Fill Reproduction + Expected vs Actual + Scope. Status = `Open`.
3. **Viết failing regression test** tại `<path>.test.ts` reproduce bug. Commit: `test(<scope>): reproduce BUG-NNN`.
4. Fix code. Commit: `fix(<scope>): <subject> (BUG-NNN / US-NNN)`.
5. Update BUG-NNN.md: Status = `Fixed`, Fixed at commit = `<hash>`. Update row này.
6. Nếu bug khám phá từ prod incident → link INC-NNN trong §Related.
