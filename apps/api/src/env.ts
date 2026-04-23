import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

// dotenv/config sidecar reads `.env` from cwd only. We want `.env.local`
// anchored to this package (apps/api/), regardless of where the entrypoint
// is invoked from. src/env.ts → apps/api/.env.local = one level up.
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
dotenv.config({ path: envPath });
