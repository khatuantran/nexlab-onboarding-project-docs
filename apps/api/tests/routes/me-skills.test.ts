import { afterAll, beforeEach, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createMeRouter } from "../../src/routes/me.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createUserSkillsRepo } from "../../src/repos/userSkillsRepo.js";
import { createUserStatsRepo } from "../../src/repos/userStatsRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { userSkills, users } from "../../src/db/schema.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

const fakeCloudinary: CloudinaryClient = {
  isConfigured: () => true,
  destroyImage: async () => {},
  async uploadImage() {
    throw new Error("not used");
  },
};
const fakeRedisFull = {
  scan: async () => ["0", []] as [string, string[]],
  get: async () => null,
  del: async () => 0,
};

function buildApp() {
  const userRepo = createUserRepo(db);
  const userStatsRepo = createUserStatsRepo(db);
  const userSkillsRepo = createUserSkillsRepo(db);
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
    meRouter: createMeRouter({
      userRepo,
      userStatsRepo,
      userSkillsRepo,
      requireAuth,
      redis: fakeRedisFull,
      cloudinary: fakeCloudinary,
      cloudinaryAvatarsFolder: "test",
      cloudinaryUserCoversFolder: "test",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return agent;
}

async function getAdminId(): Promise<string> {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  return admin!.id;
}

beforeEach(async () => {
  const adminId = await getAdminId();
  await db.delete(userSkills).where(eq(userSkills.userId, adminId));
});

afterAll(async () => {
  const adminId = await getAdminId();
  await db.delete(userSkills).where(eq(userSkills.userId, adminId));
  await pool.end();
});

describe("/api/v1/me/skills (US-018)", () => {
  it("AC-1: GET returns empty array for user with no skills", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/skills");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("AC-2: PUT replace-all persists and assigns sort_order; subsequent GET reflects order", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.put("/api/v1/me/skills").send({
      skills: [
        { label: "SQL", color: "blue" },
        { label: "Figma", color: "purple" },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ label: "SQL", color: "blue", sortOrder: 0 });
    expect(res.body.data[1]).toMatchObject({ label: "Figma", color: "purple", sortOrder: 1 });

    const reload = await admin.get("/api/v1/me/skills");
    expect(reload.body.data.map((s: { label: string }) => s.label)).toEqual(["SQL", "Figma"]);
  });

  it("AC-3: PUT 13 skills → 400 VALIDATION_ERROR (no DB write)", async () => {
    const admin = await loginAs("admin@local");
    const tooMany = Array.from({ length: 13 }, (_, i) => ({
      label: `skill-${i}`,
      color: "blue",
    }));
    const res = await admin.put("/api/v1/me/skills").send({ skills: tooMany });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const reload = await admin.get("/api/v1/me/skills");
    expect(reload.body.data).toEqual([]);
  });

  it("AC-4: PUT duplicate label (case-insensitive) → 400", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.put("/api/v1/me/skills").send({
      skills: [
        { label: "SQL", color: "blue" },
        { label: "sql", color: "purple" },
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-5: PUT invalid color → 400", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin
      .put("/api/v1/me/skills")
      .send({ skills: [{ label: "X", color: "rainbow" }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-6: PUT empty array clears all skills", async () => {
    const admin = await loginAs("admin@local");
    await admin.put("/api/v1/me/skills").send({
      skills: [{ label: "SQL", color: "blue" }],
    });
    const before = await admin.get("/api/v1/me/skills");
    expect(before.body.data).toHaveLength(1);

    const clear = await admin.put("/api/v1/me/skills").send({ skills: [] });
    expect(clear.status).toBe(200);
    expect(clear.body.data).toEqual([]);

    const after = await admin.get("/api/v1/me/skills");
    expect(after.body.data).toEqual([]);
  });

  it("AC-7: 401 UNAUTHENTICATED without session (GET + PUT)", async () => {
    const getRes = await request(buildApp()).get("/api/v1/me/skills");
    expect(getRes.status).toBe(401);
    const putRes = await request(buildApp()).put("/api/v1/me/skills").send({ skills: [] });
    expect(putRes.status).toBe(401);
  });

  it("AC-8: PUT only touches the caller's rows, not other users'", async () => {
    // Admin sets 2 skills.
    const admin = await loginAs("admin@local");
    await admin.put("/api/v1/me/skills").send({
      skills: [
        { label: "Admin-A", color: "blue" },
        { label: "Admin-B", color: "purple" },
      ],
    });

    // dev@local clears their own (they have none, but call still succeeds).
    const author = await loginAs("dev@local");
    const clear = await author.put("/api/v1/me/skills").send({ skills: [] });
    expect(clear.status).toBe(200);

    // Admin's skills survive untouched.
    const adminReload = await admin.get("/api/v1/me/skills");
    expect(adminReload.body.data).toHaveLength(2);
  });
});
