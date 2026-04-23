# Incidents

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-23 · Index of production incident post-mortems. Empty pre-M3 pilot launch._

Mỗi file `INC-NNN.md` clone từ [templates/06-incident-template.md](../../templates/06-incident-template.md). Post-mortem **must** được viết trong 48h sau resolution.

Related: [CLAUDE.md §When a request comes in](../../CLAUDE.md#when-a-request-comes-in), [bugs/](../bugs/).

---

## Items

| ID        | Title | Severity | Detected at | Duration | File |
| --------- | ----- | -------- | ----------- | -------- | ---- |
| _(empty)_ | —     | —        | —           | —        | —    |

---

## Conventions

- **ID**: `INC-001`, ... zero-padded, never reuse.
- **Severity**:
  - `SEV1` — full outage, data loss, security breach. All hands, 24h post-mortem.
  - `SEV2` — major degradation or a pilot project blocked. 48h post-mortem.
  - `SEV3` — minor, isolated, workaround exists. Post-mortem optional but encouraged.
- **Status**: `Detected` → `Mitigated` (user-facing restored) → `Resolved` (permanent fix shipped) → `Closed` (action items all done).
- **Duration**: detected → mitigated, phút/giờ. Ghi rõ trong Metadata.

## Process

1. **During incident**: focus on mitigation, not documentation. Cap nhật timeline ngắn gọn trong Slack/notes.
2. **Within 48h of resolution** (SLA): `cp templates/06-incident-template.md .specs/incidents/INC-NNN.md`. Fill từ timeline notes.
3. **Root cause** bằng 5-whys, không dừng ở symptom.
4. **Action items**: mỗi item phải có owner + due + tracking (BL / BUG / runbook PR). Không ghi action "to be considered" — specific + actionable.
5. **Blameless**: focus on process/system gaps, không cá nhân.
6. Update row này. Khi tất cả action items done → Status = `Closed`.

## Pre-M3 note

Chưa có prod deploy (M3 target 2026-07-31). Folder scaffold sẵn để khi pilot launch, flow đã có. Xem [roadmap.md §M3](../roadmap.md).
