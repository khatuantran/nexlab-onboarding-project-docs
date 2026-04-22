# Glossary

<!-- exempt: registry (no template required) -->

*Last updated: 2026-04-22*

Thuật ngữ nội bộ. Khi thêm term mới, **update ở đây đầu tiên** — các doc khác link về.

---

## Core domain

- **Project** — Một dự án phần mềm của công ty. Container cấp cao nhất của Feature Catalog.
- **Feature** — Một tính năng end-user thuộc 1 Project. Đơn vị cơ bản của catalog. (VD: "Đăng nhập bằng email", "Xuất báo cáo Excel".)
- **Feature Catalog** — Toàn bộ Feature của 1 Project, có cấu trúc, có search.
- **Section** — Một trong 5 phần cố định của Feature. Thứ tự render cố định.
- **Section type** — Enum ID, **5 giá trị**: `business`, `user-flow`, `business-rules`, `tech-notes`, `screenshots`. Dùng làm DB enum + API param + FE constant `SECTION_ORDER` (export từ `packages/shared`).

  | ID | Tên hiển thị | Owner kỳ vọng |
  |---|---|---|
  | `business` | Business | BA/PM |
  | `user-flow` | User Flow | BA/PM |
  | `business-rules` | Business Rules | BA/PM |
  | `tech-notes` | Tech Notes | Dev |
  | `screenshots` | Screenshots | cả hai |

- **Section owner** — Role *kỳ vọng* (khuyến nghị, không enforce v1) là người viết section. V1 mọi authenticated user đều edit được mọi section.
- **Embed** — Link ngoài (Jira / Figma / GitHub) render thành preview card khi hostname khớp whitelist `*.atlassian.net` / `figma.com` / `github.com`. Xem [FR-EMBED-001](02-requirements.md#fr-embed-001--external-link-embed).
- **Upload** — File ảnh (png/jpg/webp ≤ 5 MiB) gửi qua `POST /api/v1/features/:id/uploads`, lưu Docker volume, serve qua `GET /uploads/:id`. Xem [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots).

---

## Roles

- **Reader** — Người đọc catalog. Persona chính v1 là Developer mới.
- **Author** — Người viết / cập nhật Feature.
  - **Business author** — BA / PM / PO.
  - **Tech author** — Senior Dev / Tech Lead.
- **Admin** (v1 minimal) — Người tạo Project và invite user khác.

### Role enum (DB + API)

Cột `users.role` là enum **2 giá trị**:

| Value | Quyền thêm so với baseline |
|---|---|
| `author` | Baseline — đọc/ghi mọi project + feature + section. |
| `admin` | `author` + tạo project (FR-PROJ-001) + invite user (FR-AUTH-001). |

V1 không có role `reader`/`viewer`; "Reader" là hành vi, không phải role. Mọi authenticated user đều đọc được. "Business author" vs "Tech author" là *kỳ vọng*, không phải role DB.

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
