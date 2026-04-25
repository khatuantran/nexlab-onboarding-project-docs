import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createSearchRouter } from "../../src/routes/search.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createSearchRepo } from "../../src/repos/searchRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";

function buildApp() {
  const userRepo = createUserRepo(db);
  const searchRepo = createSearchRepo(db);

  const fakeRedis: RateLimitClient = {
    incr: async () => 1,
    expire: async () => 1,
  };
  const loginRateLimit = createRateLimit({
    redis: fakeRedis,
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
    searchRouter: createSearchRouter({ searchRepo, requireAuth }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await pool.end();
});

describe("GET /api/v1/search (US-005 v2)", () => {
  it("returns 401 without session", async () => {
    const res = await request(buildApp()).get("/api/v1/search?q=demo");
    expect(res.status).toBe(401);
  });

  it("returns 400 SEARCH_QUERY_EMPTY when q is missing", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SEARCH_QUERY_EMPTY");
  });

  it("returns 400 SEARCH_QUERY_TOO_LONG when q > 200 chars", async () => {
    const agent = await loginAs("admin@local");
    const long = "a".repeat(201);
    const res = await agent.get(`/api/v1/search?q=${long}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SEARCH_QUERY_TOO_LONG");
  });

  it("returns grouped data shape with all 5 keys present", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=onboard");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Object.keys(res.body.data).sort()).toEqual([
      "authors",
      "features",
      "projects",
      "sections",
      "uploads",
    ]);
  });

  it("matches Demo project in projects group by description", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=onboard");
    const demo = res.body.data.projects.find((p: { slug: string }) => p.slug === "demo");
    expect(demo).toBeDefined();
    expect(demo).toMatchObject({
      slug: "demo",
      name: expect.any(String),
      snippet: expect.any(String),
      featureCount: expect.any(Number),
      rank: expect.any(Number),
    });
  });

  it("returns 400 VALIDATION_ERROR for invalid sectionTypes value", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=demo&sectionTypes=not-a-section-type");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for invalid status value", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=demo&status=bogus");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for non-UUID authorId", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=demo&authorId=not-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("sectionTypes filter applies — feature group only contains matching", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/search?q=đăng nhập&sectionTypes=user-flow");
    expect(res.status).toBe(200);
    // Sections array (if any) should all be user-flow.
    for (const s of res.body.data.sections) {
      expect(s.sectionType).toBe("user-flow");
    }
  });

  it("future updatedSince zeros out every group", async () => {
    const agent = await loginAs("admin@local");
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const res = await agent.get(`/api/v1/search?q=demo&updatedSince=${encodeURIComponent(future)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.projects).toHaveLength(0);
    expect(res.body.data.features).toHaveLength(0);
    expect(res.body.data.sections).toHaveLength(0);
    expect(res.body.data.uploads).toHaveLength(0);
  });
});
