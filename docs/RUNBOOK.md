# Production Runbook

> Operational guide for the M3 free-tier deployment per [CR-003](../.specs/changes/CR-003.md) + [ADR-002](../.specs/adr/ADR-002-deployment-platform.md).

Stack: **Netlify** (FE) + **Fly.io** (BE) + **Neon** (Postgres) + **Upstash** (Redis) + **Fly persistent volume** (uploads). Region SIN for everything but Netlify (global edge).

---

## 1. First-time setup (one-time, ~1-2h)

Done once per environment. After this, deploys flow through CI/CD (Section 3).

### 1.1 Neon (Postgres)

1. Sign up at <https://console.neon.tech> (auth via GitHub).
2. Create project `onboarding-prod`, region **Singapore (ap-southeast-1)**.
3. After provisioning: Settings → Connection Details → copy the **Pooled connection** string.
   - Format: `postgresql://<user>:<pass>@ep-xxx-pooler.<region>.aws.neon.tech/<db>?sslmode=require`.
4. (Optional) Settings → Backups → enable PITR (free 7 days history).
5. Save the URL into a password manager — we'll inject it into Fly secrets in §1.4.

### 1.2 Upstash (Redis)

1. Sign up at <https://console.upstash.com> (auth via GitHub).
2. Create database:
   - Type: **Regional**.
   - Region: **AP-SOUTHEAST-1 (Singapore)**.
   - Eviction: `noeviction` (or `LRU` if hot-key risk).
3. After provisioning: Details → copy the **rediss://** connection URL (TLS).
4. Save the URL.

### 1.3 Netlify (FE)

1. Sign up at <https://app.netlify.com> (auth via GitHub).
2. **Add new site** → **Import an existing project** → **Deploy with GitHub** → authorize → pick this repo.
3. Branch to deploy: `main`. Build settings auto-pull from repo-root [`netlify.toml`](../netlify.toml):
   - Base directory: (blank)
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @onboarding/web build`
   - Publish directory: `apps/web/dist`
   - Node 20 + pnpm 9.15.0 set via `[build.environment]`.
   - SPA `[[redirects]]` rule already in `netlify.toml` so React Router deep-links don't 404.
4. **Site settings → Build & deploy → Environment variables**:
   - `VITE_API_BASE_URL` = `https://onboarding-api.fly.dev/api/v1` (update after Fly app exists).
5. Click **Deploy site** → first build runs automatically. URL: `https://<random-slug>.netlify.app`.
6. (Optional) **Site settings → Site information → Change site name** to `onboarding-portal` (or similar) for a stable subdomain.

### 1.4 Fly.io (BE)

Install `flyctl` locally:

```bash
curl -L https://fly.io/install.sh | sh
fly auth signup            # or: fly auth login
```

Provision the app — `fly launch` reads `apps/api/fly.toml` but rewrites it with the chosen app name (and may strip our comments). Run from repo root and accept the rewrite, then restore the comments via git diff if needed:

```bash
fly launch --no-deploy --copy-config --config apps/api/fly.toml
```

Pick a unique app name when prompted (default `onboarding-api` may be taken — Fly will suggest `onboarding-api-<random>`). Confirm:

- Region: **sin**.
- Postgres: **No** (we use Neon).
- Redis: **No** (we use Upstash).

Create the persistent volume for uploads:

```bash
fly volumes create uploads_volume --region sin --size 3
```

Set secrets (one-shot — values won't show in logs):

```bash
fly secrets set \
  DATABASE_URL="<neon pooled url from §1.1>" \
  REDIS_URL="<upstash rediss url from §1.2>" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  SESSION_COOKIE_NAME=sid \
  COOKIE_SECURE=true \
  CORS_ORIGIN="https://<netlify-slug>.netlify.app" \
  UPLOAD_DIR=/data/uploads \
  NODE_ENV=production \
  LOG_LEVEL=info
```

Deploy from repo root (the Dockerfile expects workspace files like `pnpm-lock.yaml` and `packages/shared/` so the build context must be the repo root, not `apps/api/`):

```bash
fly deploy --remote-only --config apps/api/fly.toml
```

The release_command in fly.toml runs `pnpm db:migrate:prod` against Neon before traffic swaps. If it fails, the previous release keeps serving — investigate via `fly logs`.

Once green, hit the health endpoint:

```bash
curl https://onboarding-api.fly.dev/api/v1/health
# {"status":"ok","db":"ok","redis":"ok","version":"0.1.0"}
```

### 1.5 Seed the production database (first time only)

```bash
fly ssh console -C "node --import tsx apps/api/src/db/seed.ts"
```

This creates `admin@local` / `dev12345` and the demo project. Pilot fixtures (Daikin KTV / Vietnam / A3) seed by default; add `SEED_MINIMAL=1` to skip them.

⚠️ **Rotate the admin password** before sharing the URL with pilot users.

### 1.6 Wire CI deploy token

```bash
fly tokens create deploy -a onboarding-api
# copy the printed token
```

GitHub repo → Settings → Secrets and variables → Actions → New repo secret:

- Name: `FLY_API_TOKEN`
- Value: `<token>`

After this, `git push origin main` (when `apps/api/**` or `packages/shared/**` changes) auto-deploys via [.github/workflows/deploy-be.yml](../.github/workflows/deploy-be.yml).

---

## 2. Daily operations

### 2.1 View logs

```bash
fly logs -a onboarding-api                      # streaming
fly logs -a onboarding-api --no-tail | tail -200 # last 200 lines
```

Netlify: dashboard → site → **Deploys** → click a deploy → **Deploy log**. Build logs streamable while running.

### 2.2 Rollback BE

```bash
fly releases -a onboarding-api                  # list versions
fly releases rollback v<N> -a onboarding-api    # roll forward to a prior good version
```

Rollback FE: Netlify → site → **Deploys** → click an older successful deploy → **Publish deploy**. Takes effect within seconds (CDN purge).

### 2.3 Restart BE

```bash
fly machines restart -a onboarding-api
```

Useful when Redis or Postgres credentials rotated and machines hold stale connections.

### 2.4 Rotate secrets

```bash
fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" -a onboarding-api
# Setting a secret triggers an automatic deploy + restart.
```

For Neon / Upstash credential rotation: rotate at provider first, then update Fly secret.

### 2.5 Open a one-off shell

```bash
fly ssh console -a onboarding-api
# inside container:
cd /app
node --import tsx apps/api/src/db/seed.ts
```

### 2.6 Manual database backup

```bash
fly ssh console -a onboarding-api -C 'pg_dump $DATABASE_URL > /data/backup.sql'
fly ssh sftp shell -a onboarding-api
# get /data/backup.sql .
```

Neon's PITR (Settings → Backups) covers 7 days of history automatically. Manual `pg_dump` recommended weekly for off-platform copy.

### 2.7 Reset / re-seed (destructive)

```bash
# Connect to Neon and drop everything (careful):
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations + seed:
fly ssh console -a onboarding-api -C 'pnpm --filter @onboarding/api db:migrate:prod'
fly ssh console -a onboarding-api -C 'node --import tsx apps/api/src/db/seed.ts'
```

---

## 3. CI/CD flow

| Push to `main` touches…                      | Triggers                                        | Result                                 |
| -------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| `apps/web/**` or `netlify.toml`              | Netlify auto-build                              | New FE deploy live in ~2 min           |
| `apps/api/**` or `packages/shared/**`        | GitHub Actions `deploy-be.yml`                  | Fly deploy + release_command (migrate) |
| `apps/api/Dockerfile` or `apps/api/fly.toml` | Same as above                                   | Same                                   |
| Other branches / PRs                         | Netlify deploy preview; no Fly preview (manual) | Preview URL posted as PR check         |

---

## 4. Quotas to watch

| Resource                 | Free quota                     | Alert at                                    |
| ------------------------ | ------------------------------ | ------------------------------------------- |
| Fly compute              | 3 shared-cpu-1x VMs (we use 1) | OK indefinitely                             |
| Fly volume               | 3 GB                           | Migrate to R2 at 2.5 GB                     |
| Neon storage             | 0.5 GB                         | 0.4 GB → migrate to Fly Postgres or upgrade |
| Neon compute             | 100 CU-hours/mo                | Watch dashboard, opt scale-to-zero          |
| Upstash Redis            | 10k commands/day               | 7k → consider in-process session cache      |
| Netlify                  | 100 GB BW/mo, 300 build min/mo | 80 GB / 240 min → coalesce CI               |
| GitHub Actions (private) | 2000 min/mo                    | 1500 → cache pnpm store                     |

Status pages to bookmark:

- <https://status.fly.io>
- <https://status.neon.tech>
- <https://status.upstash.com>
- <https://www.netlifystatus.com>

---

## 5. Triggers to revisit ADR-002

Per [ADR-002 §6](../.specs/adr/ADR-002-deployment-platform.md), supersede the deployment when ANY of:

- > 200 active users in 30 days,
- DB > 3 GB,
- free tier policy change unfavorable,
- multi-region needed,
- SLA / compliance contract requires guarantees free tier doesn't cover.

Fallback path documented in ADR-002 §5: Hetzner CX11 €4/mo + Aiven Postgres or self-host.

---

## 6. Known issues / FAQs

**Q. First request after idle takes 3-4 seconds.**  
A. Cold start: Fly machine wake (~1-2s) + Neon compute resume (~500ms-2s). Mitigation per [risks.md R12](../.specs/risks.md): bump `min_machines_running = 1` in `fly.toml` (still inside free 3 VM allowance) and/or run a cron `/health` ping every 5 min during business hours.

**Q. Login succeeds but every request 401s.**  
A. Cookie `sameSite` issue. Verify `NODE_ENV=production` is set in Fly secrets — production path forces `sameSite: "none"` + `secure: true` for cross-site `netlify.app` ↔ `fly.dev` cookies. See [CR-003 / Phase 2 T5 commit](#) `683e1c3`.

**Q. Migration fails on deploy.**  
A. release_command failure aborts the swap; previous release keeps serving. Inspect via `fly logs`. Fix migration, push, retry.

**Q. Upstash hits 10k cmd/day.**  
A. Each authenticated request hits Redis ≥ 1× (session). 50 active users × ~50 actions/day = 2500 cmd/day. If quota exhausted, requests fail-fast (no offline queue). Upgrade Upstash to pay-as-you-go ($0.20/100k cmd) or implement per-process session cache.

---

## 7. Production checklist (each major release)

- [ ] `pnpm smoke` green locally (lint + typecheck + tests).
- [ ] `pnpm test:e2e` green against test DB.
- [ ] CHANGELOG.md `[Unreleased]` updated.
- [ ] Push to `main` → CI green → Fly deploy success.
- [ ] `curl /api/v1/health` returns ok/ok/ok.
- [ ] Smoke browser flow (login → catalog → feature → search).
- [ ] No new logs at level ≥ error in first 5 min after deploy.
