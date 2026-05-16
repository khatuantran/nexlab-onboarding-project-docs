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

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);

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
    projectsRouter: createProjectsRouter({ projectRepo, requireAuth }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const CREATED_SLUGS: string[] = [];

async function createProject(name = "Edit Target") {
  const agent = await loginAs("admin@local");
  const slug = `t3-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  CREATED_SLUGS.push(slug);
  const res = await agent.post("/api/v1/projects").send({ slug, name });
  if (res.status !== 201) throw new Error(`seed failed: ${res.status}`);
  return { agent, slug };
}

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterEach(async () => {
  if (CREATED_SLUGS.length === 0) return;
  await db.delete(projects).where(inArray(projects.slug, CREATED_SLUGS));
  CREATED_SLUGS.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe("PATCH /api/v1/projects/:slug", () => {
  it("returns 200 with updated project for admin", async () => {
    const { agent, slug } = await createProject();
    const res = await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Renamed", description: "new desc" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug, name: "Renamed", description: "new desc" });
  });

  it("ignores slug in body (immutable)", async () => {
    const { agent, slug } = await createProject();
    const res = await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Keep Slug", slug: "hacked-slug" });
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(slug);
  });

  it("bumps updated_at", async () => {
    const { agent, slug } = await createProject();
    const before = await agent.get(`/api/v1/projects/${slug}`);
    const beforeUpdated = before.body.data.project.updatedAt;
    await new Promise((r) => setTimeout(r, 15));
    const res = await agent.patch(`/api/v1/projects/${slug}`).send({ name: "Bumped" });
    expect(res.status).toBe(200);
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(
      new Date(beforeUpdated).getTime(),
    );
  });

  it("returns 403 FORBIDDEN for author role", async () => {
    const { slug } = await createProject();
    const author = await loginAs("dev@local");
    const res = await author.patch(`/api/v1/projects/${slug}`).send({ name: "Nope" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 PROJECT_NOT_FOUND for archived project", async () => {
    const { agent, slug } = await createProject();
    await db.execute(sql`UPDATE projects SET archived_at = NOW() WHERE slug = ${slug}`);
    const res = await agent.patch(`/api/v1/projects/${slug}`).send({ name: "Dead" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("returns 400 VALIDATION_ERROR for empty name", async () => {
    const { agent, slug } = await createProject();
    const res = await agent.patch(`/api/v1/projects/${slug}`).send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // US-013 — repoUrl PATCH semantics
  it("US-013 AC-1: persists repoUrl on update; response carries new value", async () => {
    const { agent, slug } = await createProject();
    const res = await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Pilot", repoUrl: "https://github.com/foo/bar" });
    expect(res.status).toBe(200);
    expect(res.body.data.repoUrl).toBe("https://github.com/foo/bar");
    const reload = await agent.get(`/api/v1/projects/${slug}`);
    expect(reload.body.data.project.repoUrl).toBe("https://github.com/foo/bar");
  });

  it("US-013 AC-2: explicit null clears repoUrl", async () => {
    const { agent, slug } = await createProject();
    await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Pilot", repoUrl: "https://github.com/foo/bar" });
    const res = await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Pilot", repoUrl: null });
    expect(res.status).toBe(200);
    expect(res.body.data.repoUrl).toBeNull();
  });

  it("US-013 AC-3: omitting repoUrl key preserves prior value", async () => {
    const { agent, slug } = await createProject();
    await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Pilot", repoUrl: "https://github.com/foo/bar" });
    const res = await agent.patch(`/api/v1/projects/${slug}`).send({ name: "Pilot v2" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Pilot v2");
    expect(res.body.data.repoUrl).toBe("https://github.com/foo/bar");
  });

  it("US-013 AC-4: rejects invalid repoUrl format with 400", async () => {
    const { agent, slug } = await createProject();
    const res = await agent
      .patch(`/api/v1/projects/${slug}`)
      .send({ name: "Pilot", repoUrl: "not-a-url" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("US-013 AC-8: GET endpoints expose repoUrl field (null for new project)", async () => {
    const { agent, slug } = await createProject();
    const detail = await agent.get(`/api/v1/projects/${slug}`);
    expect(detail.body.data.project).toHaveProperty("repoUrl", null);
    const list = await agent.get(`/api/v1/projects`);
    const me = list.body.data.find((p: { slug: string }) => p.slug === slug);
    expect(me).toHaveProperty("repoUrl", null);
  });
});

describe("POST /api/v1/projects/:slug/archive", () => {
  it("returns 204 + sets archived_at for admin", async () => {
    const { agent, slug } = await createProject();
    const res = await agent.post(`/api/v1/projects/${slug}/archive`);
    expect(res.status).toBe(204);

    const rows = await db
      .select({ archivedAt: projects.archivedAt })
      .from(projects)
      .where(sql`${projects.slug} = ${slug}`);
    expect(rows[0]?.archivedAt).not.toBeNull();
  });

  it("excludes archived from GET /projects list (AC-4)", async () => {
    const { agent, slug } = await createProject();
    await agent.post(`/api/v1/projects/${slug}/archive`);
    const list = await agent.get("/api/v1/projects");
    expect(list.status).toBe(200);
    const slugs = list.body.data.map((p: { slug: string }) => p.slug);
    expect(slugs).not.toContain(slug);
  });

  it("GET /projects/:slug returns 404 after archive (AC-9)", async () => {
    const { agent, slug } = await createProject();
    await agent.post(`/api/v1/projects/${slug}/archive`);
    const res = await agent.get(`/api/v1/projects/${slug}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("is idempotent — archive already-archived returns 204", async () => {
    const { agent, slug } = await createProject();
    const first = await agent.post(`/api/v1/projects/${slug}/archive`);
    expect(first.status).toBe(204);
    const second = await agent.post(`/api/v1/projects/${slug}/archive`);
    expect(second.status).toBe(204);
  });

  it("returns 403 FORBIDDEN for author role", async () => {
    const { slug } = await createProject();
    const author = await loginAs("dev@local");
    const res = await author.post(`/api/v1/projects/${slug}/archive`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 for non-existent slug", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.post("/api/v1/projects/does-not-exist-xyz/archive");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });
});
