---
version: 0.1
last-updated: 2026-04-22
target: .specs/changes/CR-NNN.md
required_sections:
  - Metadata
  - Summary
  - Motivation
  - Proposed change
  - Impact
  - Alternatives
  - Decision
  - Linked ADR
---

# CR-<NNN> — <short title>

<!-- template: 05-change-request-template.md@0.1 -->

## Metadata

- **Status**: Proposed | Under review | Approved | Rejected | Deferred
- **Requester**: @<handle>
- **Requested at**: <YYYY-MM-DD>
- **Decided at**: <YYYY-MM-DD> (fill when status changes from Proposed)
- **Deciders**: @<handle>, @<handle>
- **Scope**: spec-change | scope-change | tech-change | process-change

## Summary

<1-2 sentence: what changes, why now.>

## Motivation

<Context: trigger (user feedback, incident, business change). Why current state is insufficient.>

## Proposed change

<Concrete proposal. Files/specs/code areas affected. Before vs after.>

### Before

<current state>

### After

<proposed state>

## Impact

| Area         | Effect                                  |
| ------------ | --------------------------------------- |
| FRs          | <list of FRs added / changed / removed> |
| User stories | <affected US IDs>                       |
| Architecture | <ADR impact>                            |
| Code areas   | `<path>`, `<path>`                      |
| Migrations   | yes / no                                |
| Breaking?    | yes / no — <if yes, migration plan>     |
| Timeline     | <effort estimate>                       |

## Alternatives

| Option | Pros | Cons | Lý do không chọn |
| ------ | ---- | ---- | ---------------- |
| <A>    | ...  | ...  | ...              |
| <B>    | ...  | ...  | ...              |

## Decision

<Approved | Rejected | Deferred — rationale. If approved, link to implementation PR / task.>

## Linked ADR

<If architectural decision needed → create ADR-NNN, link here. Else N/A.>

- ADR: [ADR-<NNN>](../adr/ADR-<NNN>-<slug>.md)

## Traceability update

After decision, update [traceability.md](../traceability.md) nếu FR/US thay đổi.
