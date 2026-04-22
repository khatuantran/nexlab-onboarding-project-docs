import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq, sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { db } from "../../src/db/client.js";
import { users } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";

/**
 * Integration tests for POST /auth/login, POST /auth/logout, GET /auth/me.
 * Uses real Postgres (seed `admin@local` / `dev12345`) + in-memory session +
 * fake redis counter for rate limit. Cookie handling via supertest agent.
 */

function makeFakeRedis(): RateLimitClient & { reset: () => void } {
  const store = new Map<string, number>();
  return {
    incr: async (key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    },
    expire: async () => 1,
    reset: () => store.clear(),
  };
}

const fakeRedis = makeFakeRedis();

function buildApp() {
  const userRepo = createUserRepo(db);
  const loginRateLimit = createRateLimit({
    redis: fakeRedis,
    keyFn: (req) => `login:${req.ip}`,
    max: 10,
    windowSec: 60,
  });

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
  });
}

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

beforeEach(() => {
  fakeRedis.reset();
});

afterAll(async () => {
  await pool.end();
});

describe("POST /auth/login", () => {
  it("returns 200 + user + Set-Cookie sid on valid credentials", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@local", password: "dev12345" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("admin@local");
    expect(res.body.data.user.role).toBe("admin");
    expect(res.body.data.user.displayName).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const setCookie = res.headers["set-cookie"];
    const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    expect(cookies.some((c: string) => c.startsWith("sid="))).toBe(true);
  });

  it("returns 401 INVALID_CREDENTIALS on wrong password", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@local", password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 INVALID_CREDENTIALS on non-existent email (anti-enumeration)", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ghost@local", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 429 RATE_LIMITED after 10 attempts in a window", async () => {
    const app = buildApp();
    const agent = request(app);

    for (let i = 0; i < 10; i += 1) {
      await agent.post("/api/v1/auth/login").send({ email: "admin@local", password: "wrong" });
    }
    const res = await agent
      .post("/api/v1/auth/login")
      .send({ email: "admin@local", password: "wrong" });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("GET /auth/me", () => {
  it("returns 401 UNAUTHENTICATED without session cookie", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns the current user when session cookie is present", async () => {
    const app = buildApp();
    const agent = request.agent(app);

    const login = await agent
      .post("/api/v1/auth/login")
      .send({ email: "admin@local", password: "dev12345" });
    expect(login.status).toBe(200);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("admin@local");
  });
});

describe("POST /auth/logout", () => {
  it("destroys session so GET /auth/me returns 401 afterwards", async () => {
    const app = buildApp();
    const agent = request.agent(app);

    await agent.post("/api/v1/auth/login").send({ email: "admin@local", password: "dev12345" });

    const logout = await agent.post("/api/v1/auth/logout");
    expect(logout.status).toBe(204);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("DB sanity", () => {
  it("has admin@local seeded (fail fast if tests run without seed)", async () => {
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
    expect(admin).toBeDefined();
  });
});
