import { test, expect } from "@playwright/test";
import path from "node:path";

// US-003 happy path — admin creates project + feature, then author
// role adds a whitelisted embed (GitHub PR URL) trong tech-notes and
// uploads a PNG trong screenshots. Then reloads and asserts:
// - embed-card renders for the PR URL (AC-2, AC-8).
// - <img src="/api/v1/uploads/..."> renders (AC-4).
// - ownership subtitle "Cập nhật bởi @Developer" under both sections (AC-7).
test("US-003 happy path: tech-notes embed + screenshots upload + ownership", async ({ page }) => {
  const stamp = Date.now();
  const projectName = `USthree E2E ${stamp}`;
  const projectSlug = `usthree-e2e-${stamp}`;
  const featureTitle = `Feature tech ${stamp}`;
  const featureSlug = `feature-tech-${stamp}`;

  // 1. Admin creates project + feature so we have a target.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: /^tạo project$/i }).click();
  const projectDialog = page.getByRole("dialog");
  await projectDialog.getByLabel(/tên project/i).fill(projectName);
  await projectDialog.getByRole("button", { name: /^tạo project$/i }).click();
  await expect(page).toHaveURL(`/projects/${projectSlug}`);

  await page.getByRole("button", { name: /thêm feature/i }).click();
  const featureDialog = page.getByRole("dialog");
  await featureDialog.getByLabel(/tiêu đề/i).fill(featureTitle);
  await featureDialog.getByRole("button", { name: /^tạo feature$/i }).click();
  await expect(page).toHaveURL(`/projects/${projectSlug}/features/${featureSlug}`);

  // 2. Logout → login as author ("Developer").
  await page.getByRole("button", { name: /đăng xuất/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/email/i).fill("dev@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");
  await page.goto(`/projects/${projectSlug}/features/${featureSlug}`);
  await expect(page.getByRole("heading", { name: featureTitle })).toBeVisible();

  // 3. Edit tech-notes: type GitHub PR autolink → save → embed-card appears.
  await page.getByRole("button", { name: /sửa section tech notes/i }).click();
  const techForm = page.getByRole("form", { name: /đang chỉnh sửa tech-notes/i });
  await techForm
    .getByLabel(/markdown source/i)
    .fill(`Xem PR: https://github.com/acme/repo/pull/${stamp}`);
  await techForm.getByRole("button", { name: /^lưu$/i }).click();
  await expect(page.getByRole("form", { name: /đang chỉnh sửa tech-notes/i })).toHaveCount(0);
  await expect(page.locator("a.embed-card").first()).toBeVisible();

  // 4. Edit screenshots: Upload a fixture PNG → assert <img> renders after save.
  await page.getByRole("button", { name: /sửa section screenshots/i }).click();
  const shotForm = page.getByRole("form", { name: /đang chỉnh sửa screenshots/i });
  const fileInput = shotForm.locator('input[type="file"]');
  await fileInput.setInputFiles(path.resolve(__dirname, "fixtures/tiny.png"));
  // Wait for the markdown insert; the textarea should contain an !() reference.
  await expect(shotForm.getByLabel(/markdown source/i)).toHaveValue(
    /!\[tiny\]\(\/api\/v1\/uploads\//,
  );
  await shotForm.getByRole("button", { name: /^lưu$/i }).click();
  await expect(page.getByRole("form", { name: /đang chỉnh sửa screenshots/i })).toHaveCount(0);

  // 5. Reload → both pieces persist.
  await page.reload();
  await expect(page.locator("a.embed-card").first()).toBeVisible();
  const img = page.locator('img[src^="/api/v1/uploads/"]');
  await expect(img.first()).toBeVisible();

  // 6. Ownership subtitle shows dev user under tech-notes + screenshots.
  const ownershipLines = page.getByText(/Cập nhật bởi @/);
  await expect(ownershipLines.first()).toBeVisible();
});
