# Glossary

Thuật ngữ nội bộ. Khi thêm term mới, **update ở đây đầu tiên** — các doc khác link về.

---

## Core domain

- **Project** — Một dự án phần mềm của công ty. Container cấp cao nhất của Feature Catalog.
- **Feature** — Một tính năng end-user thuộc 1 Project. Đơn vị cơ bản của catalog. (VD: "Đăng nhập bằng email", "Xuất báo cáo Excel".)
- **Feature Catalog** — Toàn bộ Feature của 1 Project, có cấu trúc, có search.
- **Section** — Một trong 5 phần cố định của Feature:
  1. `business` — mô tả nghiệp vụ
  2. `user-flow` — luồng người dùng
  3. `business-rules` — rule nghiệp vụ
  4. `tech-notes` — ghi chú kỹ thuật
  5. `screenshots` — hình ảnh minh họa
- **Section owner** — Role được kỳ vọng chính là người viết section đó:
  - BA/PM ⇒ `business`, `user-flow`, `business-rules`
  - Dev ⇒ `tech-notes`
  - Cả hai ⇒ `screenshots`
- **Embed** — Link ngoài (Jira ticket, Figma frame, GitHub PR/commit) được render thành preview card trong section.

---

## Roles

- **Reader** — Người đọc catalog. Persona chính v1 là Developer mới.
- **Author** — Người viết / cập nhật Feature.
  - **Business author** — BA / PM / PO.
  - **Tech author** — Senior Dev / Tech Lead.
- **Admin** (v1 minimal) — Người tạo Project và quản lý thành viên cơ bản.

---

## Process

- **Onboarding path** — Chuỗi bước/checklist dev mới đi qua trên portal. **KHÔNG có trong v1**, defer v2.
- **Pilot project** — Project đầu tiên dùng catalog để test sản phẩm trước khi rollout toàn công ty.

---

## Method

- **SDD — Spec-Driven Development** — Spec (vision → story → task) dẫn dắt code, không phải ngược lại.
- **EARS** — Easy Approach to Requirements Syntax. Format cho FR. Xem `02-requirements.md`.
- **ADR** — Architecture Decision Record. Lưu ở `adr/`.
- **TDD** — Test-Driven Development. Red → green → refactor.

---

## Not in v1 (ghi ở đây để tránh lẫn lộn trong thảo luận)

- **AI Q&A / RAG** — v2+.
- **Real-time collaboration** — out of scope.
- **Versioning / diff / comments** — out of scope v1.
- **Permissions fine-grained** — v1 chỉ login/logout, mọi user đều đọc/ghi được feature.
