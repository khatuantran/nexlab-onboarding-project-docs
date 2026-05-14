import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createFeaturesRouter } from "../../src/routes/features.js";
import { createUploadsRouter } from "../../src/routes/uploads.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createFeatureRepo } from "../../src/repos/featureRepo.js";
import { createUploadRepo } from "../../src/repos/uploadRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { projects, uploads } from "../../src/db/schema.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

// Minimal 1×1 transparent PNG — magic bytes verified by file-type.
const PNG_1x1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbrI+wAAAABJRU5ErkJggg==";
const realPng = Buffer.from(PNG_1x1_BASE64, "base64");

// Minimal 1×1 GIF — valid gif magic, should 415.
const gifBuf = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// PDF magic disguised as .png Content-Type → 415 via magic-byte sniff.
const pdfBuf = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n");

interface FakeCloudinaryState {
  configured: boolean;
  shouldFail: boolean;
  calls: Array<{ publicId: string; bytes: number; filename?: string }>;
}

function createFakeCloudinary(state: FakeCloudinaryState): CloudinaryClient {
  return {
    isConfigured: () => state.configured,
    async uploadImage(input) {
      state.calls.push({
        publicId: input.publicId,
        bytes: input.buffer.length,
        filename: input.filename,
      });
      if (state.shouldFail) {
        throw new Error("simulated cloudinary outage");
      }
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

const cloudinaryState: FakeCloudinaryState = {
  configured: true,
  shouldFail: false,
  calls: [],
};

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
      cloudinary: createFakeCloudinary(cloudinaryState),
      cloudinaryFolder: "onboarding-portal/test",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const projectSlug = `t2-host-${Date.now()}`;
let featureId = "";

beforeAll(async () => {
  const admin = await loginAs("admin@local");
  await admin.post("/api/v1/projects").send({ slug: projectSlug, name: "T2 Host" });
  const feat = await admin
    .post(`/api/v1/projects/${projectSlug}/features`)
    .send({ slug: `feat-${Date.now()}`, title: "Feat" });
  featureId = feat.body.data.id;
});

afterAll(async () => {
  await db.delete(uploads).where(eq(uploads.featureId, featureId));
  await db.delete(projects).where(inArray(projects.slug, [projectSlug]));
  await pool.end();
});

describe("POST /api/v1/features/:featureId/uploads", () => {
  it("CR-004 / Phase 2 — streams to Cloudinary + returns absolute secure_url + inserts row", async () => {
    // Reset Cloudinary state for this test.
    cloudinaryState.configured = true;
    cloudinaryState.shouldFail = false;
    cloudinaryState.calls = [];

    const agent = await loginAs("dev@local");
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", realPng, { filename: "shot.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      sizeBytes: realPng.length,
      mimeType: "image/png",
    });
    expect(res.body.data.id).toMatch(/^[0-9a-f-]{36}$/i);
    // URL is now Cloudinary's absolute secure URL, not /api/v1/uploads/:id.
    expect(res.body.data.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.body.data.url).toContain(`onboarding-portal/test/${res.body.data.id}`);

    // Cloudinary client was invoked exactly once with the right public_id.
    expect(cloudinaryState.calls).toHaveLength(1);
    expect(cloudinaryState.calls[0]!.publicId).toBe(`onboarding-portal/test/${res.body.data.id}`);
    expect(cloudinaryState.calls[0]!.bytes).toBe(realPng.length);
    expect(cloudinaryState.calls[0]!.filename).toBe("shot.png");

    const [row] = await db.select().from(uploads).where(eq(uploads.id, res.body.data.id));
    expect(row?.filename).toBe("shot.png");
    expect(row?.mimeType).toBe("image/png");
    expect(row?.uploadedBy).toBeTruthy();
    expect(row?.cloudinaryPublicId).toBe(`onboarding-portal/test/${res.body.data.id}`);
  });

  it("CR-004 / Phase 2 — 503 UPLOADS_DISABLED when Cloudinary not configured", async () => {
    cloudinaryState.configured = false;
    cloudinaryState.shouldFail = false;
    cloudinaryState.calls = [];

    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", realPng, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("UPLOADS_DISABLED");
    expect(cloudinaryState.calls).toHaveLength(0);
  });

  it("CR-004 / Phase 2 — 502 UPLOAD_PROVIDER_ERROR when Cloudinary throws", async () => {
    cloudinaryState.configured = true;
    cloudinaryState.shouldFail = true;
    cloudinaryState.calls = [];

    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", realPng, { filename: "b.png", contentType: "image/png" });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("UPLOAD_PROVIDER_ERROR");
    expect(cloudinaryState.calls).toHaveLength(1);

    // Reset for downstream tests.
    cloudinaryState.shouldFail = false;
  });

  it("returns 413 FILE_TOO_LARGE for 6 MiB upload", async () => {
    const agent = await loginAs("admin@local");
    const big = Buffer.alloc(6 * 1024 * 1024, 0);
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", big, { filename: "big.png", contentType: "image/png" });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("returns 415 UNSUPPORTED_MEDIA_TYPE for PDF disguised as PNG", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", pdfBuf, { filename: "evil.png", contentType: "image/png" });

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns 415 for gif (not in whitelist)", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", gifBuf, { filename: "anim.gif", contentType: "image/gif" });

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns 404 FEATURE_NOT_FOUND for unknown featureId", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/features/00000000-0000-0000-0000-000000000000/uploads`)
      .attach("file", realPng, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });

  it("returns 401 UNAUTHENTICATED for no session", async () => {
    const res = await request(buildApp())
      .post(`/api/v1/features/${featureId}/uploads`)
      .attach("file", realPng, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("CR-004 / Phase 2 — original filename never appears in Cloudinary public_id (traversal-safe)", async () => {
    cloudinaryState.configured = true;
    cloudinaryState.shouldFail = false;
    cloudinaryState.calls = [];

    const agent = await loginAs("admin@local");
    const res = await agent.post(`/api/v1/features/${featureId}/uploads`).attach("file", realPng, {
      filename: "../../etc/passwd.png",
      contentType: "image/png",
    });

    expect(res.status).toBe(201);
    expect(cloudinaryState.calls).toHaveLength(1);
    // public_id only contains folder + uuid, not the malicious original.
    expect(cloudinaryState.calls[0]!.publicId).not.toContain("..");
    expect(cloudinaryState.calls[0]!.publicId).toMatch(/^onboarding-portal\/test\/[0-9a-f-]{36}$/);
  });
});
