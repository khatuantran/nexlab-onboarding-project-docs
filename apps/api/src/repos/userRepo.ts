import { and, asc, eq, ilike, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users, type User } from "../db/schema.js";

/**
 * Repository for `users` table. Thin wrapper over drizzle —
 * lets routes/services stay storage-agnostic and tests swap
 * impls easily (unit-level in future tasks if needed).
 */
export interface ListUsersOpts {
  q?: string;
  role?: "admin" | "author";
}

export interface UserListItem {
  id: string;
  displayName: string;
  role: "admin" | "author";
}

export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** US-005 / FR-USER-001 — author filter dropdown. Excludes email + passwordHash. */
  listUsers(opts?: ListUsersOpts): Promise<UserListItem[]>;
}

const LIST_LIMIT = 50;

export function createUserRepo(db: Db): UserRepo {
  return {
    async findByEmail(email) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      return rows[0] ?? null;
    },
    async findById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return rows[0] ?? null;
    },
    async listUsers(opts = {}) {
      const conditions: SQL[] = [];
      if (opts.q && opts.q.trim().length > 0) {
        conditions.push(ilike(users.displayName, `%${opts.q.trim()}%`));
      }
      if (opts.role) {
        conditions.push(eq(users.role, opts.role));
      }
      const where = conditions.length === 0 ? undefined : and(...conditions);

      const rows = await db
        .select({ id: users.id, displayName: users.displayName, role: users.role })
        .from(users)
        .where(where)
        .orderBy(asc(users.displayName))
        .limit(LIST_LIMIT);
      return rows;
    },
  };
}
