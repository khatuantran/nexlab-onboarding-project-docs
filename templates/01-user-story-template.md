---
version: 0.2
last-updated: 2026-04-22
target: .specs/stories/US-NNN.md
metadata_format: bullet-top | heading
additional_sections_allowed: true
required_sections:
  - Metadata
  - User perspective
  - Scope in
  - Scope out
  - Acceptance criteria
  - UX notes
  - Dependencies
  - Downstream consumers
  - Risks & open items
  - Test plan
  - Tasks
---

# US-<NNN> — <short title>

<!-- template: 01-user-story-template.md@0.2 -->

## Metadata

Metadata có thể dạng **bullet-top** (ngay sau title, không có heading) HOẶC **`## Metadata` heading**. Chọn 1, consistent trong file. Cả 2 đều hợp lệ từ v0.2.

- **Status**: Draft | Ready | In Progress | Done
- **Priority**: P0 | P1 | P2
- **Persona**: [<P-name>](../01-personas.md#<anchor>)
- **Maps to FRs**: [FR-XXX-NNN](../02-requirements.md#fr-xxx-nnn), ...
- **Estimated effort**: <X-Y> hours (solo, TDD pace)
- **Last updated**: <YYYY-MM-DD>

> **Additional sections**: cho phép thêm section tuỳ ý (VD "Why this story first?", "Justification") giữa required sections, miễn required sections xuất hiện đủ và đúng thứ tự tương đối.

---

## User perspective

> As a **<role>**, I want **<capability>**, so that **<benefit>**.

## Scope in

- <bullet>

## Scope out

- <bullet>

## Acceptance criteria

### AC-1 — <short name>

**Given** <precondition>
**When** <action>
**Then** <outcome>
**And** <additional>

### AC-2 — ...

## UX notes

<Wire-level description. Reference UI spec file nếu có.>

## Dependencies

- <Upstream US / seed data / infra>

## Downstream consumers

- <Stories / features depend on this>

## Risks & open items

- <Known risk / decision still open>

## Test plan

- **Unit**: <scope>
- **Integration**: <scope>
- **E2E**: <scope — smoke test description>

## Tasks

Break down chi tiết: [US-<NNN>/tasks.md](US-<NNN>/tasks.md).
