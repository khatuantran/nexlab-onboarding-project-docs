import { z } from "zod";

/**
 * Shared user schemas (US-007 — admin user lifecycle).
 *
 * Two response shapes:
 * - `UserPublic` — id + displayName + role only. Returned to any authenticated
 *   user (FR-USER-001 baseline). Used by author filter dropdown.
 * - `AdminUser` — adds email, archivedAt, lastLoginAt. Returned only when the
 *   caller is admin (FR-USER-002).
 */

export const userRoleSchema = z.enum(["admin", "author"]);
export type UserRole = z.infer<typeof userRoleSchema>;

const emailLike = z
  .string()
  .min(3)
  .max(255)
  .regex(/^[^\s@]+@[^\s@]+$/u, "Email không hợp lệ");

const displayNameSchema = z
  .string()
  .min(1, "Tên hiển thị bắt buộc")
  .max(120, "Tên hiển thị tối đa 120 ký tự");

export interface UserPublic {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface AdminUser extends UserPublic {
  email: string;
  archivedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export const inviteUserRequestSchema = z.object({
  email: emailLike,
  displayName: displayNameSchema,
  role: userRoleSchema,
});

export type InviteUserRequest = z.infer<typeof inviteUserRequestSchema>;

export const updateUserRequestSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    role: userRoleSchema.optional(),
  })
  .refine(
    (val) => val.displayName !== undefined || val.role !== undefined,
    "Phải có ít nhất 1 trường để cập nhật",
  );

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const listUsersQuerySchema = z.object({
  q: z.string().max(100).optional(),
  role: userRoleSchema.optional(),
  status: z.enum(["active", "archived", "all"]).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export interface InviteUserResponse {
  user: AdminUser;
  tempPassword: string;
}
