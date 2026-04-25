---
version: 0.2
last-updated: 2026-04-22
target: .specs/adr/ADR-NNN-<slug>.md
metadata_format: bullet-top | heading
additional_sections_allowed: false
required_sections:
  - Metadata
  - Context
  - Decision
  - Alternatives considered
  - Consequences
  - Risks & mitigations
  - Validation criteria
  - References
---

# ADR-<NNN> — <Decision title>

<!-- template: 04-adr-template.md@0.2 -->

> Metadata có thể là bullet-top (ngay sau title) HOẶC `## Metadata` heading. Cả 2 hợp lệ từ v0.2.

## Metadata

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-<NNN>
- **Date**: <YYYY-MM-DD>
- **Deciders**: @<github-handle> (...)
- **Supersedes**: — | ADR-<NNN>
- **Related**: [Vision](../00-vision.md), [Requirements](../02-requirements.md), ...

---

## 1. Context

<Vấn đề cần quyết định. Bao gồm:>

- <Constraint hiện tại: team size, timeline, budget, scale target>
- <Tại sao phải quyết bây giờ, không defer>
- <Option space — bao nhiêu hướng đi hợp lý>

Viết đủ để 6 tháng sau đọc lại hiểu ngay, không cần context chat.

---

## 2. Decision

**Decision**: <chọn cái gì — 1-2 dòng in đậm>.

### 2.1 Sub-decisions (nếu nhiều layer)

| Concern | Choice   | Lý do ngắn  |
| ------- | -------- | ----------- |
| <area>  | <choice> | <rationale> |

---

## 3. Alternatives considered

| Option     | Pros | Cons | Lý do không chọn |
| ---------- | ---- | ---- | ---------------- |
| <Option A> | ...  | ...  | ...              |
| <Option B> | ...  | ...  | ...              |

Tối thiểu 2 alternative. "Chỉ có 1 lựa chọn" = chưa nghĩ đủ.

---

## 4. Consequences

### Positive

- <benefit>

### Negative / trade-off

- <cost>

### Neutral

- <ambiguous>

---

## 5. Risks & mitigations

| Risk   | Impact       | Mitigation |
| ------ | ------------ | ---------- |
| <risk> | High/Med/Low | <how>      |

---

## 6. Validation criteria

Tạo ADR-<N+1> + supersede nếu:

- <Condition 1>
- <Condition 2>

---

## 7. References

- <Link docs, RFC, benchmark>
- Internal: <Vision / FR / US liên quan>
