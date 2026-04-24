import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createFeaturesRouter } from "../../src/routes/features.js";
import { createUploadsReadRouter, createUploadsRouter } from "../../src/routes/uploads.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createFeatureRepo } from "../../src/repos/featureRepo.js";
import { createUploadRepo } from "../../src/repos/uploadRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { projects, uploads } from "../../src/db/schema.js";

const PNG_1x1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbrI+wAAAABJRU5ErkJggg==";
const realPng = Buffer.from(PNG_1x1_BASE64, "base64");

let TEST_UPLOAD_DIR = "";

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);
  const featureRepo = createFeatureRepo(db);
  const uploadRepo = createUploadRepo(db);

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
    projectsRouter: createProjectsRouter({ projectRepo, requireAuth }),
    featuresRouter: createFeaturesRouter({ featureRepo, projectRepo, requireAuth }),
    uploadsRouter: createUploadsRouter({
      uploadRepo,
      featureRepo,
      requireAuth,
      uploadDir: TEST_UPLOAD_DIR,
    }),
    uploadsReadRouter: createUploadsReadRouter({
      uploadRepo,
      requireAuth,
      uploadDir: TEST_UPLOAD_DIR,
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const projectSlug = `t3-host-${Date.now()}`;
let featureId = "";
let uploadId = "";

beforeAll(async () => {
  TEST_UPLOAD_DIR = await mkdtemp(path.join(tmpdir(), "uploads-get-test-"));
  const admin = await loginAs("admin@local");
  await admin.post("/api/v1/projects").send({ slug: projectSlug, name: "T3 Host" });
  const feat = await admin
    .post(`/api/v1/projects/${projectSlug}/features`)
    .send({ slug: `feat-${Date.now()}`, title: "Feat" });
  featureId = feat.body.data.id;
  const up = await admin
    .post(`/api/v1/features/${featureId}/uploads`)
    .attach("file", realPng, { filename: "a.png", contentType: "image/png" });
  uploadId = up.body.data.id;
});

afterAll(async () => {
  await db.delete(uploads).where(eq(uploads.featureId, featureId));
  await db.delete(projects).where(inArray(projects.slug, [projectSlug]));
  await pool.end();
  await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
});

describe("GET /api/v1/uploads/:id", () => {
  it("returns 200 + binary with DB Content-Type for authenticated user", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get(`/api/v1/uploads/${uploadId}`).buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(Buffer.compare(res.body, realPng)).toBe(0);
  });

  it("returns 404 for unknown upload id", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.get(`/api/v1/uploads/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
  });

  it("returns 401 UNAUTHENTICATED for no session", async () => {
    const res = await request(buildApp()).get(`/api/v1/uploads/${uploadId}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
