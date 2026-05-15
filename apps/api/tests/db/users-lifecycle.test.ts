import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";

/**
 * Integration test — US-007 / T1.
 * Verifies migration 0007_users_lifecycle added archived_at + last_login_at
 * columns and the partial index over active rows.
 */

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await pool.end();
});

describe("users lifecycle columns (US-007 / T1)", () => {
  it("exposes archived_at + last_login_at on every user row", async () => {
    const result = await db.execute<{ archived_at: string | null; last_login_at: string | null }>(
      sql`SELECT archived_at, last_login_at FROM users LIMIT 1`,
    );
    const row = result.rows[0];
    expect(row).toBeDefined();
    // Both columns start NULL for the seed admin + author.
    expect(row?.archived_at).toBeNull();
    expect(row?.last_login_at).toBeNull();
  });

  it("has a partial index over active rows (archived_at IS NULL)", async () => {
    const result = await db.execute<{ indexdef: string }>(sql`
      SELECT indexdef FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_archived_at_idx'
    `);
    const row = result.rows[0];
    expect(row?.indexdef).toBeTruthy();
    expect(row?.indexdef).toMatch(/WHERE \(archived_at IS NULL\)/u);
  });
});
