import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const envFile = path.join(apiRoot, ".env.local");
const backup = path.join(apiRoot, ".env.local.cr001-backup");
const SENTINEL_KEY = "CR001_ENV_LOADER_SENTINEL";

describe("apps/api env loader (CR-001)", () => {
  beforeEach(() => {
    if (existsSync(envFile)) renameSync(envFile, backup);
    writeFileSync(envFile, `${SENTINEL_KEY}=ok\n`);
    delete process.env[SENTINEL_KEY];
  });

  afterEach(() => {
    if (existsSync(envFile)) unlinkSync(envFile);
    if (existsSync(backup)) renameSync(backup, envFile);
    delete process.env[SENTINEL_KEY];
  });

  it("env.ts side-effect populates process.env from apps/api/.env.local", async () => {
    // Cache-bust dynamic import so side effect re-runs across test runs.
    const url = new URL(`../../src/env.ts?t=${Date.now()}`, import.meta.url).href;
    await import(/* @vite-ignore */ url);

    expect(process.env[SENTINEL_KEY]).toBe("ok");
  });
});
