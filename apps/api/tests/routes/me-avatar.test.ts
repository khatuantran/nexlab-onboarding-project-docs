import { afterAll, beforeEach, describe, expect, it } from "vitest";
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

const PNG_1x1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbrI+wAAAABJRU5ErkJggg==";
const realPng = Buffer.from(PNG_1x1_BASE64, "base64");
const gifBuf = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

interface FakeCloudinaryState {
  configured: boolean;
  shouldFail: boolean;
  calls: Array<{ publicId: string; bytes: number }>;
}

function createFakeCloudinary(state: FakeCloudinaryState): CloudinaryClient {
  return {
    isConfigured: () => state.configured,
    async uploadImage(input) {
      state.calls.push({ publicId: input.publicId, bytes: input.buffer.length });
      if (state.shouldFail) throw new Error("simulated cloudinary outage");
      return {
        publicId: input.publicId,
        secureUrl: `https://res.cloudinary.com/test/image/upload/v1/${input.publicId}.png`,
        bytes: input.buffer.length,
        format: "png",
        version: 1,
      };
    },
  };
}

const fakeRedis = {
  scan: async () => ["0", []] as [string, string[]],
  get: async () => null,
  del: async () => 0,
};

const cloudinaryState: FakeCloudinaryState = {
  configured: true,
  shouldFail: false,
  calls: [],
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
      cloudinary: createFakeCloudinary(cloudinaryState),
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

beforeEach(async () => {
  cloudinaryState.configured = true;
  cloudinaryState.shouldFail = false;
  cloudinaryState.calls = [];
  // Clear any avatar set by a previous test on the dev seed user.
  await db.update(users).set({ avatarUrl: null }).where(eq(users.email, "dev@local"));
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/v1/me/avatar (US-009 / T3)", () => {
  it("returns 200 + persists Cloudinary URL on happy path", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent
      .post("/api/v1/me/avatar")
      .attach("file", realPng, { filename: "me.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(cloudinaryState.calls).toHaveLength(1);
    expect(cloudinaryState.calls[0]?.publicId).toMatch(/^onboarding-portal\/test\/avatars\//);

    const me = await agent.get("/api/v1/me");
    expect(me.body.data.avatarUrl).toBe(res.body.data.avatarUrl);
  });

  it("returns 415 UNSUPPORTED_MEDIA_TYPE for non-whitelisted mime (gif)", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent
      .post("/api/v1/me/avatar")
      .attach("file", gifBuf, { filename: "a.gif", contentType: "image/gif" });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns 503 UPLOADS_DISABLED when Cloudinary not configured", async () => {
    cloudinaryState.configured = false;
    const agent = await loginAs("dev@local");
    const res = await agent
      .post("/api/v1/me/avatar")
      .attach("file", realPng, { filename: "me.png", contentType: "image/png" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("UPLOADS_DISABLED");
  });

  it("returns 502 UPLOAD_PROVIDER_ERROR when Cloudinary upload throws", async () => {
    cloudinaryState.shouldFail = true;
    const agent = await loginAs("dev@local");
    const res = await agent
      .post("/api/v1/me/avatar")
      .attach("file", realPng, { filename: "me.png", contentType: "image/png" });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("UPLOAD_PROVIDER_ERROR");
  });

  it("returns 401 UNAUTHENTICATED with no session", async () => {
    const res = await request(buildApp())
      .post("/api/v1/me/avatar")
      .attach("file", realPng, { filename: "me.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("returns 400 VALIDATION_ERROR when no file attached", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.post("/api/v1/me/avatar");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
