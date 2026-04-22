# ADR-NNN — <Decision title>

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
- **Date**: YYYY-MM-DD
- **Deciders**: @<github-handle> (...)
- **Supersedes**: — | ADR-XXX
- **Related**: [Vision](../00-vision.md), [Requirements](../02-requirements.md), [...]

---

## 1. Context

Mô tả vấn đề cần quyết định. Bao gồm:
- Constraint hiện tại (team size, timeline, budget, scale mục tiêu).
- Tại sao phải quyết **bây giờ** (không defer).
- Option space — có bao nhiêu hướng đi hợp lý.

Viết đủ để 6 tháng sau đọc lại hiểu ngay, không cần context chat.

---

## 2. Decision

Nêu rõ quyết định — 1-2 dòng ngắn gọn, in đậm nếu có thể.

**Decision**: <chọn cái gì>.

### 2.1 Sub-decisions (nếu có)

Nếu ADR cover nhiều layer (stack, tool, pattern), dùng sub-section 2.x cho từng layer + bảng.

| Concern | Choice | Lý do ngắn |
|---|---|---|
| ... | ... | ... |

---

## 3. Alternatives considered

| Option | Pros | Cons | Lý do không chọn |
|---|---|---|---|
| ... | ... | ... | ... |

Tối thiểu 2 alternative. "Chỉ có 1 lựa chọn" thường là chưa nghĩ đủ.

---

## 4. Consequences

### Positive
- ...

### Negative / trade-off
- ...

### Neutral
- ...

---

## 5. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ... | High/Medium/Low | ... |

---

## 6. Validation criteria (khi nào revisit ADR này?)

Tạo ADR-<N+1> + supersede nếu:

- Điều kiện 1 (VD "scale > X").
- Điều kiện 2.
- ...

---

## 7. References

- Link docs, RFC, benchmark, blog post.
- Internal: link vision, FR, US liên quan.

---

## Usage note

Khi tạo ADR mới:
1. Copy file này → `ADR-NNN-<kebab-title>.md` (NNN chuỗi số tăng dần).
2. Điền tất cả section. Nếu section không áp dụng, giữ heading + viết "N/A" + lý do ngắn.
3. Thêm row vào bảng ADR Index ở [03-architecture.md §7](../03-architecture.md#7-adr-index).
4. Commit message: `docs(spec): ADR-NNN <title> (ADR-NNN)`.
