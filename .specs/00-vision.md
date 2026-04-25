# Vision — Onboarding Doc Portal (MVP v1)

<!-- template: 00-vision-template.md@0.1 -->

_Last updated: 2026-04-22 · Author: @khatuantran11_

---

## 1. Problem

Tại công ty vừa (20-100 dev, 3-10 project, 2-5 dev mới/tháng), **dev mới mất nhiều tuần** để hiểu các dự án vì:

- Nghiệp vụ business phức tạp, đặc thù công ty.
- Tài liệu rải rác (Confluence / Google Docs / Slack / code repo) hoặc không có.
- Không có người mentor 1-1 ổn định (senior bận).
- Mỗi project có pattern khác nhau, khó chuyển ngữ cảnh.

**Hệ quả**: dev mới chậm productive; senior tốn thời gian trả lời câu hỏi lặp; chất lượng code onboarding thấp.

---

## 2. Solution (MVP v1)

**Feature Catalog theo project** — một portal nội bộ nơi mỗi project có danh mục tính năng, mỗi tính năng được mô tả theo **template 5 section** chuẩn hóa:

| #   | Section                      | Owner  | Mục đích                                      |
| --- | ---------------------------- | ------ | --------------------------------------------- |
| 1   | `business` — mô tả nghiệp vụ | BA/PM  | Tính năng làm gì, dành cho ai, vì sao tồn tại |
| 2   | `user-flow`                  | BA/PM  | Luồng người dùng step-by-step                 |
| 3   | `business-rules`             | BA/PM  | Validation, điều kiện, edge case              |
| 4   | `tech-notes`                 | Dev    | API, schema, dependency, gotcha, link code/PR |
| 5   | `screenshots`                | cả hai | Hình ảnh minh họa (upload hoặc embed Figma)   |

- Multi-author: BA/PM owner business sections; Dev owner tech section.
- Hỗ trợ **embed link** ra Jira / Figma / GitHub (preview card), không sync 2 chiều.

---

## 3. Users

| Vai trò                    | Mô tả                                 | Vị trí v1                     |
| -------------------------- | ------------------------------------- | ----------------------------- |
| **Developer mới**          | FE/BE/Fullstack, 0-4 tuần tại công ty | **Primary reader**            |
| **BA / PM / PO**           | Chủ nghiệp vụ của project             | **Primary author (business)** |
| **Senior dev / Tech Lead** | Chủ kiến trúc của project             | **Author (tech)**             |
| Tester / Designer / BA mới | Role phụ                              | v2+ (chưa phục vụ v1)         |

Chi tiết xem [01-personas.md](01-personas.md).

---

## 4. Goals (MVP v1)

- **G1**: Dev mới tìm và đọc toàn bộ tính năng của 1 project **trong 1 nơi duy nhất**.
- **G2**: Template 5-section giảm "câu hỏi lặp lại" cho senior ≥ 50%.
- **G3**: BA/PM viết và cập nhật feature doc **không cần dev unblock**.
- **G4**: Dev mới hiểu tính năng từ catalog **không cần mentor 1-1 buổi đầu**.

---

## 5. Non-goals (v1)

- ❌ AI Q&A / chatbot trên docs (→ v2).
- ❌ Real-time collaborative editing (Google-Docs-style).
- ❌ Native mobile app (iOS/Android). Responsive web là đủ.
- ❌ SSO / LDAP / phân quyền fine-grained theo role/project/section.
- ❌ Sync 2 chiều với Jira / Confluence / Notion.
- ❌ Versioning / diff viewer.
- ❌ Comment / review / approval workflow.

---

## 6. Constraints

- **Team**: Solo developer.
- **Timeline**: 2-3 tháng, side project (ngoài giờ).
- **Budget**: Gần zero → ưu tiên managed/free tier.
- **Tech stack (owner-chosen)**:
  - FE: React + Tailwind + shadcn/ui
  - BE: Express.js + PostgreSQL + Redis
  - Infra: Docker Compose (dev), K8s (prod — deferred v2)

---

## 7. Success metric (placeholder — sẽ chốt ở M3 pilot launch)

- **Quantitative**: ≥ 80% dev mới thuộc project pilot hoàn thành "read catalog checklist" trong tuần đầu.
- **Qualitative**: Khảo sát dev mới sau tuần 2 — câu "Tài liệu đủ để bắt đầu tự tin" đạt ≥ 4/5.
- **Leading indicator** (trong khi build): 1 project pilot có ≥ 10 feature với đầy đủ 5 section được author bởi BA+Dev.

> ⚠️ **Placeholder**: metric chính thức (baseline + measurement plan) chưa chốt. Sẽ validate + tinh chỉnh khi lên milestone **M3 Pilot** (xem [roadmap.md](roadmap.md)). Không gate release MVP v1 bằng metric này.

---

## 8. Open questions

Lịch sử câu hỏi và trạng thái (chi tiết resolution xem [02-requirements.md §Open questions](02-requirements.md#open-questions)):

| Q                                  | Trạng thái                                  | Pointer                                        |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Định nghĩa "Feature" (granularity) | ✅ Resolved                                 | [glossary.md](glossary.md)                     |
| Ai tạo user đầu tiên               | ✅ Resolved 2026-04-22                      | Seed admin → admin invite; xem FR-AUTH-001     |
| Project access model               | ✅ Resolved 2026-04-22                      | All authenticated full access; xem FR-PROJ-001 |
| Screenshot upload                  | ✅ Resolved 2026-04-22                      | Multipart → Docker volume; xem FR-UPLOAD-001   |
| US-001 scope                       | ✅ Resolved 2026-04-22                      | Landing + search + read trong 1 story          |
| Draft/publish state                | 🟡 Defer sau pilot feedback                 | —                                              |
| Role "viewer-only"                 | 🟡 Defer; v1 mọi authenticated user đọc/ghi | —                                              |
| Session TTL                        | 🟡 Default 7d sliding, revisit sau pilot    | [02-requirements.md](02-requirements.md)       |

---

## 9. Related docs

- [Personas](01-personas.md)
- [Requirements](02-requirements.md) — FRs (EARS) + NFRs
- [Architecture](03-architecture.md)
- [ADR-001 — Tech Stack](adr/ADR-001-tech-stack.md)
- [Glossary](glossary.md)
- [Roadmap](roadmap.md)
- [Traceability matrix](traceability.md)
- [User stories](stories/) — US-001, US-002, US-003
