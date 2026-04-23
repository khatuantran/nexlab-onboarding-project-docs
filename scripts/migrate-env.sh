#!/usr/bin/env bash
# Migrate legacy root .env.local → per-layer files (CR-001, amended).
#
# Reads the old flat .env.local at repo root and distributes each variable
# into the correct layer file:
#   - POSTGRES_* / REDIS_PORT        → infra/docker/.env
#   - VITE_*                         → apps/web/.env.local
#   - everything else (API_*, DB, REDIS_URL, SESSION_*, UPLOAD_*, NODE_ENV,
#     LOG_LEVEL)                     → apps/api/.env
#
# Idempotent: skips variables already present in the target file.
# Safe: never deletes the source .env.local; you remove it manually once happy.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.env.local"

if [[ ! -f "$SRC" ]]; then
  echo "No $SRC found — nothing to migrate. Copy per-layer templates directly:"
  echo "  cp infra/docker/.env.example infra/docker/.env"
  echo "  cp apps/api/.env.example     apps/api/.env"
  echo "  cp apps/web/.env.example     apps/web/.env.local"
  exit 0
fi

INFRA="$ROOT/infra/docker/.env"
API="$ROOT/apps/api/.env"
WEB="$ROOT/apps/web/.env.local"

touch "$INFRA" "$API" "$WEB"

append_if_missing() {
  local key="$1" value="$2" target="$3"
  if grep -qE "^${key}=" "$target" 2>/dev/null; then
    echo "  = ${key} already in $(basename "$(dirname "$target")")/$(basename "$target"), skip"
  else
    printf '%s=%s\n' "$key" "$value" >> "$target"
    echo "  + ${key} → $target"
  fi
}

echo "Migrating $SRC → per-layer files..."
while IFS= read -r line || [[ -n "$line" ]]; do
  # Strip comments and blank lines.
  [[ -z "${line// }" ]] && continue
  [[ "${line#\#}" != "$line" ]] && continue

  key="${line%%=*}"
  value="${line#*=}"
  key="${key// /}"

  case "$key" in
    POSTGRES_*|REDIS_PORT)
      append_if_missing "$key" "$value" "$INFRA" ;;
    VITE_*)
      append_if_missing "$key" "$value" "$WEB" ;;
    API_PORT|NODE_ENV|LOG_LEVEL|DATABASE_URL|REDIS_URL|SESSION_*|COOKIE_SECURE|UPLOAD_*)
      append_if_missing "$key" "$value" "$API" ;;
    *)
      echo "  ? unknown key '$key' — skipped (add manually if needed)" >&2 ;;
  esac
done < "$SRC"

echo ""
echo "Done. Review the three new files, then remove the legacy one:"
echo "  rm $SRC"
