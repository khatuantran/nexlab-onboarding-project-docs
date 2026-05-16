import { afterAll, describe, expect, it } from "vitest";
import { createUserStatsRepo } from "../../src/repos/userStatsRepo.js";
import session from "express-session";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createMeRouter } from "../../src/routes/me.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

const fakeCloudinary: CloudinaryClient = {
  isConfigured: () => true,
  async uploadImage(input) {
    return {
      publicId: input.publicId,
      secureUrl: `https://res.cloudinary.com/test/image/upload/v1/${input.publicId}.png`,
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
  const loginRateLimit = createRateLimit({
    redis: fakeRateRedis,
    keyFn: (req) => `login:${req.ip}`,
    max: 100,
    windowSec: 60,
  });
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
    authRouter: createAuthRouter({ userRepo, loginRateLimit }),
    meRouter: createMeRouter({
      userStatsRepo: createUserStatsRepo(db),
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

afterAll(async () => {
  await pool.end();
});

describe("GET /api/v1/me (US-009 / T2)", () => {
  it("returns 200 with full AuthUser shape including avatarUrl + lastLoginAt + createdAt", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/me");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      email: "admin@local",
      role: "admin",
    });
    expect(res.body.data).toHaveProperty("avatarUrl");
    expect(res.body.data).toHaveProperty("lastLoginAt");
    expect(res.body.data).toHaveProperty("createdAt");
  });

  it("returns 200 for author role too", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/me");
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("author");
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp()).get("/api/v1/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
