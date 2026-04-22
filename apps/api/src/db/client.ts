import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "../db.js";
import * as schema from "./schema.js";

/**
 * Drizzle ORM client wired to the shared pg Pool from `db.ts`.
 * Import `db` anywhere we need type-safe queries.
 */
export const db = drizzle(pool, { schema });
export type Db = typeof db;
