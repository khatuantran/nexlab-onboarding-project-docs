import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createUserSkillsRepo } from "../../src/repos/userSkillsRepo.js";
import { createUserStatsRepo } from "../../src/repos/userStatsRepo.js";
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
  destroyImage: async () => {},
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
      userStatsRepo: createUserStatsRepo(db),
      userSkillsRepo: createUserSkillsRepo(db),
      userRepo,
      requireAuth,
      redis: fakeRedis,
      cloudinary: fakeCloudinary,
      cloudinaryAvatarsFolder: "onboarding-portal/test/avatars",
      cloudinaryUserCoversFolder: "onboarding-portal/test/covers/users",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

// Restore display names + clear US-010 enrichment fields after each test so the seeded fixtures stay clean.
afterEach(async () => {
  await db
    .update(users)
    .set({
      displayName: "Admin",
      phone: null,
      department: null,
      location: null,
      bio: null,
    })
    .where(eq(users.email, "admin@local"));
  await db
    .update(users)
    .set({
      displayName: "Dev",
      phone: null,
      department: null,
      location: null,
      bio: null,
    })
    .where(eq(users.email, "dev@local"));
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

describe("PATCH /api/v1/me — US-010 profile enrichment (phone/dept/location/bio)", () => {
  it("AC-2: accepts 4 new fields and persists them", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({
      phone: "0912345678",
      department: "Dev",
      location: "HN",
      bio: "Hello world",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("0912345678");
    expect(res.body.data.department).toBe("Dev");
    expect(res.body.data.location).toBe("HN");
    expect(res.body.data.bio).toBe("Hello world");

    const verify = await agent.get("/api/v1/me");
    expect(verify.body.data.phone).toBe("0912345678");
    expect(verify.body.data.bio).toBe("Hello world");
  });

  it("AC-3: partial update preserves other fields", async () => {
    const agent = await loginAs("admin@local");
    await agent.patch("/api/v1/me").send({
      phone: "0900000001",
      department: "B",
      location: "C",
      bio: "D",
    });
    const res = await agent.patch("/api/v1/me").send({ phone: "0900000002" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("0900000002");
    expect(res.body.data.department).toBe("B");
    expect(res.body.data.location).toBe("C");
    expect(res.body.data.bio).toBe("D");
  });

  it("AC-4: explicit null clears a previously-set field", async () => {
    const agent = await loginAs("admin@local");
    await agent.patch("/api/v1/me").send({ phone: "0900000000" });
    const res = await agent.patch("/api/v1/me").send({ phone: null });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBeNull();
  });

  it("AC-5: rejects invalid phone format with 400 VALIDATION_ERROR", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({ phone: "abc!" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-6: rejects over-length bio (>500) with 400 VALIDATION_ERROR", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.patch("/api/v1/me").send({ bio: "x".repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /me returns 4 nullable fields (null when never set)", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/me");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("phone");
    expect(res.body.data).toHaveProperty("department");
    expect(res.body.data).toHaveProperty("location");
    expect(res.body.data).toHaveProperty("bio");
    expect(res.body.data.phone).toBeNull();
  });
});
