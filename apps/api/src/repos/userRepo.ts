import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users, type User } from "../db/schema.js";

/**
 * Repository for `users` table. Thin wrapper over drizzle —
 * lets routes/services stay storage-agnostic and tests swap
 * impls easily (unit-level in future tasks if needed).
 */
export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
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
  };
}
