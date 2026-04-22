import { describe, it, expect, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { z } from "zod";
import { requireAuth } from "../../src/middleware/requireAuth.js";
import { zodValidate } from "../../src/middleware/zodValidate.js";
import { createRateLimit } from "../../src/middleware/rateLimit.js";
import { errorHandler } from "../../src/errors.js";

function appWith(mount: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  mount(app);
  app.use(errorHandler);
  return app;
}

describe("requireAuth middleware", () => {
  it("returns 401 UNAUTHENTICATED when no session.userId", async () => {
    const app = appWith((a) => {
      a.use((req, _res, next) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).session = {};
        next();
      });
      a.get("/private", requireAuth, (_req, res) => res.json({ ok: true }));
    });

    const res = await request(app).get("/private");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("calls next() when session.userId present", async () => {
    const app = appWith((a) => {
      a.use((req, _res, next) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).session = { userId: "u-1" };
        next();
      });
      a.get("/private", requireAuth, (_req, res) => res.json({ ok: true }));
    });

    const res = await request(app).get("/private");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("zodValidate middleware", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("returns 400 VALIDATION_ERROR with issues when body fails parse", async () => {
    const app = appWith((a) => {
      a.post("/echo", zodValidate({ body: schema }), (req, res) => res.json(req.body));
    });

    const res = await request(app).post("/echo").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details.issues)).toBe(true);
  });

  it("passes through when body is valid", async () => {
    const app = appWith((a) => {
      a.post("/echo", zodValidate({ body: schema }), (req, res) => res.json(req.body));
    });

    const res = await request(app).post("/echo").send({ name: "Lan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Lan" });
  });
});

describe("createRateLimit middleware", () => {
  it("returns 429 RATE_LIMITED after max hits in window", async () => {
    const store = new Map<string, number>();
    const fakeRedis = {
      incr: async (key: string) => {
        const next = (store.get(key) ?? 0) + 1;
        store.set(key, next);
        return next;
      },
      expire: vi.fn(async () => 1),
    };

    const limiter = createRateLimit({
      redis: fakeRedis,
      keyFn: (req) => `test:${req.ip}`,
      max: 2,
      windowSec: 60,
    });

    const app = appWith((a) => {
      a.get("/hit", limiter, (_req, res) => res.json({ ok: true }));
    });

    const first = await request(app).get("/hit");
    const second = await request(app).get("/hit");
    const third = await request(app).get("/hit");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });
});
