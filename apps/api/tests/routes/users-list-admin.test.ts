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

/**
 * US-007 / T2 — admin response shape gating + detail endpoint + status filter.
 * Complements `users-list.test.ts` which covers the non-admin baseline contract.
 */

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

describe("GET /api/v1/users — admin shape (US-007 / T2)", () => {
  it("returns AdminUser shape when caller is admin", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/users");
    expect(res.status).toBe(200);
    const admin = res.body.data.find((u: { email?: string }) => u.email === "admin@local");
    expect(admin).toBeDefined();
    expect(admin).toMatchObject({
      id: expect.any(String),
      email: "admin@local",
      displayName: "Admin",
      role: "admin",
      archivedAt: null,
      // lastLoginAt is set by auth/login (US-007 / T4 wire); type-only check.
      createdAt: expect.any(String),
    });
    expect(admin).not.toHaveProperty("passwordHash");
  });

  it("returns UserPublic shape (no email) when caller is non-admin", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users");
    expect(res.status).toBe(200);
    const found = res.body.data[0];
    expect(found).toBeDefined();
    expect(found).not.toHaveProperty("email");
    expect(found).not.toHaveProperty("archivedAt");
    expect(found).not.toHaveProperty("lastLoginAt");
  });

  it("rejects status=archived from non-admin with 403", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users?status=archived");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("accepts status=all from admin", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/users?status=all");
    expect(res.status).toBe(200);
  });

  it("admin q matches by email substring", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/users?q=admin@");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((u: { email: string }) => u.email.includes("admin@"))).toBe(true);
  });
});

describe("GET /api/v1/users/:id (US-007 / T2)", () => {
  it("returns 401 without session", async () => {
    const res = await request(buildApp()).get("/api/v1/users/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/users/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(403);
  });

  it("returns 404 USER_NOT_FOUND for unknown id", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/users/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("returns AdminUser shape for known id", async () => {
    const adminAgent = await loginAs("admin@local");
    const list = await adminAgent.get("/api/v1/users?q=dev@");
    const dev = list.body.data.find((u: { email: string }) => u.email === "dev@local");
    expect(dev).toBeDefined();
    const res = await adminAgent.get(`/api/v1/users/${dev.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: dev.id,
      email: "dev@local",
      displayName: "Dev",
      role: "author",
      archivedAt: null,
    });
  });

  it("returns 400 VALIDATION_ERROR for non-uuid id", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get("/api/v1/users/not-a-uuid");
    expect(res.status).toBe(400);
  });
});
