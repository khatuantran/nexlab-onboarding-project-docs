#!/usr/bin/env bash
# T1 smoke test — verify monorepo tooling works end-to-end.
set -e
echo "→ pnpm lint"
pnpm -w run lint
echo "→ pnpm typecheck"
pnpm -w run typecheck
echo "→ pnpm test (passWithNoTests)"
pnpm -r run test
echo "✓ smoke OK"
