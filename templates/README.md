# Templates Registry

*Last updated: 2026-04-22 · Source of truth for all SDD file templates.*

Mọi file trong `.specs/` **must** được clone từ template ở folder này. Xem [CLAUDE.md §Template Compliance Rules](../CLAUDE.md#template-compliance-rules).

---

## 1. Template registry

| Template | Version | Target location (pattern) | Required §2 headings |
|---|---|---|---|
| [00-vision-template.md](00-vision-template.md) | 0.1 | `.specs/00-vision.md` | Problem · Solution · Users · Goals · Non-goals · Constraints · Success metric · Open questions · Related docs |
| [01-functional-requirements-template.md](01-functional-requirements-template.md) | 0.1 | `.specs/02-requirements.md` §FRs | Format (EARS) · FR summary table · Per-FR block |
| [01-non-functional-requirements-template.md](01-non-functional-requirements-template.md) | 0.1 | `.specs/02-requirements.md` §NFRs | Per-NFR block (ID · Metric/threshold · Measurement · Rationale · Verification) |
| [01-user-story-template.md](01-user-story-template.md) | 0.1 | `.specs/stories/US-NNN.md` | Metadata · User perspective · Scope in · Scope out · Acceptance criteria · UX notes · Dependencies · Downstream consumers · Risks & open items · Test plan · Tasks |
| [02-api-contract-template.md](02-api-contract-template.md) | 0.1 | `.specs/api-surface.md` per-endpoint | Metadata (Method/Path/Auth) · Request schema · Response (success) · Response (errors) · Error codes · Maps FR |
| [02-data-model-template.md](02-data-model-template.md) | 0.1 | `.specs/03-architecture.md` §Domain model (per-entity) | Entity · Fields · Relationships · Invariants · Indexes · Migration notes |
| [02-ui-spec-template.md](02-ui-spec-template.md) | 0.1 | `.specs/ui/<screen>.md` | Screen · Route · State machine · Interactions · A11y · Wire-level · Error/empty/loading · Maps US |
| [03-task-template.md](03-task-template.md) | 0.1 | `.specs/stories/US-NNN/tasks.md` per-task | ID · Title · Effort · FR · Deps · Goal · TDD cycle · DoD checklist · Commit example |
| [04-adr-template.md](04-adr-template.md) | 0.1 | `.specs/adr/ADR-NNN-*.md` | Status/Date/Deciders/Supersedes/Related · Context · Decision · Alternatives · Consequences · Risks & mitigations · Validation criteria · References |
| [05-bug-template.md](05-bug-template.md) | 0.1 | `.specs/bugs/BUG-NNN.md` | Metadata · Reproduction · Expected vs Actual · Scope · Root cause · Fix approach · Regression test · Related FR/US |
| [05-change-request-template.md](05-change-request-template.md) | 0.1 | `.specs/changes/CR-NNN.md` | Metadata · Summary · Motivation · Proposed change · Impact · Alternatives · Decision · Linked ADR |

Không có template = không tạo file. Khi nhu cầu xuất hiện cho file type mới → tạo template mới trong PR cùng với spec file đầu tiên dùng nó.

---

## 2. Authoring procedure

Khi cần tạo file mới trong `.specs/`:

```bash
# 1. Clone template vào target location
cp templates/01-user-story-template.md .specs/stories/US-042.md

# 2. Replace placeholders <...> với nội dung thật
# 3. Giữ HTML comment template-ref ở dòng 2 (auto có sẵn từ template)
# 4. Fill frontmatter (Status, Priority, Last updated)
# 5. Save + stage
```

Trong Claude Code, AI dùng Read → template file → Write target file với cùng structure.

---

## 3. Pre-save validation (AI mandatory)

Trước MỖI `Write` / `Edit` vào `.specs/`:

1. **Read template** tương ứng từ `templates/`.
2. **Verify headings**: file mới có đủ tất cả `## <heading>` của template, đúng thứ tự.
3. **Verify placeholders**: mọi `<...>` / `TBD` còn lại phải cố ý (kèm note lý do).
4. **Verify frontmatter/metadata**: Status, Priority, Last updated... đúng format.
5. **Verify template-ref**: dòng `<!-- template: XX-*.md@version -->` match template version.

Fail → không Write, print diff vs template, hỏi user.

---

## 4. Deviation policy

- **KHÔNG** deviate im lặng, **KHÔNG** thêm/xóa required section tự chế.
- Khi template không fit:
  1. Viết proposal trong response: `Template change proposal: <diff> because <reason>`.
  2. Chờ user confirm.
  3. Update template file trước, bump version.
  4. Commit template change trước khi dùng.
  5. Migrate file cũ nếu breaking (xem §5).

---

## 5. Versioning policy

Frontmatter mỗi template:

```yaml
---
version: 0.1
last-updated: 2026-04-22
target: .specs/<path>/<pattern>.md
required_sections:
  - Section 1
  - Section 2
---
```

- **Minor bump** (`0.1` → `0.2`): thêm optional section, clarify hint, rewrite copy. Không cần migrate file cũ.
- **Breaking bump** (`0.1` → `1.0`): remove/rename required section, đổi frontmatter schema. Bắt buộc:
  1. Update tất cả file đang dùng template cũ **trong cùng PR**.
  2. Ghi CHANGELOG entry ở cuối file này (xem §6).

File spec record version đã dùng ở dòng 2:

```markdown
# <Title>
<!-- template: 01-user-story-template.md@0.1 -->
```

Pre-save check verify version match (newer-compatible OK).

---

## 6. CHANGELOG

| Date | Template | Version | Change |
|---|---|---|---|
| 2026-04-22 | all | 0.1 | Initial scaffold (11 templates + registry). |

Thêm row khi bump version template.
