import { z } from "zod";

/**
 * Login request schema — source of truth shared between BE validation
 * (apps/api route) and FE form (apps/web login page). Keep fields
 * minimal; no remember-me / MFA in v1.
 */
/**
 * Permissive email check — internal portal accepts TLD-less addresses
 * like `admin@local`. Full RFC validation is overkill and would break
 * our dev seed + any intranet mail setup. Just require `local@host`.
 */
const emailLike = z
  .string()
  .min(3)
  .max(255)
  .regex(/^[^\s@]+@[^\s@]+$/u, "Email không hợp lệ");

export const loginRequestSchema = z.object({
  email: emailLike,
  password: z.string().min(1).max(200),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "author";
}
