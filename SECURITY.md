# Security

*Last updated: 2026-04-22*

## Security posture v1

Internal-only portal. Trust boundary **= công ty**. V1 assume all authenticated users là trustworthy employee. Scope security controls accordingly.

Baseline controls documented in [NFR-SEC-001](.specs/02-requirements.md#nfr-sec-001--security-baseline):

- Password hash: bcryptjs cost ≥ 10.
- Session cookie: `httpOnly`, `sameSite=lax`, `secure=true` trong prod.
- Zod validation ở mọi route boundary (strict mode, reject unknown fields).
- SQL qua Drizzle parameterized queries — không string interpolation.
- Secrets qua env vars; `.env*` gitignored.
- Rate limit cho `/auth/login` (10/min/IP) chống credential stuffing.
- CORS chỉ allow origin `VITE_APP_ORIGIN`.

## Known risks

Consolidated trong [.specs/risks.md](.specs/risks.md). Security-specific:

- R7: Markdown XSS via user input → DOMPurify sanitize + CSP header.
- R8: User enumeration via auth error → mitigated (unified `INVALID_CREDENTIALS` code).
- R9: Upload path traversal / MIME spoof → magic-byte validation + UUID filename.

## Out of scope (v1)

- SSO / MFA.
- Fine-grained RBAC (role-per-project / role-per-section).
- Audit log for security events (login success/fail, section edits). Defer v2.
- Automated dependency vulnerability scan (Dependabot / Snyk). Add when going public.
- Penetration test. Internal low-risk v1.

## Reporting a vulnerability

Nếu bạn phát hiện security issue:

- **Không** mở public issue trên GitHub.
- Email: **khatuantran11@gmail.com** với tiêu đề "[SECURITY] <brief>".
- Expect response trong 3 ngày làm việc.
- Sau khi fix + verify, disclosure coordinate.

## Security updates

- Dependencies: manual review `pnpm audit` định kỳ (chưa gate CI v1).
- Critical CVE trong dep sử dụng → hotfix PR ngay, skip roadmap.
