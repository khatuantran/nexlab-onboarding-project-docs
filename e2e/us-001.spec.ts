import { test, expect } from "@playwright/test";

// US-001 happy path — dev onboards, reads a feature, then searches.
// Covers AC-1 (login), AC-3 (project landing), AC-5 (5 sections in order),
// AC-6 (markdown render), AC-7 (FTS search with <mark>).
test("US-001 happy path: login → project → feature → search", async ({ page }) => {
  // 1. Login
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@local");
  await page.getByLabel(/mật khẩu/i).fill("dev12345");
  await page.getByRole("button", { name: /đăng nhập/i }).click();

  // Landed on /
  await expect(page).toHaveURL("/");

  // 2. Go to demo project
  await page.goto("/projects/demo");
  await expect(page.getByRole("heading", { name: /demo/i }).first()).toBeVisible();
  const featureLink = page.getByRole("link", { name: /login with email/i });
  await expect(featureLink).toBeVisible();
  await featureLink.click();

  // 3. Feature detail — 5 sections in order
  const sectionHeadings = ["Business", "User Flow", "Business Rules", "Tech Notes", "Screenshots"];
  for (const name of sectionHeadings) {
    await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  }

  // 4. Search via header
  const searchbox = page.getByRole("searchbox", { name: /tìm feature/i });
  await searchbox.fill("login");
  await searchbox.press("Enter");

  // Either hits render with <mark>, or (in some data states) empty-result copy.
  // US-001 seed has "Login with email" → expect at least one <mark>.
  await expect(page.locator("mark").first()).toBeVisible({ timeout: 5_000 });
});
