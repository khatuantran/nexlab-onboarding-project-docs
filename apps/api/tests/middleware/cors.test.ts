import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/**
 * CORS allowlist regression (CR-003 / Phase 2 T4).
 *
 * `config.CORS_ORIGIN` is a comma-separated allowlist. Origin not in
 * the list must be rejected; allowed origins must echo
 * Access-Control-Allow-Origin + credentials.
 *
 * `config` is imported once and Zod-validated at module load, so we
 * mock the loadConfig path via vi.doMock before re-importing app.
 */

afterEach(() => {
  vi.resetModules();
});

async function buildAppWithCors(originList: string) {
  process.env.CORS_ORIGIN = originList;
  vi.resetModules();
  const { createApp: factory } = await import("../../src/app.js");
  return factory({
    dbCheck: async () => "ok",
    redisCheck: async () => "ok",
    version: "test",
  });
}

describe("CORS allowlist", () => {
  it("allows an origin in the comma-separated list", async () => {
    const app = await buildAppWithCors("https://app.pages.dev,https://staging.pages.dev");

    const res = await request(app).get("/api/v1/health").set("Origin", "https://app.pages.dev");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://app.pages.dev");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("rejects an origin not in the allowlist", async () => {
    const app = await buildAppWithCors("https://app.pages.dev");

    const res = await request(app).get("/api/v1/health").set("Origin", "https://evil.example.com");

    // cors() denies by NOT setting the Access-Control-Allow-Origin
    // header; the request itself still completes. Browsers enforce the
    // boundary; servers just signal which origins they trust.
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests without an Origin header (server-to-server / curl)", async () => {
    const app = await buildAppWithCors("https://app.pages.dev");

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
  });
});

// Restore default for other tests.
afterEach(() => {
  delete process.env.CORS_ORIGIN;
});
