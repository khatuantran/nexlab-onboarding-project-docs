---
version: 0.1
last-updated: 2026-04-22
target: .specs/ui/<screen-slug>.md
required_sections:
  - Screen metadata
  - Route
  - State machine
  - Interactions
  - A11y
  - Wire-level description
  - Error / empty / loading states
  - Maps US
---

# UI Spec — <Screen Name>

<!-- template: 02-ui-spec-template.md@0.1 -->

## Screen metadata

- **Screen ID**: `<slug>`
- **Status**: Draft | Ready | Implemented
- **Last updated**: <YYYY-MM-DD>

## Route

- **Path**: `/<path>/:param`
- **Auth**: ❌ public · 🔐 authenticated · 👑 admin
- **Redirect on unauth**: `/login?next=<current>`

## State machine

```
idle → loading → (success | error | empty)
                    ↓
                  action → <next state>
```

- **States**:
  - `idle` — <description>
  - `loading` — <description>
  - `success` — <description>
  - `error` — <description>
  - `empty` — <description>

## Interactions

| Trigger       | Action              | Next state                    | Side effect          |
| ------------- | ------------------- | ----------------------------- | -------------------- |
| Page load     | Fetch API           | `loading` → `success`/`error` | TanStack Query cache |
| Click `<btn>` | Mutation            | `loading` → refetch           | Optimistic update?   |
| Submit form   | Validate → mutation |                               | Toast on success     |

## A11y

- **Keyboard**: tab order theo reading order; focus visible.
- **Labels**: mọi input có `<label for>`; icon button có `aria-label`.
- **Live regions**: error message `aria-live="polite"`; loading `aria-busy`.
- **Contrast**: text ≥ 4.5:1.
- **Landmarks**: `<main>`, `<nav>`, `<header>` đúng chỗ.

## Wire-level description

```
┌─────────────────────────────┐
│ Header: <logo> <search> <me>│
├─────────────────────────────┤
│                             │
│  <main content>             │
│                             │
└─────────────────────────────┘
```

- **Layout**: <1-col / 2-col / grid>, max-width `<px>`.
- **Responsive**: <mobile breakpoint behavior>.
- **Key components**: <list of components reused + new>.

## Error / empty / loading states

- **Loading**: <skeleton / spinner / disable form>
- **Empty**: <placeholder copy + CTA>
- **Error (4xx/5xx)**: <inline vs toast vs full-page>; map error code → copy qua `errorMessages.ts`.
- **Unauthenticated**: redirect `/login`.

## Maps US

- [US-NNN](../stories/US-NNN.md) — AC-<N>, AC-<M>

## Implementation

- **Task**: [T-N](../stories/US-NNN/tasks.md#t-n)
- **Page component**: `apps/web/src/pages/<Name>Page.tsx`
- **Sub-components**: `apps/web/src/components/<feature>/...`
