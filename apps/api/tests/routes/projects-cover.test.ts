import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { inArray, sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { projects } from "../../src/db/schema.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

const PNG_1x1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbrI+wAAAABJRU5ErkJggg==";
const realPng = Buffer.from(PNG_1x1_BASE64, "base64");

interface FakeCloudinaryState {
  configured: boolean;
  shouldFail: boolean;
  calls: Array<{ publicId: string; bytes: number }>;
  destroyCalls?: string[];
}

const state: FakeCloudinaryState = { configured: true, shouldFail: false, calls: [] };

function createFakeCloudinary(): CloudinaryClient {
  return {
    isConfigured: () => state.configured,
    destroyImage: async (publicId) => {
      state.destroyCalls?.push(publicId);
    },
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

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);

  const fakeRedis: RateLimitClient = { incr: async () => 1, expire: async () => 1 };
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
    projectsRouter: createProjectsRouter({
      projectRepo,
      requireAuth,
      cloudinary: createFakeCloudinary(),
      cloudinaryProjectCoversFolder: "onboarding-portal/test/covers/projects",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const CREATED_SLUGS: string[] = [];

async function createProject() {
  const agent = await loginAs("admin@local");
  const slug = `us019-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  CREATED_SLUGS.push(slug);
  const res = await agent.post("/api/v1/projects").send({ slug, name: "Cover Test" });
  if (res.status !== 201) throw new Error(`seed failed: ${res.status}`);
  return { agent, slug };
}

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterEach(async () => {
  state.configured = true;
  state.shouldFail = false;
  state.calls = [];
  if (CREATED_SLUGS.length === 0) return;
  await db.delete(projects).where(inArray(projects.slug, CREATED_SLUGS));
  CREATED_SLUGS.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/v1/projects/:slug/cover (US-019 / T2)", () => {
  it("AC-6: returns 200 + persists Cloudinary URL for admin; GET exposes coverUrl", async () => {
    const { agent, slug } = await createProject();
    const res = await agent
      .post(`/api/v1/projects/${slug}/cover`)
      .attach("file", realPng, { filename: "c.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.data.coverUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(state.calls[0]?.publicId).toMatch(/^onboarding-portal\/test\/covers\/projects\//);

    const get = await agent.get(`/api/v1/projects/${slug}`);
    expect(get.body.data.project.coverUrl).toBe(res.body.data.coverUrl);
  });

  it("AC-5: returns 403 FORBIDDEN for non-admin (author)", async () => {
    const { slug } = await createProject();
    const authorAgent = await loginAs("dev@local");
    const res = await authorAgent
      .post(`/api/v1/projects/${slug}/cover`)
      .attach("file", realPng, { filename: "c.png", contentType: "image/png" });
    expect(res.status).toBe(403);
  });

  it("AC-7: returns 404 PROJECT_NOT_FOUND when slug missing", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/projects/no-such-slug-${Date.now()}/cover`)
      .attach("file", realPng, { filename: "c.png", contentType: "image/png" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
    // No Cloudinary call when slug missing.
    expect(state.calls).toHaveLength(0);
  });

  it("AC-11: GET /projects list exposes coverUrl for project", async () => {
    const { agent, slug } = await createProject();
    await agent
      .post(`/api/v1/projects/${slug}/cover`)
      .attach("file", realPng, { filename: "c.png", contentType: "image/png" });
    const list = await agent.get("/api/v1/projects");
    const row = (list.body.data as Array<{ slug: string; coverUrl: string | null }>).find(
      (p) => p.slug === slug,
    );
    expect(row?.coverUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });

  it("AC-16: admin DELETE returns 204 + clears coverUrl + Cloudinary destroy", async () => {
    const { agent, slug } = await createProject();
    await agent
      .post(`/api/v1/projects/${slug}/cover`)
      .attach("file", realPng, { filename: "c.png", contentType: "image/png" });
    state.destroyCalls = [];

    const del = await agent.delete(`/api/v1/projects/${slug}/cover`);
    expect(del.status).toBe(204);
    expect(state.destroyCalls).toHaveLength(1);

    const get = await agent.get(`/api/v1/projects/${slug}`);
    expect(get.body.data.project.coverUrl).toBeNull();
  });

  it("AC-16: non-admin (author) DELETE → 403 FORBIDDEN", async () => {
    const { slug } = await createProject();
    const authorAgent = await loginAs("dev@local");
    const res = await authorAgent.delete(`/api/v1/projects/${slug}/cover`);
    expect(res.status).toBe(403);
  });
});
