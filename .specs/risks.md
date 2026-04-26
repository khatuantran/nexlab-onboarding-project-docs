# Risk & Assumption Register

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-22 · Owner: @khatuantran11_

Consolidate risks + assumption rải rác trong ADR, vision, stories vào 1 file. Mỗi entry có trạng thái + mitigation status + review cadence.

**Scope**: risk mang tính strategic/project-level. Risk implementation-level (bug, code smell) không nằm đây — dùng issue tracker sau.

---

## Legend

- **Impact**: 🔴 High · 🟠 Medium · 🟢 Low
- **Likelihood**: 🔴 Likely · 🟠 Possible · 🟢 Unlikely
- **Status**: 🟡 Open · ✅ Mitigated · 🔵 Accepted (conscious trade-off) · ⚪ Closed (N/A)

---

## R1 — Timeline slip do solo + side project

- **Source**: Vision §6, [ADR-001 §5](adr/ADR-001-tech-stack.md)
- **Impact**: 🟠 Medium (shift launch, không kill project)
- **Likelihood**: 🔴 Likely (common với side project)
- **Status**: 🔵 Accepted
- **Mitigation**:
  - Roadmap có buffer tới 2026-07-31 cho M3.
  - Scope cut non-goals aggressive (AI, real-time, SSO defer).
  - Weekly self-check milestone slip (xem [roadmap.md](roadmap.md) §Update cadence).
- **Revisit**: Sau M1. Nếu M1 > 2026-06-15 → drop US-003 out of MVP hoặc extend timeline.

## R2 — K8s prod deployment quá phức tạp cho solo maintain

- **Source**: [ADR-001 §5](adr/ADR-001-tech-stack.md), [03-architecture §4](03-architecture.md)
- **Impact**: 🔴 High (block pilot nếu K8s thành hard dep)
- **Likelihood**: 🔴 Likely (ops skill solo chưa rodado)
- **Status**: ✅ Mitigated
- **Mitigation**: K8s deferred v2. V1 prod = Docker Compose trên VPS (DO/Hetzner) + Nginx + Let's Encrypt. K8s manifest viết dần ở `infra/k8s/` nhưng **không wire vào CI/CD v1**.
- **Revisit**: Pilot launch (M3). Nếu VPS đủ scale → giữ; nếu scale fail → xem xét managed K8s (DOKS, GKE Autopilot).

## R3 — Postgres FTS không đủ khi corpus scale

- **Source**: [ADR-001 §2.4, §5](adr/ADR-001-tech-stack.md), [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search)
- **Impact**: 🟠 Medium (user complains search, không block core)
- **Likelihood**: 🟢 Unlikely ở v1 scale (≤ 10k feature)
- **Status**: 🔵 Accepted
- **Mitigation**:
  - NFR-PERF-001 target 500ms p95 — đo sau M1.
  - `searchRepo` interface tách riêng; swap Meilisearch/Elasticsearch không break domain.
  - Trigger threshold revisit documented: > 10k feature hoặc p95 > 500ms.
- **Revisit**: Khi corpus pilot > 1k feature hoặc sau 1 tháng production.

## R4 — Session + Redis tăng complexity operational

- **Source**: [ADR-001 §5](adr/ADR-001-tech-stack.md)
- **Impact**: 🟠 Medium (Redis sập → tất cả user logout)
- **Likelihood**: 🟢 Unlikely (Redis stable, managed services reliable)
- **Status**: 🔵 Accepted
- **Mitigation**:
  - V1 chấp nhận Redis là hard dep.
  - Nếu managed Redis (DO Managed / Upstash) → reliability cao.
  - JWT fallback design vẫn possible (ghi trong ADR-001) nhưng không implement v1.
- **Revisit**: Nếu có incident Redis ảnh hưởng UX → consider fallback JWT.

## R5 — Drizzle ORM ecosystem còn trẻ

- **Source**: [ADR-001 §5](adr/ADR-001-tech-stack.md)
- **Impact**: 🟢 Low (có thể migrate sang Prisma nếu tệ)
- **Likelihood**: 🟠 Possible (breaking change hoặc gap feature)
- **Status**: 🔵 Accepted
- **Mitigation**: Pin version, follow release notes, repo layer tách biệt (nếu swap ORM chỉ đụng `src/repos/`).

## R6 — Upload volume fills disk

- **Source**: [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots), [US-003](stories/US-003.md) Risks
- **Impact**: 🟠 Medium (service down khi disk full)
- **Likelihood**: 🟢 Unlikely (internal, low traffic; 5 MiB/file, ≤ 100 dev)
- **Status**: 🟡 Open
- **Mitigation**:
  - V1: monitor disk usage manual (weekly `df -h`).
  - V2: rate limit upload endpoint (stretch); migrate sang S3-compatible.
- **Revisit**: M3 pilot launch — đo tốc độ grow volume.

## R7 — Markdown XSS qua user input

- **Source**: [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template), [US-001](stories/US-001.md) Risks, [NFR-SEC-001](02-requirements.md#nfr-sec-001--security-baseline)
- **Impact**: 🔴 High (security incident)
- **Likelihood**: 🟠 Possible (authenticated user malicious nhưng ít capability)
- **Status**: 🟡 Open (sẽ mitigate ở T7)
- **Mitigation**:
  - Sanitize markdown HTML qua DOMPurify với strict allowlist (no `<script>`, no `on*` attrs).
  - Unit test XSS vectors trong MarkdownView component (T7 AC).
  - CSP header cho web static (config Nginx).
- **Revisit**: Post-T7 verify; security audit trước M3.

## R8 — User enumeration qua auth error leak

- **Source**: [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth)
- **Impact**: 🟠 Medium (low-value target — internal user list leak)
- **Likelihood**: 🟠 Possible
- **Status**: ✅ Mitigated (by spec)
- **Mitigation**: FR-AUTH-001 yêu cầu cả "wrong email" lẫn "wrong password" trả cùng `INVALID_CREDENTIALS` code. Constant-time compare mặc định từ bcryptjs.

## R9 — Path traversal / MIME spoof upload

- **Source**: [US-003](stories/US-003.md) Risks
- **Impact**: 🔴 High (RCE / file write ngoài volume)
- **Likelihood**: 🟠 Possible
- **Status**: 🟡 Open (sẽ mitigate ở US-003 upload task)
- **Mitigation**:
  - Validate MIME qua magic bytes (`file-type` lib), không trust `Content-Type` header.
  - Filename sanitize: dùng uploadId UUID, không giữ original name trong filesystem path.
  - Path join qua `path.resolve` + verify start với `UPLOAD_DIR` prefix.
- **Revisit**: Post-US-003 verify.

## R10 — Lost work khi Redis clear session

- **Source**: Implied by session architecture
- **Impact**: 🟢 Low (user re-login, không mất data)
- **Likelihood**: 🟠 Possible (Redis restart, TTL expire mid-work)
- **Status**: 🔵 Accepted
- **Mitigation**: Autosave section body sang localStorage client-side (stretch, defer v2). V1 user tự chịu trách nhiệm save thường xuyên.

---

## R11 — Free-tier policy thay đổi (M3 deployment)

- **Trigger**: Netlify / Fly.io / Neon / Upstash cắt hoặc giảm free tier (đã từng xảy ra với Heroku 2022, Render Postgres 2024, Fly new-account-only 2024, Netlify giảm build min từ 300 sang 100 trong vài account 2024).
- **Impact**: 🟠 High — pilot phải migrate sang VPS hoặc paid tier giữa chừng.
- **Likelihood**: 🟠 Possible (12-month horizon)
- **Status**: 🟡 Open (accept cho pilot)
- **Mitigation**: ADR-002 ghi sẵn trigger conditions + fallback path Hetzner CX11 €4/mo. Code không lock vào provider-specific feature; migrate ~1 ngày work.

## R12 — Cold start UX (Fly + Neon scale-to-zero)

- **Trigger**: BE + DB cùng cold sau idle 30 phút → request đầu chờ 3-4s.
- **Impact**: 🟢 Low — chỉ user đầu trong ngày + qua đêm; subsequent requests instant.
- **Likelihood**: 🟢 Always (mỗi sáng + sau lunch break)
- **Status**: 🔵 Accepted
- **Mitigation**: Bật `min_machines_running=1` trên Fly (vẫn miễn phí trong 3 VM allowance) nếu UX feedback xấu. Cron `/health` ping mỗi 5 phút giữ Neon warm trong giờ làm việc.

## R13 — Single region (sin) availability

- **Trigger**: Fly sin region hoặc Neon ap-southeast-1 down.
- **Impact**: 🟠 High — toàn app down cho đến khi region recover (Fly historic ~1-3h incidents).
- **Likelihood**: 🟢 Rare
- **Status**: 🔵 Accepted (pilot không SLA-bound)
- **Mitigation**: Multi-region defer v2 (Fly free tier không hỗ trợ multi-region). Document trong RUNBOOK status page links để monitor.

---

## Assumptions

| #   | Assumption                                                  | If wrong                                                                             |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A1  | Internal portal, không expose public internet               | Security model cần revisit (rate limit, DDoS protection, CSRF stricter)              |
| A2  | Pilot scale ≤ 10 project, ≤ 100 user, ≤ 500 feature/project | Postgres FTS + single VPS có thể không đủ                                            |
| A3  | BA+Dev sẵn lòng fill 5 section đầy đủ                       | Portal trở thành "ghost town" như Confluence — cần change management, không chỉ tool |
| A4  | Dev mới chủ động đọc portal trước khi hỏi                   | Cần training process + onboarding checklist phối hợp từ HR/Tech Lead                 |
| A5  | Owner solo đủ thời gian maintain 2-3h/tuần sau launch       | Nếu không maintain → bug rot, schema drift, trust giảm                               |

---

## Update cadence

- **Weekly**: review Open risks, update status nếu đổi.
- **Per milestone exit**: confirm Mitigated risks còn đúng, upgrade từ Open → Mitigated/Closed.
- **Khi thêm US mới**: check có risk mới không, thêm vào register.
