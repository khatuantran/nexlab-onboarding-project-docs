import "../env.js";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { features, projects, sections, users } from "./schema.js";
import { logger } from "../logger.js";
import { pool } from "../db.js";

const SEED_USERS = [
  {
    email: "admin@local",
    displayName: "Admin",
    role: "admin" as const,
    password: "dev12345",
  },
  {
    email: "dev@local",
    displayName: "Dev",
    role: "author" as const,
    password: "dev12345",
  },
];

const DEMO_PROJECT = {
  slug: "demo",
  name: "Demo Project",
  description: "Project mẫu cho US-001 read path. Dev mới mở trang này để onboard.",
};

const DEMO_FEATURE = {
  slug: "login-with-email",
  title: "Đăng nhập bằng email",
};

const DEMO_SECTIONS: Record<
  "business" | "user-flow" | "business-rules" | "tech-notes" | "screenshots",
  string
> = {
  business: `## Mục đích

Cho phép người dùng hiện tại đăng nhập vào portal bằng email + mật khẩu.

## Khách hàng

- Dev mới của công ty (persona Minh).
- BA/PM + Senior dev (Lan, Hùng).
`,
  "user-flow": `1. Truy cập \`/login\`.
2. Nhập email + mật khẩu.
3. Click **Đăng nhập**.
4. Success → redirect \`/\` (hoặc \`next\` param nếu có).
5. Fail → hiển thị inline error.
`,
  "business-rules": `- Email phải hợp lệ (RFC 5322).
- Mật khẩu sai hoặc email không tồn tại → cùng error code \`INVALID_CREDENTIALS\` (chống user enumeration).
- Rate limit 10 req/phút/IP (FR-AUTH-001 + NFR-SEC-001).
- Session TTL 7 ngày sliding.
`,
  "tech-notes": `- Endpoint: \`POST /api/v1/auth/login\` (T6).
- bcrypt compare, cost ≥ 10.
- Session store: Redis qua \`connect-redis\`.
- Cookie \`sid\`: httpOnly, sameSite=lax, secure trong prod.
`,
  screenshots: `_Thêm ảnh màn hình login ở đây khi có._
`,
};

async function seed(): Promise<void> {
  logger.info("Seeding database…");

  // Users — bcrypt hash passwords, ON CONFLICT DO NOTHING để idempotent
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db
      .insert(users)
      .values({
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        passwordHash,
      })
      .onConflictDoNothing({ target: users.email });
  }
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  if (!admin) throw new Error("Seed failed: admin user not found after insert");

  // Project — FK to admin id
  await db
    .insert(projects)
    .values({
      slug: DEMO_PROJECT.slug,
      name: DEMO_PROJECT.name,
      description: DEMO_PROJECT.description,
      createdBy: admin.id,
    })
    .onConflictDoNothing({ target: projects.slug });
  const [demoProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, DEMO_PROJECT.slug))
    .limit(1);
  if (!demoProject) throw new Error("Seed failed: demo project not found");

  // Feature
  await db
    .insert(features)
    .values({
      projectId: demoProject.id,
      slug: DEMO_FEATURE.slug,
      title: DEMO_FEATURE.title,
    })
    .onConflictDoNothing({ target: [features.projectId, features.slug] });
  const [demoFeature] = await db
    .select()
    .from(features)
    .where(eq(features.slug, DEMO_FEATURE.slug))
    .limit(1);
  if (!demoFeature) throw new Error("Seed failed: demo feature not found");

  // Sections — 5 rows, ON CONFLICT DO NOTHING on (feature_id, type)
  for (const [type, body] of Object.entries(DEMO_SECTIONS) as Array<
    [keyof typeof DEMO_SECTIONS, string]
  >) {
    await db
      .insert(sections)
      .values({
        featureId: demoFeature.id,
        type,
        body,
        updatedBy: admin.id,
      })
      .onConflictDoNothing({ target: [sections.featureId, sections.type] });
  }

  const userCount = (await db.select().from(users)).length;
  const sectionCount = (await db.select().from(sections)).length;
  logger.info(
    { users: userCount, projects: 1, features: 1, sections: sectionCount },
    "Seed complete",
  );
  // eslint-disable-next-line no-console
  console.log(
    `✓ Seeded ${userCount} users, 1 project ("Demo Project"), 1 feature ("Đăng nhập bằng email") với ${sectionCount} sections`,
  );
}

seed()
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
