# ADR-003 — Adopt Nexlab design system (supersede shadcn-neutral + system font stack)

<!-- template: 04-adr-template.md@0.2 -->

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-24
- **Deciders**: @khatuantran11
- **Supersedes**: partial ADR-001 (§font stack), partial ADR-002 (dark derivation source)
- **Related**: [ADR-001](ADR-001-tech-stack.md), [ADR-002](ADR-002-light-dark-theme.md), [design-system.md](../ui/design-system.md), [design-system/](../../design-system/) (uploaded UI kit), [US-003](../stories/US-003.md) (paused pending this migration)

---

## 1. Context

Sau khi M1 (US-001) + US-002 + US-004 ship với UI shadcn-neutral (grayscale) + system font stack + lucide icons, user đã chuẩn bị sẵn bộ Nexlab design system (rebrand từ Figma "A3 Solutions", orange + gold palette, Material 3-flavored) và upload vào [design-system/](../../design-system/) ở repo root. Yêu cầu: thay thế toàn bộ DS hiện tại trước khi tiếp tục US-003.

**Constraint**:

- Team 1 người (solo). Re-skin 5 shipped screens + 30+ components + 97 unit tests + 3 E2E.
- Nexlab DS là **spec + reference**, không phải drop-in code: CSS vars rgb + 7 reference components inline-style JSX + 5 SVG icons. Phải port tokens → Tailwind theme + re-style shadcn primitives.
- US-003 DoR đã drafted (3 commits `05105cb` / `54d5b88` / `dd82320`) với references token/icon sẽ cần audit lại sau migration.
- MVP timeline đã slip khỏi ban đầu (2026-05-31); pilot M3 target 2026-07-31.

**Tại sao quyết bây giờ**:

- Trước khi invest thêm vào US-003 (~12-14h) với old DS, nên chốt brand identity để tránh double re-skin.
- 5 shipped screens re-skin ngay có consistency tuyệt đối; forward-only sẽ fragment style trong M2.
- Font stack Nexlab (Roboto/Inter/Montserrat) conflict với ADR-001 system-stack decision — cần ADR để audit trail.

**Option space đã evaluate** (qua 2 vòng AskUserQuestion 2026-04-24):

1. Retro-fit shadcn primitives với Nexlab tokens (✅ chốt) vs parallel Nx\* components vs strip shadcn.
2. Convert RGB → HSL (✅ chốt) vs keep RGB vs parallel 2-format.
3. Derive dark (✅ chốt) vs drop dark vs hybrid.
4. Self-host fonts (✅ chốt) vs Google CDN vs system stack.
5. Keep lucide (✅ chốt) vs full Figma extract vs hybrid.

---

## 2. Decision

**Adopt Nexlab design system**, replacing current shadcn-neutral tokens + system font stack. Approach: retro-fit existing shadcn primitives với Nexlab visual language, giữ component API để call sites không đụng.

### 2.1 Token system

- Tokens hiện tại (`apps/web/src/styles/index.css` `:root` + `.dark`) rewritten với Nexlab palette converted RGB → HSL để giữ shadcn convention.
- Semantic mapping: `--primary` = orange-500 (`22 88% 51%`), `--secondary` = gold-500 (`38 61% 62%`), `--destructive` = error-800 (`10 100% 44%`), `--background`/`--foreground`/`--muted`/`--border` từ neutral ramp.
- Full ramps (050-900) exported cho cases cần specific step (VD `bg-primary-100` cho tinted surfaces).
- Dark variants derived từ light palette: bg/fg swap, primary lightness +15% cho dark readability.

### 2.2 Component strategy

- Shadcn primitives (`apps/web/src/components/ui/`) keep API, re-style nội dung. Button variants expand: `default` (gold, Nexlab "primary button" convention), `orange` (primary-500 cho domain primary CTAs), giữ `secondary`/`ghost`/`destructive`/`outline`.
- Radii: 8 (buttons/inputs/alerts/chips), 16 (cards), 4 (inner controls).
- Shadows: single canonical `shadow-card` (`0 2px 6px rgb(0 0 0 / 0.12), 0 0 4px rgb(0 0 0 / 0.04)`).
- Heights: button L 56 / M 44 / S 32; inputs 48.

### 2.3 Typography

- Self-host Roboto (body) + Inter (display/label) + Montserrat (wordmark only) từ Google Fonts với Latin + Vietnamese subset → `apps/web/public/fonts/`. No CDN.
- SF Pro Text cho UI chrome (buttons, fields) trên Apple, fallback Inter elsewhere.
- Type scale theo Material 3 mapping: display/headline/title/body/label, mapped vào Tailwind `fontSize` extend.
- Supersede ADR-001 §Font stack "system stack, không web font".

### 2.4 Icons

- Keep lucide-react (Nexlab README approves "close stylistic match + approved fallback"). No icon migration work.
- Brand lockup dùng NxLogo component wrap `design-system/assets/logo-nexlab.svg` + bird mark mask.

### 2.5 Dark mode

- Giữ ADR-002 mandate light+dark. Derive dark variants từ Nexlab palette (Nexlab không cung cấp dark tokens chính thức).
- Verify contrast 4.5:1 WCAG AA cho mọi fg/bg pair trong 2 mode.
- Escalate nếu derivation lệch brand identity.

---

## 3. Alternatives considered

### 3.1 Parallel Nx\* components (reject)

Tạo `NxButton` / `NxField` / `NxAlert` mới, migrate call sites screen-by-screen, shadcn primitives co-exist. **Rejected**: +1-2h per component to expose both APIs, tests gấp đôi, user confused khi debug. Nếu shadcn API đủ dùng thì clone thành Nx\* không giá trị.

### 3.2 Strip shadcn entirely (reject)

Xóa shadcn wrappers, dùng inline-style JSX giống Nexlab `components.jsx`. **Rejected**: deviate khỏi ADR-001 (shadcn/ui explicit choice), mất accessibility floor (Radix primitives, focus management, aria attrs), test code đã reference shadcn classes.

### 3.3 Forward-only migration (reject)

Giữ 5 shipped screens với shadcn-neutral, US-003+ dùng Nexlab. **Rejected** bởi user: "re-skin tất cả screens ngay". Fragment M2 style; confused user testing pilot.

### 3.4 Keep RGB tokens, skip HSL conversion (reject)

Dùng `rgb()` vars thẳng trong Tailwind. **Rejected**: shadcn ecosystem (Tailwind theme, future components) assume HSL format; conversion 1 lần tiết kiệm downstream pain.

### 3.5 Drop dark mode v1 (reject)

ADR-003 supersede ADR-002. **Rejected**: dev đọc doc muộn đêm là use case chính của ADR-002, user không muốn bỏ. Accept derivation cost (~2h).

### 3.6 Google Fonts CDN (reject)

Import fonts từ `fonts.googleapis.com` như Nexlab `colors_and_type.css`. **Rejected**: third-party dep, GDPR concern, FOUT risk. Self-host ~500 KiB acceptable cho internal tool.

---

## 4. Consequences

### 4.1 Positive

- **Brand consistency**: tất cả screens + components align với Nexlab identity ngay.
- **API stability**: shadcn primitives giữ contract → test code + call sites minimum churn.
- **Font quality**: Roboto + Inter + Montserrat render Vietnamese diacritics đúng brand (system stack OK nhưng không guarantee weight rendering).
- **Token ramps**: expose 10-step ramps (primary/secondary/error/etc.) cho downstream cases (tinted alerts, progressive disclosure).
- **Dark mode preserved**: không mất feature đã ship.

### 4.2 Negative

- **16-20h upfront cost** re-skin existing code. Không deliver user-facing feature trong migration window.
- **Visual regression without Storybook**: rely on manual smoke 5 screens × 2 modes = 10 visual checks per phase. Stockpiles fatigue.
- **Font bundle size**: ~500 KiB woff2 adds first-load weight. Acceptable internal tool nhưng nếu scale out → cần CDN.
- **Dark palette approximated**: Nexlab không official, derivation là best-guess. Contrast compliance verifiable nhưng brand-fit cần user review.
- **Class name drift in tests**: `toHaveClass("bg-primary")` vẫn pass (semantic name giữ), nhưng `toHaveStyle({ background: "rgb(...)" })` nếu có sẽ vỡ. Scan + fix.
- **US-003 DoR pause**: Phase A commits `05105cb` (feature-detail US-003 extension) + `54d5b88` (design-system icons registry) + `dd82320` (tasks.md) reference token/icon. Audit + minor edits sau Phase 6.

### 4.3 Neutral / pending

- **Tabs / Chip / Alert / Switch** components — Nexlab có, repo chưa cần (US-001..US-004 not use). Add khi feature nào cần. Không scope migration này.
- **Icon set full extract** — 115 icons trong Figma, defer v2. Lucide đủ cho hiện tại.

---

## 5. Risks & mitigations

| Risk                                                                                                                         | Mitigation                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Primary color dominance: orange primary-500 rất salient, CTAs đổi từ đen neutral → cam sáng → có thể "scream" trong UI dense | Phase 5 manual review; nếu dominant → dùng `default` variant = gold cho non-primary CTAs, `orange` chỉ cho critical primary actions     |
| Dark derivation lệch brand                                                                                                   | Escalate sau Phase 1 T-DS-3 browser test; user approve trước Phase 2                                                                    |
| Font loading FOUT trên slow network                                                                                          | `font-display: swap` + preload critical weights trong `<head>`                                                                          |
| Test suites vỡ do raw-style assertions                                                                                       | Audit trước Phase 2: `grep -r "toHaveStyle.*rgb\|getComputedStyle" apps/web/tests/`; fix hoặc soft-delete                               |
| US-003 spec drift sau migration                                                                                              | Phase 6 T-DS-14 audit + update references; tracking trong [US-003/tasks.md](../stories/US-003/tasks.md) risks                           |
| Figma access absent                                                                                                          | Rely on preview HTML + colors_and_type.css + components.jsx; compositional decisions (hero panels, 60/80px rounded corners) approximate |

---

## 6. Validation criteria

### 6.1 Foundation (Phase 1)

- `apps/web/src/styles/index.css` `:root` + `.dark` có đủ Nexlab tokens HSL.
- `apps/web/tailwind.config.ts` `theme.extend` map `colors`/`borderRadius`/`boxShadow`/`fontFamily`/`fontSize` theo Nexlab.
- `apps/web/public/fonts/` có woff2 files đủ 3 families × 4 weights × Latin+VN subset.
- `.specs/ui/design-system.md` registry rewritten reflect Nexlab.
- `pnpm smoke` xanh sau mỗi commit.

### 6.2 Components (Phase 2-4)

- Mỗi shadcn primitive re-styled, API giữ nguyên (props unchanged).
- Layout + feature components re-styled, behavior unchanged.
- Tests pass; class-name drift spot-fixed.

### 6.3 Screens (Phase 5)

- 5 shipped screens re-skinned light + dark.
- `pnpm test:e2e` 3 specs xanh (US-001 + US-002 + US-004 happy paths).
- Manual browser check mỗi screen: layout OK, contrast OK, typography match Nexlab type scale.

### 6.4 Specs + audit (Phase 6)

- Per-screen UI specs (`login.md` / `home.md` / `project-landing.md` / `feature-detail.md` / `search.md` + dialogs) token refs updated.
- US-003 `.specs/stories/US-003.md` + `tasks.md` audited; Phase A commits (`05105cb` / `54d5b88` / `dd82320`) references reconciled.
- `CHANGELOG.md` `[Unreleased]` Added entry: "Design system migrated from shadcn-neutral → Nexlab (ADR-003)".

### 6.5 End-to-end

- User browser review 5 screens ✅.
- Accessibility spot-check: focus ring primary-500 visible, contrast 4.5:1 verified DevTools.
- US-003 DoR re-confirmed Ready sau audit; TDD có thể start.

---

## 7. References

- [design-system/](../../design-system/) — uploaded UI kit folder (README, colors_and_type.css, ui_kits/web/components.jsx, assets/icons, preview/\*.html)
- [Nexlab brand guidelines](../../design-system/README.md) — content fundamentals + visual foundations + iconography
- [ADR-001 §Font stack](ADR-001-tech-stack.md) — system stack decision (superseded §Font stack only)
- [ADR-002 light+dark theme](ADR-002-light-dark-theme.md) — dark mode mandate (extended với Nexlab-derived palette)
- [design-system.md](../ui/design-system.md) — cross-screen registry (rewritten T-DS-4)
- Gate 1 AskUserQuestion thread 2026-04-24 (5 decisions locked)
