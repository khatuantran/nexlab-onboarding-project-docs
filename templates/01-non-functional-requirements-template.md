---
version: 0.1
last-updated: 2026-04-22
target: .specs/02-requirements.md
required_sections:
  - Per-NFR block (ID · Metric · Measurement · Rationale · Verification)
---

# Non-functional Requirements

<!-- template: 01-non-functional-requirements-template.md@0.1 -->

_Last updated: <YYYY-MM-DD>_

---

## Per-NFR block template

Copy block dưới cho mỗi NFR mới. Mỗi NFR **phải measurable** — nếu không đo được, reformulate hoặc drop.

### NFR-<CATEGORY>-NNN — <short title>

Category: `PERF` | `A11Y` | `SEC` | `DATA` | `OBS` | `DX` | `COMPAT` | `I18N` | ...

- **Metric / threshold**: <concrete number, e.g. "p95 ≤ 300ms">
- **Scope**: <which endpoint / page / operation this applies to>
- **Measurement method**: <how verified — pino log duration, Lighthouse score, `pg_dump` success, manual audit>
- **Rationale**: <why this threshold — user expectation, compliance, baseline>
- **Verification**: <task ID or manual check procedure>

**Example**:

### NFR-PERF-001 — Read endpoint response time

- **Metric / threshold**: p95 ≤ 300ms server-side.
- **Scope**: `GET /projects/:slug`, `GET /projects/:slug/features/:slug`.
- **Measurement method**: pino log `duration_ms` aggregated; adhoc load test sau M1.
- **Rationale**: User perception "instant" < 300ms; catalog read path là hot path.
- **Verification**: T5 (API layer), manual check trong T8.
