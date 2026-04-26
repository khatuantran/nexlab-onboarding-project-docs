# ADR-002 — Deployment platform: Netlify + Fly.io + Neon + Upstash

<!-- template: 04-adr-template.md@0.2 -->

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-26
- **Deciders**: @khatrannexlab
- **Supersedes**: —
- **Related**: [Vision](../00-vision.md), [Roadmap M3](../roadmap.md), [CR-003](../changes/CR-003.md), [ADR-001 tech stack](ADR-001-tech-stack.md)

---

## 1. Context

M3 pilot launch của onboarding portal cần một stack production-ready cho **<50 user**, **<100 feature** trong vòng 3-6 tháng pilot, với các ràng buộc:

- **Budget = $0/tháng**: solo dev / pilot tự bỏ tiền túi, không justify chi phí cho đến khi có signal traffic thật.
- **Stack hiện tại**: Express + Postgres (with plpgsql functions + tsvector triggers) + Redis (session store + rate limit) + persistent file uploads (Docker volume / FS).
- **Vietnam users**: cần region ap-southeast (sin / hkg / sgp) để latency < 100ms.
- **Solo maintainer**: ops effort tối thiểu — không có capacity tự manage Nginx / Let's Encrypt / OS update / backup cron.
- **Teardown dễ**: pilot có thể thất bại; cần xoá nhanh không để tài sản orphan.
- **CR-003 phải trả lời**: chọn provider nào cho FE / BE / Postgres / Redis / file storage / CI/CD?

Ràng buộc kỹ thuật blocker:

- Postgres FTS (`tsvector` + `plpgsql` functions trong [migration 0001](../../apps/api/src/db/migrations/0001_fts_triggers.sql) + [migration 0004](../../apps/api/src/db/migrations/0004_search_vectors_v2.sql)) → loại các provider Postgres-wire-compat-only (CockroachDB Serverless).
- Express + `express-session` + `connect-redis` cần stateful long-running process → loại serverless functions (Vercel Functions, Cloudflare Workers Workers without significant rewrite).
- File uploads ghi vào filesystem hiện tại — cần persistent volume hoặc object storage adapter.

---

## 2. Decision

**Decision**: Pilot deploy lên **Netlify (FE) + Fly.io (BE) + Neon (Postgres) + Upstash (Redis)** trong region Singapore. File uploads dùng Fly persistent volume 3GB. CI/CD qua GitHub Actions cho BE; Netlify auto-build cho FE (config in repo-root [`netlify.toml`](../../netlify.toml)).

> **2026-04-26 revision** — initial pick là Cloudflare Pages, reverted same-day. Cloudflare đã gộp Pages vào Workers UI gây user click nhầm tạo Worker → `wrangler deploy` fail trên pnpm monorepo. Swap sang Netlify (commercial OK, monorepo UI rõ, SPA redirect rule trong `netlify.toml`). Vercel xét nhưng skipped vì Hobby ToS chỉ personal/non-commercial. BE stack giữ nguyên.

### 2.1 Sub-decisions

| Concern       | Choice                                                                 | Lý do ngắn                                                                                                                       |
| ------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FE host       | Netlify                                                                | 100 GB BW/mo + 300 build min/mo + global edge + GitHub auto-deploy + monorepo-friendly UI + `netlify.toml` SPA redirects in-repo |
| BE host       | Fly.io shared-cpu-1x@256mb                                             | Always-on miễn phí trong 3 VM allowance; persistent volume 3GB; region sin sát users                                             |
| Postgres      | Neon free tier (0.5GB)                                                 | Permanent free, full Postgres 16 (plpgsql + tsvector OK), branching cho preview env, autoscale, no CC required                   |
| Redis         | Upstash free tier (10k cmd/day)                                        | Permanent free, REST + native protocol, ap-southeast-1 region, fit session + rate-limit pilot scale                              |
| File uploads  | Fly persistent volume 3GB                                              | Code path không đổi (vẫn ghi `./data/uploads`); migrate sang R2 nếu vượt                                                         |
| CI/CD         | GitHub Actions (private 2000 min/mo) cho BE; Netlify auto-build cho FE | Đủ cho ~30-50 deploys/tháng                                                                                                      |
| Custom domain | Không có v1 — `*.netlify.app` + `*.fly.dev`                            | Defer khi pilot proves; tiết kiệm 1 step DNS + SSL                                                                               |

---

## 3. Alternatives considered

| Option                             | Pros                                                        | Cons                                                                                                                                                 | Lý do không chọn                                          |
| ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **VPS DO/Hetzner $4-6/mo** (M3 cũ) | Single VM, full control, predictable cost                   | $48-72/năm, ops effort cao (Nginx, Let's Encrypt cron, OS update, backup)                                                                            | Không free; pilot scope không cần full control            |
| **Cloudflare Pages**               | Unlimited BW + 500 builds/mo + commercial OK                | Workers/Pages UI hợp nhất 2026 gây user click nhầm tạo Worker → `wrangler deploy` fail trên pnpm monorepo                                            | Initial pick 2026-04-26, reverted same-day do UI friction |
| **Vercel Hobby**                   | UI nhanh, monorepo support tốt                              | Hobby ToS chỉ personal/non-commercial — pilot công ty technically vi phạm; Pro $20/mo phá free-tier mục tiêu                                         | ToS không cho commercial use                              |
| **Render**                         | Zero-config, GitHub auto-deploy, simple                     | Postgres free **90 ngày** rồi $7/mo; web service sleep 15min                                                                                         | Postgres free expires → KHÔNG permanent free              |
| **Railway**                        | DX xuất sắc, all-in-one                                     | $5 credit/tháng → effective paid sau ~1 tháng                                                                                                        | Không free vĩnh viễn                                      |
| **Vercel + Supabase**              | Vercel cho SPA tốt; Supabase free Postgres + Auth + Storage | BE serverless functions không fit Express + connect-redis (cold start mỗi function call); Supabase free pause **toàn project** sau 7 ngày inactivity | Express + Redis session lỗi pattern serverless            |
| **Fly Postgres thay Neon**         | 3GB volume always-on, colocate cùng region (zero latency)   | Chiếm 1 trong 3 VM free → BE còn 2 VM; Neon branching mất                                                                                            | Trigger fallback nếu Neon 0.5GB chật                      |
| **Supabase Postgres**              | All-in-one (DB + Auth + Storage + Realtime)                 | Pause toàn project sau 7 ngày; 0.5GB; cần Upstash Redis riêng dù sao                                                                                 | Pause inactivity unsafe cho pilot daily-use intermittent  |
| **CockroachDB Serverless 5GB**     | Free 5GB, Postgres wire-compat                              | Không support plpgsql functions + một số tsvector edge cases → migrations 0001 + 0004 sẽ vỡ                                                          | Schema incompat                                           |
| **Heroku**                         | DX kinh điển                                                | Đã cắt free tier hoàn toàn 2022                                                                                                                      | Không miễn phí                                            |
| **Koyeb / Deta / Glitch**          | Free tier permanent                                         | Postgres không có / ephemeral / quá nhỏ                                                                                                              | Không đáp ứng FTS persistence                             |

---

## 4. Consequences

### Positive

- **$0/tháng** suốt pilot 3-6 tháng.
- **Ops effort thấp**: provider lo OS / SSL / backup / scaling. Solo dev tập trung product.
- **Setup trong 1-2h**: signup 4 platform + 1 deploy command.
- **Teardown trong vài phút**: xoá projects, không có tài sản orphan.
- **Netlify deploy preview**: mỗi PR tự động có preview URL — DX tốt cho review.
- **Neon branching**: có thể clone DB cho preview env mà không tốn tiền.

### Negative / trade-off

- **Cold start tổng**: Fly scale-to-zero (~1-2s) + Neon autosuspend (~500ms-2s) = lần đầu sau idle 30 phút có thể 3-4s. UX impact nhẹ.
- **Single region (sin)**: nếu Fly sin down → app down. Multi-region defer.
- **Upstash 10k cmd/day cap**: với 50 user heavy use có thể chật. Watch metrics.
- **No backup automation**: Neon free PITR 7 days + manual weekly pg_dump. Recovery thủ công.
- **No custom domain v1**: trust signal kém với khách external; OK với dev pilot.
- **Free tier policy có thể đổi**: Fly từng cắt free cho new account 2024. Lock-in moderate.

### Neutral

- **Secrets ở 4 nơi** (GitHub, Netlify, Fly, Neon): rotate process cần document trong RUNBOOK.
- **Logs** chỉ 7 days retention free trên Fly. Acceptable cho pilot.

---

## 5. Risks & mitigations

| Risk                                            | Impact | Mitigation                                                                                                     |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Fly free tier policy thay đổi (cắt new account) | High   | Trigger migrate sang Hetzner CX11 €4/mo (xem §6)                                                               |
| Neon 0.5GB đầy                                  | Medium | Migrate sang Fly Postgres 3GB hoặc upgrade Neon $19/mo                                                         |
| Upstash 10k cmd/day exhausted                   | Medium | In-process session cache 60s; nếu vẫn vượt → upgrade $0.20/100k cmd                                            |
| Cold start UX kém                               | Low    | Bật `min_machines_running=1` trên Fly (vẫn miễn phí trong 3 VM allowance); hoặc cron `/health` ping mỗi 5 phút |
| Volume corrupt / region down                    | High   | Weekly `pg_dump` vào R2 (free 10GB); uploads rsync; restore trong 30 phút                                      |
| Secret leak qua log                             | High   | NFR-OBS-001 đã ban log password / cookie; verify audit định kỳ                                                 |
| Single point of failure (Fly sin)               | Medium | Defer multi-region đến v2; pilot SLA không guarantee                                                           |

---

## 6. Validation criteria

Tạo ADR-003 + supersede ADR này khi:

- **Scale > 200 active user** trong 30 ngày liên tiếp → cần dedicated VM hoặc Fly paid tier.
- **DB > 3GB** (Neon hoặc fallback Fly Postgres) → cần managed DBaaS paid (Aiven $19/mo, Supabase Pro $25/mo, hoặc self-host).
- **Free tier policy** của Fly / Neon / Upstash thay đổi unfavorably (vd cắt new account, giảm quota > 50%).
- **Multi-region** required (user feedback từ overseas team) → Fly không multi-region trong free tier.
- **SLA / uptime guarantee** required (vd contract với khách external) → free tier không cover.
- **Compliance** (HIPAA / PCI / data sovereignty VN) → free tier không cover.

Trigger condition cho việc giữ ADR này:

- Pilot < 50 user, dùng dưới 30% mỗi free quota, không có audit / compliance ràng buộc.

---

## 7. References

- [Fly.io free tier 2026](https://fly.io/docs/about/pricing/)
- [Neon free plan 2026](https://neon.com/docs/introduction/plans) — 0.5GB / 100 CU-hours / autosuspend
- [Upstash Redis pricing](https://upstash.com/pricing) — 10k cmd/day free
- [Netlify free plan limits](https://www.netlify.com/pricing/)
- Internal: [CR-003](../changes/CR-003.md) (parent change request); [ADR-001 tech stack](ADR-001-tech-stack.md) (foundation); [Roadmap M3](../roadmap.md)
