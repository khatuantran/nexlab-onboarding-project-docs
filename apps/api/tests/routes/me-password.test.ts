import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createUserSkillsRepo } from "../../src/repos/userSkillsRepo.js";
import { createUserStatsRepo } from "../../src/repos/userStatsRepo.js";
import session from "express-session";
import bcrypt from "bcryptjs";
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

// In-memory Redis double — tracks every key/value so the test can
// assert the session purge behaviour. Typed loosely via unknown casts
// (the route helper only touches scan/get/del; full ioredis overload
// surface is noisy and not worth replicating in tests).
type ScanFn = Parameters<
  typeof import("../../src/lib/sessionPurge.js").purgeSessionsForUserExcept
>[0]["scan"];
type GetFn = Parameters<
  typeof import("../../src/lib/sessionPurge.js").purgeSessionsForUserExcept
>[0]["get"];
type DelFn = Parameters<
  typeof import("../../src/lib/sessionPurge.js").purgeSessionsForUserExcept
>[0]["del"];
class FakeRedis {
  store = new Map<string, string>();
  scan = (async () =>
    ["0", Array.from(this.store.keys())] as [string, string[]]) as unknown as ScanFn;
  get = (async (key: string) => this.store.get(key) ?? null) as unknown as GetFn;
  del = (async (key: string) => (this.store.delete(key) ? 1 : 0)) as unknown as DelFn;
}

function buildApp(redis: FakeRedis) {
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
      userStatsRepo: createUserStatsRepo(db),
      userSkillsRepo: createUserSkillsRepo(db),
      userRepo,
      requireAuth,
      redis,
      cloudinary: fakeCloudinary,
      cloudinaryAvatarsFolder: "onboarding-portal/test/avatars",
      cloudinaryUserCoversFolder: "onboarding-portal/test/covers/users",
    }),
  });
}

async function loginAs(redis: FakeRedis, email: string, password = "dev12345") {
  const agent = request.agent(buildApp(redis));
  const res = await agent.post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

// Reset dev@local password after every test that mutates it so other suites stay green.
const RESTORE_DEV_HASH = bcrypt.hashSync("dev12345", 10);
afterEach(async () => {
  await db
    .update(users)
    .set({ passwordHash: RESTORE_DEV_HASH })
    .where(eq(users.email, "dev@local"));
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/v1/me/password (US-009 / T3)", () => {
  it("returns 204 on happy path and preserves the current session", async () => {
    const redis = new FakeRedis();
    const agent = await loginAs(redis, "dev@local");

    const res = await agent
      .post("/api/v1/me/password")
      .send({ oldPassword: "dev12345", newPassword: "freshpass123" });
    expect(res.status).toBe(204);

    // Current session still works (caller stays logged in).
    const me = await agent.get("/api/v1/me");
    expect(me.status).toBe(200);
  });

  it("purges other Redis sessions for the same user but keeps current sid", async () => {
    const redis = new FakeRedis();
    // Seed 2 fake sessions belonging to dev@local + 1 belonging to admin.
    // The route reads userId off req.user (loaded from DB by requireAuth),
    // so the only thing the purge helper cares about is the JSON userId.
    const userRepo = createUserRepo(db);
    const devUser = await userRepo.findByEmail("dev@local");
    const adminUser = await userRepo.findByEmail("admin@local");
    if (!devUser || !adminUser) throw new Error("seed users missing");

    redis.store.set(`sess:other-dev-sid`, JSON.stringify({ userId: devUser.id }));
    redis.store.set(`sess:admin-sid`, JSON.stringify({ userId: adminUser.id }));

    const agent = await loginAs(redis, "dev@local");
    await agent
      .post("/api/v1/me/password")
      .send({ oldPassword: "dev12345", newPassword: "freshpass123" });

    expect(redis.store.has(`sess:other-dev-sid`)).toBe(false);
    expect(redis.store.has(`sess:admin-sid`)).toBe(true);
  });

  it("returns 401 INVALID_CREDENTIALS on wrong old password", async () => {
    const redis = new FakeRedis();
    const agent = await loginAs(redis, "dev@local");

    const res = await agent
      .post("/api/v1/me/password")
      .send({ oldPassword: "wrong-old", newPassword: "freshpass123" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 400 VALIDATION_ERROR when newPassword < 8 chars", async () => {
    const redis = new FakeRedis();
    const agent = await loginAs(redis, "dev@local");

    const res = await agent
      .post("/api/v1/me/password")
      .send({ oldPassword: "dev12345", newPassword: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 UNAUTHENTICATED with no session", async () => {
    const res = await request(buildApp(new FakeRedis()))
      .post("/api/v1/me/password")
      .send({ oldPassword: "x", newPassword: "y2345678" });
    expect(res.status).toBe(401);
  });
});
