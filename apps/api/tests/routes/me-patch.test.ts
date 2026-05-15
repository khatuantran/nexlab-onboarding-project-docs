import { afterAll, afterEach, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createMeRouter } from "../../src/routes/me.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { users } from "../../src/db/schema.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

const fakeCloudinary: CloudinaryClient = {
  isConfigured: () => true,
  async uploadImage(input) {
    return {
      publicId: input.publicId,
      secureUrl: "https://example.com/img.png",
      bytes: input.buffer.length,
      format: "png",
      version: 1,
    };
  },
};

const fakeRedis = {
  scan: async () => ["0", []] as [string, string[]],
  get: async () => null,
  del: async () => 0,
};

function buildApp() {
  const userRepo = createUserRepo(db);
  const fakeRateRedis: RateLimitClient = { incr: async () => 1, expire: async () => 1 };
  const requireAuth = createRequireAuth(userRepo);
  const sessionMiddleware = session({
    name: "sid",
    secret: "test-secret-min-16-chars-aaaaa",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false },
  });
  return createApp({
    dbCheck: async () => "ok",
    redisCheck: async () => "ok",
    version: "test",
    sessionMiddleware,
    authRouter: createAuthRouter({
      userRepo,
      loginRateLimit: createRateLimit({
        redis: fakeRateRedis,
        keyFn: (req) => `login:${req.ip}`,
        max: 100,
        windowSec: 60,
      }),
    }),
    meRouter: createMeRouter({
      userRepo,
      requireAuth,
      redis: fakeRedis,
      cloudinary: fakeCloudinary,
      cloudinaryAvatarsFolder: "onboarding-portal/test/avatars",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

// Restore display names after each test so the seeded fixtures stay clean.
afterEach(async () => {
  await db.update(users).set({ displayName: "Admin" }).where(eq(users.email, "admin@local"));
  await db.update(users).set({ displayName: "Dev" }).where(eq(users.email, "dev@local"));
});

afterAll(async () => {
  await pool.end();
});

describe("PATCH /api/v1/me (US-009 / T2)", () => {
  it("returns 200 + updates displayName for the session user", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({ displayName: "Admin Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe("Admin Renamed");

    const verify = await agent.get("/api/v1/me");
    expect(verify.body.data.displayName).toBe("Admin Renamed");
  });

  it("does not leak into another user — author update leaves admin row intact", async () => {
    const author = await loginAs("dev@local");
    await author.patch("/api/v1/me").send({ displayName: "Dev Renamed" });

    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me");
    expect(res.body.data.displayName).toBe("Admin");
  });

  it("returns 400 VALIDATION_ERROR on empty body", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR on extra fields (strict schema)", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({ displayName: "OK", role: "admin" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp()).patch("/api/v1/me").send({ displayName: "Anon" });
    expect(res.status).toBe(401);
  });
});
