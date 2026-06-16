import { test, expect } from "@playwright/test";

test("home page title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/verimark/i);
});

test("robots.txt allows all", async ({ request }) => {
  const r = await request.get("/robots.txt");
  expect(r.status()).toBe(200);
  expect(await r.text()).toMatch(/allow: \//i);
});

test("favicon.svg returns 200", async ({ request }) => {
  const r = await request.get("/favicon.svg");
  expect(r.status()).toBe(200);
});

test("privacy page renders", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /privacy/i })).toBeVisible();
});

test("terms page renders", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /terms/i })).toBeVisible();
});

test("404 returns custom page", async ({ page }) => {
  const r = await page.goto("/does-not-exist");
  expect(r?.status()).toBe(404);
  await expect(page.getByText(/404|not found/i)).toBeVisible();
});
