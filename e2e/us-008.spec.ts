import { test, expect } from "@playwright/test";

// US-008 happy path — admin archives a feature inside a project. After
// archive, the feature disappears from the project landing list AND
// the direct feature URL returns 404. Covers AC-1, AC-4, AC-5.

test("US-008 happy path: admin archives feature → list refresh + direct URL 404", async ({
  page,
}) => {
  const stamp = Date.now();
  const projectName = `US-008 Pilot ${stamp}`;
  const projectSlug = `us008-pilot-${stamp}`;
  const featureTitle = `Feature To Archive ${stamp}`;
  const featureSlug = `arc-${stamp}`;

  // Auto-accept native confirm() dialogs.
  page.on("dialog", (dialog) => dialog.accept());

  // 1. Login as admin.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page).toHaveURL("/");

  // 2. Create project via header CTA.
  await page.getByRole("button", { name: /^tạo project$/i }).click();
  const projectDialog = page.getByRole("dialog");
  await projectDialog.getByLabel(/tên project/i).fill(projectName);
  await projectDialog.getByLabel(/^slug/i).fill(projectSlug);
  await projectDialog.getByRole("button", { name: /^tạo project$/i }).click();
  await expect(page).toHaveURL(`/projects/${projectSlug}`);

  // 3. Create the feature.
  await page.getByRole("button", { name: /thêm feature/i }).click();
  const featureDialog = page.getByRole("dialog");
  await featureDialog.getByLabel(/tiêu đề/i).fill(featureTitle);
  await featureDialog.getByLabel(/^slug/i).fill(featureSlug);
  await featureDialog.getByRole("button", { name: /^tạo feature$/i }).click();

  // CreateFeatureDialog success → navigates straight into the feature
  // detail. Go back to the project landing so we can interact with the
  // FeatureCard on the catalog grid.
  await expect(page).toHaveURL(`/projects/${projectSlug}/features/${featureSlug}`);
  await page.goto(`/projects/${projectSlug}`);

  // FeatureCard aria-label = "Xem chi tiết feature <title>".
  const cardLabel = new RegExp(`xem chi tiết feature ${featureTitle}`, "i");
  await expect(page.getByRole("link", { name: cardLabel })).toBeVisible();

  // 4. AC-1: ⋯ visible cho admin trên FeatureCard. Click → menu.
  await page
    .getByRole("link", { name: cardLabel })
    .getByRole("button", { name: /thao tác feature/i })
    .click();
  await page.getByRole("menuitem", { name: /lưu trữ feature/i }).click();

  // 5. AC-4: feature mất khỏi danh sách (confirm auto-accepted via handler).
  await expect(page.getByRole("link", { name: cardLabel })).toHaveCount(0);

  // 6. AC-5: direct URL trả 404 UI.
  await page.goto(`/projects/${projectSlug}/features/${featureSlug}`);
  await expect(page.getByText(/không tìm thấy feature/i)).toBeVisible();
});
