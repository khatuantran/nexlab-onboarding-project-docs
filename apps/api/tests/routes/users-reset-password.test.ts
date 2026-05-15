import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { inArray, sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createUsersRouter } from "../../src/routes/users.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { users } from "../../src/db/schema.js";

/**
 * US-007 / T5 — admin-triggered password reset + session invalidation.
 */

let purgeCalls: string[] = [];

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
    usersRouter: createUsersRouter({
      userRepo,
      requireAuth,
      purgeUserSessions: async (id) => {
        purgeCalls.push(id);
      },
    }),
  });
}

async function loginAs(email: string, password = "dev12345") {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const CREATED_EMAILS: string[] = [];

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterEach(async () => {
  purgeCalls = [];
  if (CREATED_EMAILS.length === 0) return;
  await db.delete(users).where(inArray(users.email, CREATED_EMAILS));
  CREATED_EMAILS.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/v1/users/:id/reset-password (US-007 / T5)", () => {
  it("admin resets target user password; target logs in with new credential", async () => {
    const admin = await loginAs("admin@local");
    const email = `reset+${Date.now()}@nexlab.com`;
    const invite = await admin
      .post("/api/v1/users")
      .send({ email, displayName: "Reset", role: "author" });
    expect(invite.status).toBe(201);
    CREATED_EMAILS.push(email.toLowerCase());
    const targetId = invite.body.data.user.id as string;
    const oldPassword = invite.body.data.tempPassword as string;

    const reset = await admin.post(`/api/v1/users/${targetId}/reset-password`);
    expect(reset.status).toBe(200);
    const newPassword = reset.body.data.tempPassword as string;
    expect(typeof newPassword).toBe("string");
    expect(newPassword.length).toBe(12);
    expect(newPassword).not.toBe(oldPassword);
    // Session purge fired for the target id.
    expect(purgeCalls).toEqual([targetId]);

    // Old password no longer works.
    const oldLogin = await request(buildApp())
      .post("/api/v1/auth/login")
      .send({ email, password: oldPassword });
    expect(oldLogin.status).toBe(401);

    // New password works.
    const newLogin = await request(buildApp())
      .post("/api/v1/auth/login")
      .send({ email, password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  it("rejects admin resetting own password", async () => {
    const admin = await loginAs("admin@local");
    const me = await admin.get("/api/v1/auth/me");
    const adminId = me.body.data.user.id as string;
    const res = await admin.post(`/api/v1/users/${adminId}/reset-password`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CANNOT_MODIFY_SELF");
  });

  it("returns 404 USER_NOT_FOUND for unknown id", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.post(
      "/api/v1/users/00000000-0000-0000-0000-000000000000/reset-password",
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for non-admin caller", async () => {
    const dev = await loginAs("dev@local");
    const me = await dev.get("/api/v1/auth/me");
    const devId = me.body.data.user.id as string;
    const res = await dev.post(`/api/v1/users/${devId}/reset-password`);
    expect(res.status).toBe(403);
  });
});
