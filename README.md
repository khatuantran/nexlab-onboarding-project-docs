# Onboarding Doc Portal

> **Tên dự án hiện tại là placeholder** — sẽ đặt tên chính thức sau khi có Vision final.

Portal nội bộ giúp **dev mới (FE/BE/Fullstack) onboard vào các dự án của công ty mà không cần mentor 1-1**, thông qua **Feature Catalog** chuẩn hóa cho từng project.

## Trạng thái

🚧 **Pre-MVP — đang khởi tạo SDD scaffold.** Chưa có code chạy được.

## Vấn đề đang giải quyết

- Dự án business phức tạp, tài liệu rải rác hoặc không có.
- Dev mới mất nhiều thời gian để hiểu tính năng vì không có nguồn trung tâm, không có template chuẩn.
- BA/PM và senior dev đều bận → mentoring 1-1 không scale.

## Hướng giải quyết (MVP v1)

**Feature Catalog theo project** — mỗi feature có template 5 section cố định:

1. Mô tả nghiệp vụ (business)
2. User flow
3. Business rules
4. Tech notes
5. Screenshots

BA/PM viết phần business; dev bổ sung phần tech. Dev mới đọc để hiểu feature trước khi đụng code.

## Phương pháp

**Spec-Driven Development (SDD).** Mọi spec nằm trong [.specs/](.specs/). Xem [CLAUDE.md](CLAUDE.md) để biết quy tắc làm việc.

## Tech stack (pending ADR-001)

- **FE**: React + Vite + TypeScript + Tailwind + shadcn/ui
- **BE**: Express.js + TypeScript + Zod + Drizzle ORM
- **DB**: PostgreSQL 16, Redis 7
- **Infra**: Docker Compose (local dev), K8s (production — deferred v2)

## Cấu trúc thư mục

```
.specs/          Specs (vision, personas, requirements, stories, ADRs)
docs/            Hướng dẫn vận hành (SETUP, CONTRIBUTING...)
apps/            (sau Step 6) apps/web (React) + apps/api (Express)
packages/        (sau Step 6) packages/shared (shared types)
```

## Chạy dự án

⚠️ Chưa có code chạy được. Hướng dẫn setup sẽ xuất hiện tại [docs/SETUP.md](docs/SETUP.md) sau **Bước 3** của SDD workflow.

## Tài liệu chính

- [Vision](.specs/00-vision.md) — tại sao xây, phục vụ ai, goals/non-goals
- [Personas](.specs/01-personas.md) — user profile chi tiết
- [Requirements](.specs/02-requirements.md) — FRs + NFRs *(placeholder)*
- [Architecture](.specs/03-architecture.md) — architecture summary *(placeholder)*
- [Glossary](.specs/glossary.md) — thuật ngữ nội bộ
- [CLAUDE.md](CLAUDE.md) — quy tắc SDD cho AI và con người
