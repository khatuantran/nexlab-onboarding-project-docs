# Change Requests

<!-- exempt: registry (no template required) -->

_Last updated: 2026-05-16 · Index of mid-milestone scope / spec / tech changes._

Mỗi file `CR-NNN.md` clone từ [templates/05-change-request-template.md](../../templates/05-change-request-template.md). Bắt buộc cho mọi thay đổi **scope, spec, tech choice** sau khi milestone đã bắt đầu (không phải cho fresh US hoặc bug fix).

Related: [CLAUDE.md §When a request comes in](../../CLAUDE.md#when-a-request-comes-in), [adr/](../adr/).

---

## Items

| ID     | Title                                                  | Scope       | Status                    | Decided at | File                   |
| ------ | ------------------------------------------------------ | ----------- | ------------------------- | ---------- | ---------------------- |
| CR-001 | Split monolithic `.env.local` into per-layer env files | tech-change | Approved (impl `bcf8512`) | 2026-04-23 | [CR-001.md](CR-001.md) |
| CR-002 | UI Quality Uplift v1 (5 screens)                       | spec-change | Approved (impl `a2b347d`) | 2026-04-25 | [CR-002.md](CR-002.md) |
| CR-003 | Free-tier pilot deployment (replace VPS path of M3)    | tech-change | Approved (impl pending)   | 2026-04-26 | [CR-003.md](CR-003.md) |
| CR-004 | Image storage: Fly volume → Cloudinary                 | tech-change | Approved (Phase 1 ship)   | 2026-05-14 | [CR-004.md](CR-004.md) |
| CR-005 | UI Quality Uplift v2 (patterns + multi-accent)         | spec-change | Rejected (rev `1b2f863`)  | 2026-05-16 | _deleted, superseded_  |
| CR-006 | UI Redesign: Notion warm + graphics-rich               | spec-change | Proposed                  | 2026-05-16 | [CR-006.md](CR-006.md) |

---

## Conventions

- **ID**: `CR-001`, ... zero-padded, never reuse.
- **Scope**: `spec-change` · `scope-change` · `tech-change` · `process-change`.
- **Status**: `Proposed` → `Under review` → `Approved` (ship) | `Rejected` | `Deferred` (re-evaluate next milestone).
- **Decision**: approved CR phải link tới implementation commit / PR trong §Decision.

## When to write a CR (vs khác)

| Situation                                          | Artifact                      |
| -------------------------------------------------- | ----------------------------- |
| Fresh feature chưa có spec                         | FR + US                       |
| Idea chưa sẵn sàng                                 | Backlog BL-NNN                |
| Bug báo cáo                                        | BUG-NNN                       |
| Scope / spec / tech thay đổi giữa chừng milestone  | **CR-NNN**                    |
| Architectural decision (có alternatives cần weigh) | ADR-NNN (CR có thể spawn ADR) |
| Prod sự cố                                         | INC-NNN                       |

## Process

1. Propose: `cp templates/05-change-request-template.md .specs/changes/CR-NNN.md`. Fill Summary + Motivation + Proposed change + Impact. Status = `Proposed`.
2. Review với user: discuss Alternatives, assess Impact matrix (FRs/US/Arch/Code/Migration/Timeline).
3. Decision: user approve/reject → update §Decision + Status. Nếu approved + architectural → spawn ADR-NNN.
4. Implement per normal SDD flow (update affected FR/US/tasks.md cùng PR).
5. Update row này với commit / PR link.
