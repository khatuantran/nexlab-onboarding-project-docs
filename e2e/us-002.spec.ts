import { test, expect } from "@playwright/test";

// US-002 happy path — admin tạo project → tạo feature → edit business
// section → reload → content persist. Covers AC-2, AC-4, AC-5, AC-6.
// Unique slug mỗi run để không đụng state cũ; seed grows nhẹ, accepted.
test("US-002 happy path: create project → create feature → edit section → persist", async ({
  page,
}) => {
  const stamp = Date.now();
  const projectName = `E2E Project ${stamp}`;
  const projectSlug = `e2e-project-${stamp}`;
  const featureTitle = `E2E Feature ${stamp}`;
  const featureSlug = `e2e-feature-${stamp}`;
  const bodyMarkdown = `# Tổng quan\n\nNội dung E2E test ${stamp}.`;

  // 1. Login as admin
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  // 2. Open CreateProjectDialog → submit
  await page.getByRole("button", { name: /^tạo project$/i }).click();
  const projectDialog = page.getByRole("dialog");
  await projectDialog.getByLabel(/tên project/i).fill(projectName);
  // Slug auto-derives — verify then submit
  await expect(projectDialog.getByLabel(/^slug/i)).toHaveValue(projectSlug);
  await projectDialog.getByRole("button", { name: /^tạo project$/i }).click();

  // 3. Landed on project page (empty state)
  await expect(page).toHaveURL(`/projects/${projectSlug}`);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  // 4. Open CreateFeatureDialog → submit
  await page.getByRole("button", { name: /thêm feature/i }).click();
  const featureDialog = page.getByRole("dialog");
  await featureDialog.getByLabel(/tiêu đề/i).fill(featureTitle);
  await expect(featureDialog.getByLabel(/^slug/i)).toHaveValue(featureSlug);
  await featureDialog.getByRole("button", { name: /^tạo feature$/i }).click();

  // 5. Landed on feature detail page
  await expect(page).toHaveURL(`/projects/${projectSlug}/features/${featureSlug}`);
  await expect(page.getByRole("heading", { name: featureTitle })).toBeVisible();

  // 6. Open business section editor → type markdown → save
  await page.getByRole("button", { name: /sửa section nghiệp vụ/i }).click();
  const editForm = page.getByRole("form", { name: /đang chỉnh sửa business/i });
  await editForm.getByLabel(/markdown source/i).fill(bodyMarkdown);
  await editForm.getByRole("button", { name: /^lưu$/i }).click();

  // Editor collapses → rendered markdown visible
  await expect(page.getByRole("form", { name: /đang chỉnh sửa business/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /tổng quan/i, level: 1 })).toBeVisible();

  // 7. Reload → content persists
  await page.reload();
  await expect(page.getByRole("heading", { name: /tổng quan/i, level: 1 })).toBeVisible();
  await expect(page.getByText(new RegExp(`Nội dung E2E test ${stamp}`))).toBeVisible();
});
