---
version: 0.1
last-updated: 2026-04-23
target: .specs/backlog/BL-NNN.md
required_sections:
  - Metadata
  - Summary
  - Motivation
  - Proposed scope
  - Acceptance hint
  - Dependencies
  - Promotion criteria
  - Decision log
---

# BL-<NNN> — <short title>

<!-- template: 06-backlog-item-template.md@0.1 -->

## Metadata

- **Status**: Proposed | Triaged | Promoted | Rejected | Deferred
- **Priority**: P0 (do next) | P1 (do this milestone) | P2 (nice to have) | P3 (one day)
- **Requester**: @<handle>
- **Requested at**: <YYYY-MM-DD>
- **Target milestone**: M2 | M3 | M4 | — (unscheduled)
- **Promoted to**: — | [US-NNN](../stories/US-NNN.md) (fill khi Status = Promoted)

## Summary

<1-2 câu: what + why. Format "As a <role>, I want <capability>, so that <benefit>" nếu đã rõ.>

## Motivation

<Context: ai đề xuất, trigger (user feedback, incident, retro, competitive gap). Pain point hiện tại là gì nếu không làm.>

## Proposed scope

**In scope** (nếu promote):

- <what>

**Out of scope**:

- <what intentionally excluded>

## Acceptance hint

Rough Given/When/Then — sẽ refine khi promote thành US đầy đủ:

- **Given** <context>, **When** <trigger>, **Then** <outcome>

## Dependencies

- **Blocked by**: <BL/US/FR/infra list>
- **Blocks**: <downstream items chờ BL này>

## Promotion criteria

Điều kiện để graduate BL-NNN thành [US-NNN.md](../stories/US-NNN.md) (clone `01-user-story-template.md`):

- [ ] <VD: pilot phase kết thúc, có ≥ 3 user confirm cần>
- [ ] <VD: effort estimate đã scope 2-8h>
- [ ] <VD: acceptance criteria chốt không còn TBD>

## Decision log

| Date         | Event    | Actor     | Notes                            |
| ------------ | -------- | --------- | -------------------------------- |
| <YYYY-MM-DD> | Proposed | @<handle> | initial idea                     |
| <YYYY-MM-DD> | Triaged  | @<handle> | priority set P<N>                |
| <YYYY-MM-DD> | Promoted | @<handle> | → [US-NNN](../stories/US-NNN.md) |
