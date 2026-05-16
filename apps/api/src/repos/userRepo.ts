import { and, asc, count, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
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
  /**
   * Filter on archived_at. Defaults to "active" for non-admin callers.
   * Admin may pass "archived" or "all". Non-admin requesting non-default
   * is rejected at the route layer.
   */
  status?: "active" | "archived" | "all";
  /**
   * When true, the SELECT includes admin-only fields (email, archivedAt,
   * lastLoginAt, createdAt). Route layer is responsible for setting this
   * flag based on `req.user.role`.
   */
  includeAdminFields?: boolean;
}

export interface UserListItem {
  id: string;
  displayName: string;
  role: "admin" | "author";
}

export interface AdminUserRow extends UserListItem {
  email: string;
  archivedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** US-009 — Cloudinary secure_url or null. */
  avatarUrl: string | null;
  /** US-010 — profile enrichment fields. */
  phone: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: "admin" | "author";
  passwordHash: string;
}

export interface UpdateUserPatch {
  displayName?: string;
  role?: "admin" | "author";
  /** US-010 — profile enrichment. `null` clears, `undefined` leaves untouched. */
  phone?: string | null;
  department?: string | null;
  location?: string | null;
  bio?: string | null;
}

export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listUsers(opts?: ListUsersOpts): Promise<UserListItem[] | AdminUserRow[]>;
  /** Admin detail — always returns admin-shaped row. */
  getAdminById(id: string): Promise<AdminUserRow | null>;
  createUser(input: CreateUserInput): Promise<AdminUserRow>;
  updateUser(id: string, patch: UpdateUserPatch): Promise<AdminUserRow | null>;
  setArchived(id: string, archived: boolean): Promise<AdminUserRow | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<AdminUserRow | null>;
  touchLastLogin(id: string): Promise<void>;
  countActiveAdmins(): Promise<number>;
  /** US-009 — update only the avatar_url column. */
  updateAvatarUrl(id: string, avatarUrl: string | null): Promise<AdminUserRow | null>;
}

const LIST_LIMIT = 100;

function toAdminRow(r: User): AdminUserRow {
  return {
    id: r.id,
    email: r.email,
    displayName: r.displayName,
    role: r.role,
    archivedAt: r.archivedAt ?? null,
    lastLoginAt: r.lastLoginAt ?? null,
    createdAt: r.createdAt,
    avatarUrl: r.avatarUrl ?? null,
    phone: r.phone ?? null,
    department: r.department ?? null,
    location: r.location ?? null,
    bio: r.bio ?? null,
  };
}

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
      const status = opts.status ?? "active";
      if (status === "active") {
        conditions.push(isNull(users.archivedAt));
      } else if (status === "archived") {
        conditions.push(sql`${users.archivedAt} IS NOT NULL`);
      }
      if (opts.q && opts.q.trim().length > 0) {
        const needle = `%${opts.q.trim()}%`;
        if (opts.includeAdminFields) {
          conditions.push(or(ilike(users.displayName, needle), ilike(users.email, needle)) as SQL);
        } else {
          conditions.push(ilike(users.displayName, needle));
        }
      }
      if (opts.role) {
        conditions.push(eq(users.role, opts.role));
      }
      const where = conditions.length === 0 ? undefined : and(...conditions);

      if (opts.includeAdminFields) {
        const rows = await db
          .select()
          .from(users)
          .where(where)
          .orderBy(asc(users.displayName))
          .limit(LIST_LIMIT);
        return rows.map(toAdminRow);
      }
      const rows = await db
        .select({ id: users.id, displayName: users.displayName, role: users.role })
        .from(users)
        .where(where)
        .orderBy(asc(users.displayName))
        .limit(LIST_LIMIT);
      return rows;
    },
    async getAdminById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const r = rows[0];
      return r ? toAdminRow(r) : null;
    },
    async createUser(input) {
      const rows = await db
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          displayName: input.displayName,
          role: input.role,
          passwordHash: input.passwordHash,
        })
        .returning();
      const r = rows[0];
      if (!r) throw new Error("createUser: insert returned no row");
      return toAdminRow(r);
    },
    async updateUser(id, patch) {
      const update: Partial<typeof users.$inferInsert> = {};
      if (patch.displayName !== undefined) update.displayName = patch.displayName;
      if (patch.role !== undefined) update.role = patch.role;
      // US-010 — accept null to clear, undefined to leave untouched.
      if (patch.phone !== undefined) update.phone = patch.phone;
      if (patch.department !== undefined) update.department = patch.department;
      if (patch.location !== undefined) update.location = patch.location;
      if (patch.bio !== undefined) update.bio = patch.bio;
      if (Object.keys(update).length === 0) {
        return this.getAdminById(id);
      }
      const rows = await db.update(users).set(update).where(eq(users.id, id)).returning();
      const r = rows[0];
      return r ? toAdminRow(r) : null;
    },
    async setArchived(id, archived) {
      const rows = await db
        .update(users)
        .set({ archivedAt: archived ? new Date() : null })
        .where(eq(users.id, id))
        .returning();
      const r = rows[0];
      return r ? toAdminRow(r) : null;
    },
    async updatePasswordHash(id, passwordHash) {
      const rows = await db.update(users).set({ passwordHash }).where(eq(users.id, id)).returning();
      const r = rows[0];
      return r ? toAdminRow(r) : null;
    },
    async touchLastLogin(id) {
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
    },
    async countActiveAdmins() {
      const rows = await db
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), isNull(users.archivedAt)));
      return Number(rows[0]?.n ?? 0);
    },
    async updateAvatarUrl(id, avatarUrl) {
      const rows = await db.update(users).set({ avatarUrl }).where(eq(users.id, id)).returning();
      const r = rows[0];
      return r ? toAdminRow(r) : null;
    },
  };
}
