import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

// Load apps/api/.env anchored via import.meta.url — robust to cwd
// (prod `node dist/index.js` from any dir still hits the right file).
// src/env.ts → apps/api/.env = one level up.
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(apiDir, ".env") });

// When APP_ENV=test (vitest, playwright, db:*:test scripts), overlay
// .env.test so DATABASE_URL points at the isolated test database.
if (process.env.APP_ENV === "test") {
  dotenv.config({ path: path.resolve(apiDir, ".env.test"), override: true });
}
