#!/usr/bin/env node
// Regression harness for infra env loading (BUG-001 + CR-001).
//
// Verifies `pnpm docker:up` command lets compose pick up
// infra/docker/.env so that ${POSTGRES_PORT:-5432} honors overrides.
//
// Strategy: read command from package.json#scripts["docker:up"], swap
// `up -d` → `config --format json`, spawn, assert postgres published port
// matches POSTGRES_PORT from a temporary infra/docker/.env.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INFRA_ENV = resolve(ROOT, "infra/docker/.env");
const INFRA_ENV_BACKUP = resolve(ROOT, "infra/docker/.env.cr001-backup");
const EXPECTED_PORT = "5433";

function cleanup() {
  try {
    if (existsSync(INFRA_ENV)) unlinkSync(INFRA_ENV);
  } catch {
    /* ignore */
  }
  if (existsSync(INFRA_ENV_BACKUP)) {
    renameSync(INFRA_ENV_BACKUP, INFRA_ENV);
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const upCmd = pkg.scripts["docker:up"];
if (!upCmd) {
  console.error("FAIL: package.json has no docker:up script");
  process.exit(1);
}

const configCmd = upCmd.replace(/\bup\s+-d\b/, "config --format json");
if (configCmd === upCmd) {
  console.error("FAIL: could not rewrite docker:up → config (script format changed?)");
  process.exit(1);
}

if (existsSync(INFRA_ENV)) renameSync(INFRA_ENV, INFRA_ENV_BACKUP);
writeFileSync(INFRA_ENV, `POSTGRES_PORT=${EXPECTED_PORT}\nREDIS_PORT=6390\n`, "utf8");

const [bin, ...args] = configCmd.split(/\s+/);
const result = spawnSync(bin, args, { cwd: ROOT, encoding: "utf8" });

if (result.status !== 0) {
  console.error("FAIL: docker compose config exited non-zero");
  console.error(result.stderr);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch {
  console.error("FAIL: could not parse compose config JSON");
  console.error(result.stdout.slice(0, 500));
  process.exit(1);
}

const pgPorts = parsed?.services?.postgres?.ports ?? [];
const pgPublished = pgPorts.map((p) => String(p.published ?? ""));
if (!pgPublished.includes(EXPECTED_PORT)) {
  console.error(
    `FAIL: postgres published port expected ${EXPECTED_PORT}, got [${pgPublished.join(", ") || "none"}]`,
  );
  console.error("→ docker:up is not loading infra/docker/.env (CR-001).");
  process.exit(1);
}

console.log(
  `PASS: postgres binds ${EXPECTED_PORT} when POSTGRES_PORT override set in infra/docker/.env`,
);
