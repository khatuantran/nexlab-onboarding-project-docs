#!/usr/bin/env node
// Regression harness for BUG-001:
// Verifies `pnpm docker:up` script loads repo-root .env.local so that
// compose variable substitution (${POSTGRES_PORT:-5432}) honors overrides.
//
// Strategy: read command from package.json#scripts["docker:up"], swap
// `up -d` → `config --format json`, spawn, assert postgres published port
// matches POSTGRES_PORT from a temp env file.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMP_ENV = resolve(ROOT, ".env.local.bug001-test");
const REAL_ENV = resolve(ROOT, ".env.local");
const REAL_ENV_BACKUP = resolve(ROOT, ".env.local.bug001-backup");
const EXPECTED_PORT = "5433";

function cleanup() {
  if (existsSync(TEMP_ENV)) unlinkSync(TEMP_ENV);
  if (existsSync(REAL_ENV_BACKUP)) {
    if (existsSync(REAL_ENV)) unlinkSync(REAL_ENV);
    renameSync(REAL_ENV_BACKUP, REAL_ENV);
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

// Read docker:up command from package.json (source of truth).
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const upCmd = pkg.scripts["docker:up"];
if (!upCmd) {
  console.error("FAIL: package.json has no docker:up script");
  process.exit(1);
}

// Swap action: "up -d" → "config --format json".
const configCmd = upCmd.replace(/\bup\s+-d\b/, "config --format json");
if (configCmd === upCmd) {
  console.error("FAIL: could not rewrite docker:up → config (script format changed?)");
  process.exit(1);
}

// Write temp env file with override.
writeFileSync(TEMP_ENV, `POSTGRES_PORT=${EXPECTED_PORT}\nREDIS_PORT=6390\n`, "utf8");

// Back up real .env.local (script may point at it); swap in temp so
// substitution is deterministic regardless of real file content.
if (existsSync(REAL_ENV)) renameSync(REAL_ENV, REAL_ENV_BACKUP);
renameSync(TEMP_ENV, REAL_ENV);

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
} catch (err) {
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
  console.error("→ docker:up script is not loading repo-root .env.local (BUG-001).");
  process.exit(1);
}

console.log(`PASS: postgres binds ${EXPECTED_PORT} when POSTGRES_PORT override set in .env.local`);
