import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createUsersRouter } from "../../src/routes/users.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";

function buildApp() {
  const userRepo = createUserRepo(db);

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
    usersRouter: createUsersRouter({ userRepo, requireAuth }),
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

describe("GET /api/v1/users (US-005 / FR-USER-001)", () => {
  it("returns 401 without session", async () => {
    const res = await request(buildApp()).get("/api/v1/users");
    expect(res.status).toBe(401);
  });

  it("returns user list with id + displayName + role only", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const admin = res.body.data.find((u: { displayName: string }) => u.displayName === "Admin");
    expect(admin).toBeDefined();
    expect(admin).toMatchObject({
      id: expect.any(String),
      displayName: "Admin",
      role: "admin",
    });
    // Sensitive fields must NOT be present.
    expect(admin).not.toHaveProperty("email");
    expect(admin).not.toHaveProperty("passwordHash");
    expect(admin).not.toHaveProperty("createdAt");
  });

  it("filters by role=admin", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users?role=admin");
    expect(res.status).toBe(200);
    expect(res.body.data.every((u: { role: string }) => u.role === "admin")).toBe(true);
  });

  it("filters by q (ILIKE displayName)", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users?q=adm");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(
      res.body.data.every((u: { displayName: string }) =>
        u.displayName.toLowerCase().includes("adm"),
      ),
    ).toBe(true);
  });

  it("returns 400 VALIDATION_ERROR for invalid role", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users?role=superadmin");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("sorts displayName ascending", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users");
    const names: string[] = res.body.data.map((u: { displayName: string }) => u.displayName);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
