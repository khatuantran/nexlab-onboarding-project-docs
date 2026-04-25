---
version: 0.1
last-updated: 2026-04-22
target: .specs/02-requirements.md
required_sections:
  - Format — EARS
  - FR summary table
  - Per-FR block
---

# Functional Requirements

<!-- template: 01-functional-requirements-template.md@0.1 -->

_Last updated: <YYYY-MM-DD>_

---

## Format — EARS

Mỗi FR viết theo EARS (Easy Approach to Requirements Syntax):

| Dạng         | Template                                                  |
| ------------ | --------------------------------------------------------- |
| Ubiquitous   | `The <system> shall <response>.`                          |
| Event-driven | `When <event>, the <system> shall <response>.`            |
| State-driven | `While <state>, the <system> shall <response>.`           |
| Optional     | `Where <feature present>, the <system> shall <response>.` |
| Unwanted     | `If <trigger>, then the <system> shall <response>.`       |
| Complex      | Kết hợp các dạng trên.                                    |

Mỗi FR có: **ID** · **Statement (EARS)** · **Rationale** · **Maps to** · **Acceptance hints**.

---

## FR summary table

| ID            | Area   | Summary    | Priority | Maps to      |
| ------------- | ------ | ---------- | -------- | ------------ |
| FR-<AREA>-001 | <area> | <one-line> | P0/P1    | <US/persona> |

---

## Per-FR block template

Copy block dưới cho mỗi FR mới:

### FR-<AREA>-NNN — <short title>

**Statement (<EARS type>):**

- <EARS sentence 1>.
- <EARS sentence 2 if multi-clause>.

**Rationale**: <1-2 câu vì sao cần FR này>.

**Maps to**: <US-NNN>, <US-NNN>. Personas: <P1/P2/P3>.

**Acceptance hints**:

- <hint 1 — tín hiệu viết test>
- <hint 2>
- <error code reference nếu có>
