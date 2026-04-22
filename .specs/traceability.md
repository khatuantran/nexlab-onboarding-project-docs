# Traceability Matrix

<!-- exempt: registry (no template required) -->

_Last updated: 2026-04-22 · Source of truth for cross-references between vision → FR → user story → task._

Mục đích: khi đổi 1 FR biết ngay tác động tới story + task nào. Khi implement 1 task biết test cần cover AC + FR nào. Audit SDD compliance ở 1 bảng duy nhất.

**Rule**: mỗi lần thêm/đổi FR hoặc US, cập nhật bảng này trong **cùng commit**.

---

## Legend

- ✅ Covered = có test cover FR qua AC
- 🟡 Planned = story/task định nghĩa nhưng chưa implement
- ⚪ Not scheduled = chưa có US/task (thường là deferred)

---

## Matrix: Goal → FR → US → Task

| Goal                               | FR                                                                              | US                                                                                    | Task (US-001 only)                                                                                                                                                                    | AC covered                      | Status     |
| ---------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- |
| G1 (onboard 1 nơi)                 | [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth)               | [US-001](stories/US-001.md), [US-002](stories/US-002.md), [US-003](stories/US-003.md) | [T4](stories/US-001/tasks.md#t4--auth-endpoints--session-middleware), [T6](stories/US-001/tasks.md#t6--web-skeleton--auth-guard--login-page)                                          | US-001 AC-1, AC-2, AC-10, AC-11 | 🟡 Planned |
| G1                                 | [FR-PROJ-001](02-requirements.md#fr-proj-001--project-crud-minimal)             | [US-002](stories/US-002.md)                                                           | — (US-002 task TBD)                                                                                                                                                                   | US-002 AC-1, AC-2, AC-3         | 🟡 Planned |
| G3 (BA không cần dev unblock)      | [FR-FEAT-001](02-requirements.md#fr-feat-001--feature-crud-within-project)      | [US-002](stories/US-002.md)                                                           | —                                                                                                                                                                                     | US-002 AC-4                     | 🟡 Planned |
| G2 (template giảm Q&A)             | [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template)               | [US-001](stories/US-001.md), [US-002](stories/US-002.md), [US-003](stories/US-003.md) | [T3](stories/US-001/tasks.md#t3--db-schema--migration--seed), [T5](stories/US-001/tasks.md#t5--read-api--search-api), [T7](stories/US-001/tasks.md#t7--landing--feature-detail-pages) | US-001 AC-3, AC-5, AC-6         | 🟡 Planned |
| G3 (multi-author)                  | [FR-FEAT-003](02-requirements.md#fr-feat-003--per-section-multi-author)         | [US-002](stories/US-002.md), [US-003](stories/US-003.md)                              | —                                                                                                                                                                                     | US-002 AC-5, AC-6; US-003 AC-7  | 🟡 Planned |
| G4 (dev mới hiểu không cần mentor) | [FR-EMBED-001](02-requirements.md#fr-embed-001--external-link-embed)            | [US-003](stories/US-003.md)                                                           | —                                                                                                                                                                                     | US-003 AC-2, AC-3, AC-8         | 🟡 Planned |
| G1 (tìm trong 1 nơi)               | [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search)             | [US-001](stories/US-001.md)                                                           | [T5](stories/US-001/tasks.md#t5--read-api--search-api), [T8](stories/US-001/tasks.md#t8--search-page--e2e-smoke--setup-validation)                                                    | US-001 AC-7, AC-8, AC-9         | 🟡 Planned |
| G1                                 | [FR-READ-001](02-requirements.md#fr-read-001--project-landing--feature-index)   | [US-001](stories/US-001.md)                                                           | [T5](stories/US-001/tasks.md#t5--read-api--search-api), [T7](stories/US-001/tasks.md#t7--landing--feature-detail-pages)                                                               | US-001 AC-3, AC-4               | 🟡 Planned |
| G2 (tech context)                  | [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots) | [US-003](stories/US-003.md)                                                           | —                                                                                                                                                                                     | US-003 AC-4, AC-5, AC-6         | 🟡 Planned |

---

## Reverse index: Task → FR + AC

| Task                                                                       | Primary FR                     | AC covered (US-001)           |
| -------------------------------------------------------------------------- | ------------------------------ | ----------------------------- |
| [T1](stories/US-001/tasks.md#t1--monorepo-bootstrap--tooling)              | — (foundation)                 | ✅ Done                       |
| [T2](stories/US-001/tasks.md#t2--docker-compose--api-skeleton)             | infra (all FR)                 | infra                         |
| [T3](stories/US-001/tasks.md#t3--db-schema--migration--seed)               | FEAT-002                       | AC-3, AC-5, AC-6 data         |
| [T4](stories/US-001/tasks.md#t4--auth-endpoints--session-middleware)       | AUTH-001                       | AC-1, AC-2, AC-10, AC-11      |
| [T5](stories/US-001/tasks.md#t5--read-api--search-api)                     | FEAT-002, READ-001, SEARCH-001 | AC-3, AC-5, AC-7, AC-9        |
| [T6](stories/US-001/tasks.md#t6--web-skeleton--auth-guard--login-page)     | AUTH-001                       | AC-1, AC-2, AC-10, AC-11      |
| [T7](stories/US-001/tasks.md#t7--landing--feature-detail-pages)            | READ-001, FEAT-002             | AC-3, AC-4, AC-5, AC-6        |
| [T8](stories/US-001/tasks.md#t8--search-page--e2e-smoke--setup-validation) | SEARCH-001                     | AC-7, AC-8, AC-9 + E2E all AC |

---

## NFR coverage

| NFR                                                                            | Where verified                                             | Status         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------- |
| [NFR-PERF-001](02-requirements.md#nfr-perf-001--response-time)                 | T5 acceptance (measured via pino `duration_ms`), T7 manual | 🟡 Planned     |
| [NFR-A11Y-001](02-requirements.md#nfr-a11y-001--accessibility-baseline)        | T6, T7 manual audit (shadcn defaults)                      | 🟡 Planned     |
| [NFR-SEC-001](02-requirements.md#nfr-sec-001--security-baseline)               | T4 (bcrypt, session, rate limit), ADR-001 §2.7             | 🟡 Planned     |
| [NFR-DATA-001](02-requirements.md#nfr-data-001--backup--retention)             | Manual `pg_dump` documented in SETUP.md                    | ✅ Doc-only v1 |
| [NFR-OBS-001](02-requirements.md#nfr-obs-001--logging--observability-baseline) | T2 pino logger + request-id                                | 🟡 Planned     |

---

## Coverage gaps (intentional)

- **No US/task yet for**: Admin UI to list/disable users (deferred, xem `02-requirements.md` Still-open #2).
- **No test** cho session TTL expiry behavior — default 7d sliding, sẽ verify manual sau.
- **No load test** gate CI v1 — NFR-PERF measured adhoc.

---

## Update procedure

1. Thêm FR mới → thêm row "FR → US → Task".
2. Thêm US mới → fill cột US, mark Status 🟡.
3. Implement task xong → đổi 🟡 → ✅ + link commit hash.
4. Remove FR → check reverse index, cập nhật story nào mất anchor.
