# Backlog

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · Index of deferred ideas / FR candidates / tech-debt._

Mỗi file `BL-NNN.md` clone từ [templates/06-backlog-item-template.md](../../templates/06-backlog-item-template.md). Khi item đạt promotion criteria → graduate thành `US-NNN.md` (clone `01-user-story-template.md`) + update row bên dưới (Status → Promoted, link sang US).

Related: [CLAUDE.md §When a request comes in](../../CLAUDE.md#when-a-request-comes-in).

---

## Items

| ID     | Title                                     | Priority | Status  | Last activity | File                   |
| ------ | ----------------------------------------- | -------- | ------- | ------------- | ---------------------- |
| BL-001 | Project repo URL + Feature PR URL linking | P0       | Triaged | 2026-05-16    | [BL-001.md](BL-001.md) |
| BL-002 | Profile skills CRUD                       | P2       | Triaged | 2026-05-16    | [BL-002.md](BL-002.md) |

---

## Conventions

- **ID**: `BL-001`, `BL-002`, ... zero-padded 3 digits, never reuse.
- **Priority**: `P0` do next · `P1` do this milestone · `P2` nice to have · `P3` one day.
- **Status**: `Proposed` (draft, not triaged) → `Triaged` (priority set) → `Promoted` (→ US-NNN) | `Rejected` | `Deferred`.
- **Review cadence**: weekly solo triage; each milestone boundary re-prioritize.
- **Promotion**: khi Status = Promoted, giữ row + fill link US. Không xóa — audit trail.

## Process

1. AI hoặc user thấy idea/feature chưa fit current sprint → `cp templates/06-backlog-item-template.md .specs/backlog/BL-NNN.md`.
2. Fill Metadata + Summary + Motivation. Status = `Proposed`.
3. Triage meeting (hoặc solo review): set Priority + Target milestone. Status = `Triaged`.
4. Khi promote: tạo `.specs/stories/US-NNN.md`, fill Promotion criteria ✓, Status = `Promoted`.
