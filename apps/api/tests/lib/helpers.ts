import type { Express } from "express";
import { createApp, type AppDeps } from "../../src/app.js";

/**
 * Build a test Express app with mocked deps by default.
 * Callers override only what they need via `overrides`.
 */
export function createTestApp(overrides: Partial<AppDeps> = {}): Express {
  const defaults: AppDeps = {
    dbCheck: async () => "ok",
    redisCheck: async () => "ok",
    version: "test",
  };
  return createApp({ ...defaults, ...overrides });
}
