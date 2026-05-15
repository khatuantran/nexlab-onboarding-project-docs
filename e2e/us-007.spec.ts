import { test, expect } from "@playwright/test";

// US-007 happy path — admin invites a new user, copies the temp password,
// new user logs in with it, admin returns and edits role, disables,
// re-enables, then resets password. Covers AC-1, AC-2, AC-3, AC-5, AC-6,
// AC-7. Last-admin guard (AC-8) is covered by API integration tests.

test("US-007 happy path: invite → login → edit → disable → re-enable → reset", async ({
  page,
  context,
}) => {
  const stamp = Date.now();
  const email = `e2e-user-${stamp}@nexlab.com`;
  const displayName = `E2E User ${stamp}`;

  page.on("dialog", (dialog) => dialog.accept());

  // 1. Login as admin and navigate to admin users page.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: /quản lý user/i }).click();
  await expect(page).toHaveURL("/admin/users");
  await expect(page.getByRole("heading", { name: /quản lý user/i })).toBeVisible();

  // 2. Invite (AC-3).
  await page.getByRole("button", { name: /mời user mới/i }).click();
  const inviteDialog = page.getByRole("dialog");
  await inviteDialog.getByLabel(/email/i).fill(email);
  await inviteDialog.getByLabel(/tên hiển thị/i).fill(displayName);
  await inviteDialog.getByRole("button", { name: /^mời user$/i }).click();

  // Reveal modal shows the temp password (AC-3).
  const revealDialog = page.getByRole("dialog");
  await expect(revealDialog).toContainText(email);
  const tempPassword = (await revealDialog.locator("code").first().innerText()).trim();
  expect(tempPassword).toHaveLength(12);
  await revealDialog.getByRole("button", { name: /đã copy, đóng/i }).click();

  // New row appears in the table (AC-2).
  await expect(page.getByText(displayName).first()).toBeVisible();

  // 3. New user logs in via separate browser context.
  const newPage = await context.newPage();
  await newPage.goto("/login");
  await newPage.getByLabel(/email/i).fill(email);
  await newPage.getByLabel(/mật khẩu/i).fill(tempPassword);
  await newPage.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(newPage).toHaveURL("/");
  await newPage.close();

  // 4. Edit role (AC-5). Find the row, open menu, click Sửa user.
  const row = page.getByRole("row", { name: new RegExp(displayName) });
  await row.getByRole("button", { name: /thao tác user/i }).click();
  await page.getByRole("menuitem", { name: /sửa user/i }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel(/role/i).selectOption("admin");
  await editDialog.getByRole("button", { name: /lưu thay đổi/i }).click();
  await expect(page.getByText("Đã cập nhật user")).toBeVisible();

  // 5. Disable user (AC-6).
  await row.getByRole("button", { name: /thao tác user/i }).click();
  await page.getByRole("menuitem", { name: /disable user/i }).click();
  await expect(page.getByText(/đã disable user/i)).toBeVisible();

  // Disabled user cannot login (USER_DISABLED → toast / inline error).
  const blockedPage = await context.newPage();
  await blockedPage.goto("/login");
  await blockedPage.getByLabel(/email/i).fill(email);
  await blockedPage.getByLabel(/mật khẩu/i).fill(tempPassword);
  await blockedPage.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(blockedPage.getByText(/vô hiệu hoá/i)).toBeVisible();
  await blockedPage.close();

  // 6. Flip filter to Disabled to find the row, re-enable.
  await page.getByLabel(/filter status/i).selectOption("archived");
  const disabledRow = page.getByRole("row", { name: new RegExp(displayName) });
  await disabledRow.getByRole("button", { name: /thao tác user/i }).click();
  await page.getByRole("menuitem", { name: /enable user/i }).click();
  await expect(page.getByText(/đã enable user/i)).toBeVisible();

  // 7. Reset password (AC-7) — back to active filter.
  await page.getByLabel(/filter status/i).selectOption("active");
  const activeRow = page.getByRole("row", { name: new RegExp(displayName) });
  await activeRow.getByRole("button", { name: /thao tác user/i }).click();
  await page.getByRole("menuitem", { name: /reset mật khẩu/i }).click();
  const resetReveal = page.getByRole("dialog");
  const newTemp = (await resetReveal.locator("code").first().innerText()).trim();
  expect(newTemp).toHaveLength(12);
  expect(newTemp).not.toBe(tempPassword);
  await resetReveal.getByRole("button", { name: /đã copy, đóng/i }).click();

  // 8. New password works.
  const afterReset = await context.newPage();
  await afterReset.goto("/login");
  await afterReset.getByLabel(/email/i).fill(email);
  await afterReset.getByLabel(/mật khẩu/i).fill(newTemp);
  await afterReset.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(afterReset).toHaveURL("/");
  await afterReset.close();
});

test("US-007 non-admin redirected from /admin/users (AC-1)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");
  // Admin link is not rendered for non-admin.
  await expect(page.getByRole("link", { name: /quản lý user/i })).toHaveCount(0);
  // Direct navigation also bounces to "/".
  await page.goto("/admin/users");
  await expect(page).toHaveURL("/");
});
