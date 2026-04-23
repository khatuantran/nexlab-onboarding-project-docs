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
| G1 (onboard 1 nơi)                 | [FR-AUTH-001](02-requirements.md#fr-auth-001--emailpassword-auth)               | [US-001](stories/US-001.md), [US-002](stories/US-002.md), [US-003](stories/US-003.md) | [T6](stories/US-001/tasks.md#t6--auth-endpoints--session-middleware), [T8](stories/US-001/tasks.md#t8--login-page--auth-guard)                                                        | US-001 AC-1, AC-2, AC-10, AC-11 | 🟡 Planned |
| G1                                 | [FR-PROJ-001](02-requirements.md#fr-proj-001--project-crud-minimal)             | [US-002](stories/US-002.md)                                                           | [T2](stories/US-002/tasks.md#t2--project-create-api--admin-gate), [T4](stories/US-002/tasks.md#t4--createprojectdialog-fe)                                                            | US-002 AC-1, AC-2, AC-3         | 🟡 Planned |
| G3 (BA không cần dev unblock)      | [FR-FEAT-001](02-requirements.md#fr-feat-001--feature-crud-within-project)      | [US-002](stories/US-002.md)                                                           | [T3](stories/US-002/tasks.md#t3--feature-create-api--5-section-init), [T6](stories/US-002/tasks.md#t6--createfeaturedialog-fe)                                                        | US-002 AC-4                     | 🟡 Planned |
| G2 (template giảm Q&A)             | [FR-FEAT-002](02-requirements.md#fr-feat-002--5-section-template)               | [US-001](stories/US-001.md), [US-002](stories/US-002.md), [US-003](stories/US-003.md) | [T5](stories/US-001/tasks.md#t5--db-schema--migration--seed), [T7](stories/US-001/tasks.md#t7--read-api--search-api), [T9](stories/US-001/tasks.md#t9--landing--feature-detail-pages) | US-001 AC-3, AC-5, AC-6         | 🟡 Planned |
| G3 (multi-author)                  | [FR-FEAT-003](02-requirements.md#fr-feat-003--per-section-multi-author)         | [US-002](stories/US-002.md), [US-003](stories/US-003.md)                              | [T5](stories/US-002/tasks.md#t5--section-put-api--413-validation), [T7](stories/US-002/tasks.md#t7--sectioneditor-fe--edit-in-place-integration)                                      | US-002 AC-5, AC-6; US-003 AC-7  | 🟡 Planned |
| G4 (dev mới hiểu không cần mentor) | [FR-EMBED-001](02-requirements.md#fr-embed-001--external-link-embed)            | [US-003](stories/US-003.md)                                                           | —                                                                                                                                                                                     | US-003 AC-2, AC-3, AC-8         | 🟡 Planned |
| G1 (tìm trong 1 nơi)               | [FR-SEARCH-001](02-requirements.md#fr-search-001--full-text-search)             | [US-001](stories/US-001.md)                                                           | [T7](stories/US-001/tasks.md#t7--read-api--search-api), [T10](stories/US-001/tasks.md#t10--search-page--e2e-smoke--setup-validation)                                                  | US-001 AC-7, AC-8, AC-9         | ✅ US-001  |
| G1                                 | [FR-READ-001](02-requirements.md#fr-read-001--project-landing--feature-index)   | [US-001](stories/US-001.md)                                                           | [T7](stories/US-001/tasks.md#t7--read-api--search-api), [T9](stories/US-001/tasks.md#t9--landing--feature-detail-pages)                                                               | US-001 AC-3, AC-4               | 🟡 Planned |
| G2 (tech context)                  | [FR-UPLOAD-001](02-requirements.md#fr-upload-001--image-upload-for-screenshots) | [US-003](stories/US-003.md)                                                           | —                                                                                                                                                                                     | US-003 AC-4, AC-5, AC-6         | 🟡 Planned |

---

## Reverse index: Task → FR + AC

| Task                                                                         | Primary FR                     | AC covered (US-001)           | Status       |
| ---------------------------------------------------------------------------- | ------------------------------ | ----------------------------- | ------------ |
| [T1](stories/US-001/tasks.md#t1--monorepo-bootstrap--tooling)                | — (foundation)                 | —                             | ✅ `10b3a04` |
| [T2](stories/US-001/tasks.md#t2--docker-compose--api-skeleton)               | infra (all FR)                 | infra                         | ✅ `829a51a` |
| [T3](stories/US-001/tasks.md#t3--backend-infrastructure-scaffold-senior-be)  | infra (BE)                     | —                             | ✅ `d778093` |
| [T4](stories/US-001/tasks.md#t4--frontend-infrastructure-scaffold-senior-fe) | infra (FE)                     | —                             | ✅ `c286860` |
| [T5](stories/US-001/tasks.md#t5--db-schema--migration--seed)                 | FEAT-002                       | AC-3, AC-5, AC-6 data         | ✅ `e94af92` |
| [T6](stories/US-001/tasks.md#t6--auth-endpoints--session-middleware)         | AUTH-001                       | AC-1, AC-2, AC-10, AC-11      | ✅ `0b7cd7a` |
| [T7](stories/US-001/tasks.md#t7--read-api--search-api)                       | FEAT-002, READ-001, SEARCH-001 | AC-3, AC-5, AC-7, AC-9        | ✅ `9af2fe1` |
| [T8](stories/US-001/tasks.md#t8--login-page--auth-guard)                     | AUTH-001                       | AC-1, AC-2, AC-10, AC-11      | ✅ `5e90753` |
| [T8.5](stories/US-001/tasks.md#t85--design-system--lightdark-theme-infra)    | ADR-002 (infra, cross-screen)  | — (infra for all FE AC)       | ✅ `51802c0` |
| [T9](stories/US-001/tasks.md#t9--landing--feature-detail-pages)              | READ-001, FEAT-002             | AC-3, AC-4, AC-5, AC-6        | ✅ `879b15b` |
| [T10](stories/US-001/tasks.md#t10--search-page--e2e-smoke--setup-validation) | SEARCH-001                     | AC-7, AC-8, AC-9 + E2E all AC | ✅ `5ca8e49` |

### US-002 tasks

| Task                                                                          | Primary FR                  | AC covered (US-002) | Status       |
| ----------------------------------------------------------------------------- | --------------------------- | ------------------- | ------------ |
| [T1](stories/US-002/tasks.md#t1--db-role-column--shared-schemas)              | AUTH-001, FEAT-001 (shared) | AC-1 (role prereq)  | ✅ `e218c8e` |
| [T2](stories/US-002/tasks.md#t2--project-create-api--admin-gate)              | PROJ-001                    | AC-1, AC-2, AC-3    | ✅ `23f6c91` |
| [T3](stories/US-002/tasks.md#t3--feature-create-api--5-section-init)          | FEAT-001, FEAT-002          | AC-4                | ✅ `4869a68` |
| [T4](stories/US-002/tasks.md#t4--createprojectdialog-fe)                      | PROJ-001                    | AC-1, AC-2, AC-3    | ✅ `956b959` |
| [T5](stories/US-002/tasks.md#t5--section-put-api--413-validation)             | FEAT-003                    | AC-5, AC-6, AC-7    | ✅ `ddfb9ab` |
| [T6](stories/US-002/tasks.md#t6--createfeaturedialog-fe)                      | FEAT-001                    | AC-4                | ✅ `522889c` |
| [T7](stories/US-002/tasks.md#t7--sectioneditor-fe--edit-in-place-integration) | FEAT-003                    | AC-5, AC-6, AC-7    | ✅ `03c83ba` |
| [T8](stories/US-002/tasks.md#t8--e2e-smoke--progress-sync-release-tag)        | all                         | AC-2, AC-4, AC-5    | 🟡 Planned   |

---

## NFR coverage

| NFR                                                                            | Where verified                                                                         | Status         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------- |
| [NFR-PERF-001](02-requirements.md#nfr-perf-001--response-time)                 | T7 acceptance (measured via pino `duration_ms`), T9 manual                             | 🟡 Planned     |
| [NFR-A11Y-001](02-requirements.md#nfr-a11y-001--accessibility-baseline)        | T8, T9 manual audit (shadcn defaults)                                                  | 🟡 Planned     |
| [NFR-SEC-001](02-requirements.md#nfr-sec-001--security-baseline)               | T3 middleware ✅; T5 bcrypt cost≥10 ✅ `e94af92`; T6 session + rate limit ✅ `0b7cd7a` | ✅ v1          |
| [NFR-DATA-001](02-requirements.md#nfr-data-001--backup--retention)             | Manual `pg_dump` documented in SETUP.md                                                | ✅ Doc-only v1 |
| [NFR-OBS-001](02-requirements.md#nfr-obs-001--logging--observability-baseline) | T2 pino logger + request-id                                                            | ✅ `829a51a`   |

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
