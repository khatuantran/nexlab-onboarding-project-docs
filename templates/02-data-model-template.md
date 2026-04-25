---
version: 0.1
last-updated: 2026-04-22
target: .specs/03-architecture.md (§Domain model, per-entity block)
required_sections:
  - Entity
  - Fields
  - Relationships
  - Invariants
  - Indexes
  - Migration notes
---

# Data Model — <Entity name>

<!-- template: 02-data-model-template.md@0.1 -->

## Entity

- **Table name**: `<snake_case>`
- **Purpose**: <1 sentence — what this entity represents in domain>
- **Lifecycle**: create-only | mutable | soft-delete | hard-delete
- **Owner module**: `apps/api/src/db/schema.ts` — `<tableName>`

## Fields

| Column       | Type                           | Nullable | Default             | Notes                         |
| ------------ | ------------------------------ | -------- | ------------------- | ----------------------------- |
| `id`         | `uuid`                         | no       | `gen_random_uuid()` | Primary key                   |
| `created_at` | `timestamptz`                  | no       | `now()`             |                               |
| `updated_at` | `timestamptz`                  | no       | `now()`             | Update trigger hoặc app-level |
| `<name>`     | `text` / `int` / `jsonb` / ... | yes/no   |                     | <constraint>                  |

Check constraints:

- `CHECK (<expr>)` — <why>

## Relationships

- `<field>` → `<table>.id` ON DELETE `CASCADE` | `RESTRICT` | `SET NULL` — <reason>
- Reverse: `<other_table>.<field>` → this.id

## Invariants

- <Business invariant 1 — enforce ở service layer hay DB constraint>
- <Business invariant 2>

## Indexes

| Name                | Columns   | Type                 | Why             |
| ------------------- | --------- | -------------------- | --------------- |
| `<table>_<col>_idx` | `(<col>)` | btree / gin / unique | <query pattern> |

## Migration notes

- **Breaking change risk**: <low/med/high — backfill required?>
- **Data backfill script**: <path nếu cần>
- **Rollback strategy**: <forward-only | reversible migration>

## Maps FR

- [FR-XXX-NNN](../.specs/02-requirements.md#fr-xxx-nnn)
