import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { uploads, type Upload } from "../db/schema.js";

export interface InsertUploadInput {
  id: string;
  featureId: string;
  uploadedBy: string;
  mimeType: string;
  sizeBytes: number;
  filename: string;
}

export interface UploadRepo {
  insert(input: InsertUploadInput): Promise<Upload>;
  findById(id: string): Promise<Upload | null>;
}

export function createUploadRepo(db: Db): UploadRepo {
  return {
    async insert(input) {
      const [row] = await db.insert(uploads).values(input).returning();
      if (!row) throw new Error("upload insert returned no row");
      return row;
    },
    async findById(id) {
      const rows = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
      return rows[0] ?? null;
    },
  };
}
