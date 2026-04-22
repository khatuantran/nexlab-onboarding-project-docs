/**
 * Domain object factories for tests.
 *
 * T3: signatures only (no real DB insert yet).
 * T5+ fills in: call real repos to insert seed rows into test DB.
 *
 * Usage:
 *   const user = await userFactory({ role: "admin" });
 *   const project = await projectFactory({ slug: "demo" });
 */

export interface UserSeed {
  id?: string;
  email?: string;
  displayName?: string;
  role?: "admin" | "author";
  passwordHash?: string;
}

export async function userFactory(_overrides: UserSeed = {}): Promise<never> {
  throw new Error("userFactory not wired yet — lands in T6 with userRepo");
}

export interface ProjectSeed {
  id?: string;
  slug?: string;
  name?: string;
}

export async function projectFactory(_overrides: ProjectSeed = {}): Promise<never> {
  throw new Error("projectFactory not wired yet — lands in T7 with projectRepo");
}
