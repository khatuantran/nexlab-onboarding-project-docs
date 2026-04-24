# ADR-002 — Light + dark theme toggle from MVP

<!-- template: 04-adr-template.md@0.2 -->

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @khatuantran11
- **Supersedes**: —
- **Related**: [ADR-001](ADR-001-tech-stack.md), [ADR-003 Nexlab DS](ADR-003-nexlab-design-system.md) (dark palette now derived from Nexlab, not shadcn-neutral), [design-system.md](../ui/design-system.md), [US-001](../stories/US-001.md)

---

## 1. Context

UI FE vừa ship LoginPage (T8) theo style mặc định shadcn (CSS vars chưa định nghĩa, nhìn ra màu tailwind raw). Khi review quy trình UX spec (xem plan thêm UI spec gate vào SDD), user chốt: "light + dark toggle ngay từ MVP" thay vì defer.

**Constraint**:

- Team 1 người (solo), MVP timeline 2026-05-31 (5 tuần).
- Stack: React 18 + Tailwind 3 + shadcn primitives đã scaffolded (Button/Input/Label) nhưng chưa có CSS var tokens.
- User internal portal, không phải consumer app — dark mode không phải differentiator marketing, nhưng là quality-of-life cho dev đọc doc vào giờ muộn/màn hình low-light.

**Tại sao quyết bây giờ**:

- Nếu defer: mọi per-screen spec sau này phải viết lại phần color khi thêm dark. 5 screens (login + landing + detail + search + future US-002/003 edit) × cost re-verify = tốn hơn làm trước.
- Mỗi screen mới được viết khi đã có token dark-compatible → chi phí thêm cho dark = gần 0 nếu không dùng bespoke color.
- Browser-test Gate 2 (theo plan UX gate) giờ check 2 mode cùng lúc, tốn thêm ~1-2 phút mỗi screen.

**Option space**: 3 hướng — defer (light only v1, dark v2), light-only-với-brand-hue, light+dark ngay. User chọn option 3.

---

## 2. Decision

**Decision**: Hỗ trợ **light + dark theme với tri-state toggle** (`light` | `dark` | `system`) từ MVP, persist vào `localStorage["theme"]`, áp dụng qua `.dark` class trên `<html>` theo shadcn pattern.

### 2.1 Sub-decisions

| Concern          | Choice                                                           | Lý do ngắn                                                                    |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Mechanism        | Tailwind `darkMode: "class"` + CSS vars trên `:root` và `.dark`  | shadcn pattern chuẩn; zero runtime JS cho token resolution                    |
| State model      | Tri-state: `light` / `dark` / `system`                           | Respect `prefers-color-scheme` OS mặc định; user có thể override              |
| Persistence      | `localStorage["theme"]`                                          | Đủ cho v1 (single-device per user); không cần server-side theme pref          |
| Toggle UI        | Button cycling trong AppHeader với lucide `Sun`/`Moon`/`Monitor` | 1 control duy nhất, không cần dropdown; a11y `aria-label` theo state hiện tại |
| Palette          | Default shadcn neutral (zinc/slate) cho cả 2 mode                | Không commit brand color sớm (xem ADR-002 option matrix bên dưới)             |
| Dark-mode verify | Gate 2 browser demo check 2 mode                                 | Bắt regression visual trước commit                                            |

---

## 3. Alternatives considered

| Option                             | Pros                                                          | Cons                                                              | Lý do không chọn                                              |
| ---------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| A. Light only, defer dark v2       | Nhanh nhất cho MVP; 0 infra overhead                          | Retrofit dark sau tốn hơn; mỗi screen phải re-verify visual 2 lần | User đã express preference rõ; cost retrofit > cost làm trước |
| B. Light only + chọn 1 primary hue | Tăng nhận diện brand; vẫn đơn giản                            | Commit sớm color identity chưa có thiết kế branding chính thức    | Không giải quyết issue dark mode; brand hue có thể đến sau    |
| C. Light + dark toggle (chosen)    | Cover 2 mode từ đầu; design-system dark-compat → screen cheap | Infra ~2-3h + verify 2x mỗi Gate 2                                | User chọn; infra cost 1 lần, verify cost marginal             |
| D. Full theming (nhiều palette)    | Maximum flexibility                                           | Over-engineering cho portal internal; YAGNI                       | MVP scope không cần                                           |

---

## 4. Consequences

### Positive

- Mỗi per-screen spec (login/landing/detail/search) reference token từ `design-system.md`, không bespoke color → dark "free".
- User internal làm việc buổi tối có dark mode ngay.
- `grep -r "#[0-9a-f]" apps/web/src/` là một guardrail đơn giản: 0 raw hex = token-clean.

### Negative / trade-off

- Thêm ~2-3h vào T8.5 task mới (ThemeProvider + ThemeToggle + CSS vars + tests).
- Gate 2 browser demo mỗi FE task dài hơn (~1-2 phút verify dark).
- Test suite tăng: 1 file `ThemeToggle.test.tsx` + implicit 2-mode render check trong screen tests.
- Dev phải kỷ luật không dùng raw color — lint rule + CHANGELOG design-system bắt buộc.

### Neutral

- Brand color chưa chọn → vẫn dùng neutral shadcn palette. Sau pilot nếu cần brand hue thì thêm token `--primary-brand` một lần.

---

## 5. Risks & mitigations

| Risk                                                      | Impact | Mitigation                                                                     |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Dev commit bespoke color khó bắt                          | Med    | Lint quick check + Gate 1 spec review + CHANGELOG design-system                |
| Screen trông tốt ở light, vỡ ở dark                       | Med    | Gate 2 mandatory 2-mode check; E2E Playwright (T10) có thể thêm snapshot sau   |
| Icon contrast không đủ ở 1 mode                           | Low    | lucide-react stroke = `currentColor`; token đã set contrast ≥ 4.5:1            |
| localStorage disabled (incognito, strict privacy) → crash | Low    | `useTheme` fallback `"system"`, không throw; test cover case localStorage fail |
| System preference thay đổi khi đang mở app                | Low    | `matchMedia("(prefers-color-scheme: dark)")` listener trong ThemeProvider      |

---

## 6. Validation criteria

Tạo ADR-003 + supersede nếu:

- Pilot feedback (M3) yêu cầu brand color / multi-theme → mở rộng thành theme system.
- Cost duy trì dark mode > expected (screen bespoke color lặp lại) → cân nhắc drop dark cho v1.1.
- Có yêu cầu server-side theme persist (multi-device) → state model thay đổi.

---

## 7. References

- [shadcn theming docs](https://ui.shadcn.com/docs/theming)
- [Tailwind darkMode class strategy](https://tailwindcss.com/docs/dark-mode)
- Internal: [ADR-001 §FE stack](ADR-001-tech-stack.md), [design-system.md](../ui/design-system.md), [US-001 AC-1](../stories/US-001.md)
