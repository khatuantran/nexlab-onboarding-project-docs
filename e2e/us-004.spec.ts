import { test, expect } from "@playwright/test";

// US-004 happy path — admin lands on catalog → clicks a seeded project
// → opens ⋯ menu → "Sửa project" renames → "Lưu trữ" archives → redirect
// `/` + project gone from catalog. Covers AC-1, AC-2, AC-5, AC-6, AC-7, AC-9.
// Unique project per run để không đụng state cũ; seed grows nhẹ, accepted.
test("US-004 happy path: catalog → detail → edit → archive → redirect", async ({ page }) => {
  const stamp = Date.now();
  const originalName = `E2E Catalog ${stamp}`;
  const originalSlug = `e2e-catalog-${stamp}`;
  const renamedName = `${originalName} (renamed)`;

  // Auto-accept all native confirm dialogs (cancel-dirty + archive confirm).
  page.on("dialog", (dialog) => dialog.accept());

  // 1. Login as admin
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  // 2. Seed a project via CreateProjectDialog (we'll archive this one, not
  //    touch the demo seed). After create, landed on /projects/:slug.
  await page.getByRole("button", { name: /^tạo project$/i }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByLabel(/tên project/i).fill(originalName);
  await createDialog.getByRole("button", { name: /^tạo project$/i }).click();
  await expect(page).toHaveURL(`/projects/${originalSlug}`);

  // 3. Back to catalog → our project shows in list (AC-1, AC-2).
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /danh sách project/i })).toBeVisible();
  const row = page.getByRole("link", {
    name: new RegExp(`xem chi tiết project ${originalName}`, "i"),
  });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(`/projects/${originalSlug}`);
  await expect(page.getByRole("heading", { name: originalName, level: 1 })).toBeVisible();

  // 4. Open ⋯ actions menu → "Sửa project" → rename → Lưu (AC-5).
  await page.getByRole("button", { name: /thao tác project/i }).click();
  await page.getByRole("menuitem", { name: /sửa project/i }).click();
  const editDialog = page.getByRole("dialog", { name: /sửa project/i });
  await expect(editDialog).toBeVisible();
  // Slug is readonly (AC-6)
  await expect(editDialog.getByLabel(/^slug$/i)).toHaveAttribute("readonly", "");
  const nameInput = editDialog.getByLabel(/tên project/i);
  await nameInput.fill(renamedName);
  await editDialog.getByRole("button", { name: /^lưu$/i }).click();

  // Dialog closes + heading reflects new name.
  await expect(editDialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: renamedName, level: 1 })).toBeVisible();

  // 5. Open ⋯ again → "Lưu trữ project" → confirm auto-accepted (AC-7).
  await page.getByRole("button", { name: /thao tác project/i }).click();
  await page.getByRole("menuitem", { name: /lưu trữ project/i }).click();

  // 6. Redirect to catalog, archived project gone from list (AC-4 + AC-9).
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /danh sách project/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`xem chi tiết project ${renamedName}`, "i") }),
  ).toHaveCount(0);
});
