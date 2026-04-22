---
version: 0.1
last-updated: 2026-04-22
target: .specs/bugs/BUG-NNN.md
required_sections:
  - Metadata
  - Reproduction
  - Expected vs Actual
  - Scope
  - Root cause
  - Fix approach
  - Regression test
  - Related FR/US
---

# BUG-<NNN> — <short title>

<!-- template: 05-bug-template.md@0.1 -->

## Metadata

- **Severity**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
- **Priority**: P0 | P1 | P2
- **Status**: Open | In Progress | Fixed | Wontfix
- **Reported by**: @<handle>
- **Reported at**: <YYYY-MM-DD>
- **Fixed at commit**: <hash> (fill when fixed)
- **Environment**: dev | staging | prod | all

## Reproduction

Steps tối thiểu để reproduce:

1. <Step>
2. <Step>
3. <Step>

**Prerequisites**: <seed data, browser, user role>

**Frequency**: always | intermittent (<N>/<M>) | once

## Expected vs Actual

- **Expected**: <what should happen per spec>
- **Actual**: <what happens now>
- **Spec reference**: [FR-XXX-NNN](../02-requirements.md#fr-xxx-nnn) hoặc [US-NNN AC-<N>](../stories/US-NNN.md)

## Scope

- **Affected files**: `<path>` (from debugging)
- **Affected users**: <role / count>
- **Data corruption**: yes/no — <if yes, backfill required>
- **Rollback required**: yes/no

## Root cause

<Once identified. KHÔNG chỉ describe symptom — explain WHY.>

## Fix approach

<Technical approach. Alternatives considered. Why chosen one.>

- **Files to change**: `<path>`
- **Migration needed**: yes/no

## Regression test

**Rule (TDD)**: viết failing test reproduce bug TRƯỚC khi fix. Commit test riêng.

- **Test file**: `<path>.test.ts`
- **Test scenario**: <one-line description>

## Related FR / US

- [FR-XXX-NNN](../02-requirements.md#fr-xxx-nnn)
- [US-NNN](../stories/US-NNN.md) — AC-<N>

## Commit

`fix(<scope>): <subject> (BUG-<NNN> / US-NNN)`
