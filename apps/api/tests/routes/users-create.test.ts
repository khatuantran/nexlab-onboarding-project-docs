import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { sql, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createUsersRouter } from "../../src/routes/users.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { users } from "../../src/db/schema.js";

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

const CREATED_EMAILS: string[] = [];

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterEach(async () => {
  if (CREATED_EMAILS.length === 0) return;
  await db.delete(users).where(inArray(users.email, CREATED_EMAILS));
  CREATED_EMAILS.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/v1/users (US-007 / T3 — admin invite)", () => {
  it("returns 401 without session", async () => {
    const res = await request(buildApp()).post("/api/v1/users").send({
      email: "x@nexlab.com",
      displayName: "X",
      role: "author",
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.post("/api/v1/users").send({
      email: "x@nexlab.com",
      displayName: "X",
      role: "author",
    });
    expect(res.status).toBe(403);
  });

  it("creates user with temp password and returns it once", async () => {
    const agent = await loginAs("admin@local");
    const email = `invitee+${Date.now()}@nexlab.com`;
    CREATED_EMAILS.push(email.toLowerCase());
    const res = await agent.post("/api/v1/users").send({
      email,
      displayName: "Tâm",
      role: "author",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      email: email.toLowerCase(),
      displayName: "Tâm",
      role: "author",
      archivedAt: null,
    });
    expect(typeof res.body.data.tempPassword).toBe("string");
    expect(res.body.data.tempPassword.length).toBe(12);
    // The invitee can immediately login with the temp password.
    const agent2 = request.agent(buildApp());
    const login = await agent2
      .post("/api/v1/auth/login")
      .send({ email, password: res.body.data.tempPassword });
    expect(login.status).toBe(200);
  });

  it("returns 409 USER_EMAIL_EXISTS for duplicate email (case-insensitive)", async () => {
    const agent = await loginAs("admin@local");
    const email = `dup+${Date.now()}@nexlab.com`;
    CREATED_EMAILS.push(email.toLowerCase());
    const first = await agent
      .post("/api/v1/users")
      .send({ email, displayName: "First", role: "author" });
    expect(first.status).toBe(201);
    const second = await agent
      .post("/api/v1/users")
      .send({ email: email.toUpperCase(), displayName: "Second", role: "author" });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("USER_EMAIL_EXISTS");
  });

  it("returns 400 VALIDATION_ERROR for bad payload", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post("/api/v1/users")
      .send({ email: "not-an-email", displayName: "", role: "viewer" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
