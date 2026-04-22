import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns 200 with status=ok when db and redis are both ok", async () => {
    const app = createApp({
      dbCheck: async () => "ok",
      redisCheck: async () => "ok",
      version: "0.1.0",
    });

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      db: "ok",
      redis: "ok",
      version: "0.1.0",
    });
  });

  it("reports status=degraded when db check fails", async () => {
    const app = createApp({
      dbCheck: async () => "error",
      redisCheck: async () => "ok",
      version: "0.1.0",
    });

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "degraded", db: "error", redis: "ok" });
  });

  it("reports status=degraded when redis check fails", async () => {
    const app = createApp({
      dbCheck: async () => "ok",
      redisCheck: async () => "error",
      version: "0.1.0",
    });

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "degraded", db: "ok", redis: "error" });
  });

  it("attaches a request id header to every response", async () => {
    const app = createApp({
      dbCheck: async () => "ok",
      redisCheck: async () => "ok",
      version: "0.1.0",
    });

    const res = await request(app).get("/api/v1/health");

    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{8,}$/i);
  });
});
