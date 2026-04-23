import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

// Load apps/api/.env anchored via import.meta.url — robust to cwd
// (prod `node dist/index.js` from any dir still hits the right file).
// src/env.ts → apps/api/.env = one level up.
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: envPath });
