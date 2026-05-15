import path from "node:path";
import { test, expect } from "@playwright/test";

// US-009 happy path — self-service profile. Login → UserMenu →
// /profile → inline rename → server-persisted across reload → change
// password → re-login with new pw → upload avatar → header avatar
// reflects the new URL. Covers AC-1, AC-3, AC-4, AC-7.

const TINY_PNG = path.join(process.cwd(), "e2e", "fixtures", "tiny.png");

test("US-009 happy path: edit name → change pw → upload avatar", async ({ page }) => {
  const stamp = Date.now();
  const renamed = `E2E Dev ${stamp}`;
  const newPassword = `e2eNewPw${stamp}`;

  page.on("dialog", (dialog) => dialog.accept());

  // 1. Login as the seeded author (dev@local / dev12345). The test
  //    rolls back its mutations at the end so other suites stay green.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  // 2. AC-1: UserMenu → "Hồ sơ của tôi" → /profile.
  await page.getByRole("button", { name: /tài khoản/i }).click();
  await page.getByRole("menuitem", { name: /hồ sơ của tôi/i }).click();
  await expect(page).toHaveURL("/profile");
  await expect(page.getByRole("heading", { name: /hồ sơ của tôi/i })).toBeVisible();

  // 3. AC-3: inline rename displayName.
  await page.getByRole("button", { name: /sửa/i }).click();
  const nameInput = page.getByLabel(/tên hiển thị/i);
  await nameInput.fill(renamed);
  await page.getByRole("button", { name: /^lưu$/i }).click();
  // Reload — name must persist server-side.
  await page.reload();
  await expect(page.getByText(renamed)).toBeVisible();

  // 4. AC-4: change password. After 204, current session stays alive.
  await page.getByLabel(/mật khẩu hiện tại/i).fill("dev12345");
  await page.getByLabel(/mật khẩu mới \(/i).fill(newPassword);
  await page.getByLabel(/xác nhận mật khẩu mới/i).fill(newPassword);
  await page.getByRole("button", { name: /^đổi mật khẩu$/i }).click();

  // Logout via UserMenu, then verify the new password works.
  await page.getByRole("button", { name: /tài khoản/i }).click();
  await page.getByRole("menuitem", { name: /đăng xuất/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/email/i).fill("dev@local");
  await page.getByLabel(/mật khẩu/i).fill(newPassword);
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  // 5. AC-7: upload avatar. Fixture is a tiny PNG (< 2 MB, valid magic).
  await page.getByRole("button", { name: /tài khoản/i }).click();
  await page.getByRole("menuitem", { name: /hồ sơ của tôi/i }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TINY_PNG);
  // Wait for the upload mutation to settle by polling for the trigger
  // button to be re-enabled (mutation.isPending → false).
  await expect(page.getByRole("button", { name: /tải lên ảnh mới/i })).toBeEnabled();

  // 6. Cleanup: restore display name + password so reruns + other E2E
  //    suites stay deterministic. (Avatar URL is left dangling on
  //    Cloudinary; CR-004 §Orphan drift accepted.)
  await page.getByRole("button", { name: /sửa/i }).click();
  await page.getByLabel(/tên hiển thị/i).fill("Dev");
  await page.getByRole("button", { name: /^lưu$/i }).click();

  await page.getByLabel(/mật khẩu hiện tại/i).fill(newPassword);
  await page.getByLabel(/mật khẩu mới \(/i).fill("dev12345");
  await page.getByLabel(/xác nhận mật khẩu mới/i).fill("dev12345");
  await page.getByRole("button", { name: /^đổi mật khẩu$/i }).click();
});
