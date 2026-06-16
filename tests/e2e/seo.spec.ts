import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("SEO + a11y basics", () => {
  test("home page has title, description, canonical", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/verimark/i);
    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe("https://verimark.thetas.dev/");
  });

  test("JSON-LD structured data is present", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd!);
    expect(parsed["@type"]).toBe("WebApplication");
    expect(parsed.name).toBe("Verimark");
  });

  test("robots.txt and sitemap-index.xml are reachable", async ({
    request,
  }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/sitemap-index\.xml/i);

    const sitemap = await request.get("/sitemap-index.xml");
    expect(sitemap.status()).toBe(200);
  });

  test("page has a <main> landmark and lang attribute", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main#main");
    await expect(main).toBeVisible();
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
    expect(lang!.length).toBeGreaterThan(0);
  });

  test("skip link is present and focusable", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeFocused();
  });

  test("canvas wrapper has aria-label after file drop", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const wrapper = page.locator('[aria-label="Watermark preview"]');
    await expect(wrapper).toBeVisible();
    const role = await wrapper.getAttribute("role");
    expect(role).toBe("img");
  });

  test("Export section announces status changes (aria-live)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const live = page
      .locator('[aria-live="polite"]')
      .filter({ has: page.locator('[data-testid="download-btn"]') });
    await expect(live).toBeVisible();
  });

  test("color contrast on dropzone footer text passes AA", async ({ page }) => {
    await page.goto("/");
    // The text "Magic-byte validation · 100MB cap · EXIF stripped on export"
    // must be visible and use a dark-enough color (zinc-500, not zinc-400)
    // to meet WCAG AA on the light zinc-50 background.
    const footer = page.getByText(/magic-byte validation/i);
    await expect(footer).toBeVisible();
    await expect(footer).toHaveClass(/text-zinc-500/);
    await expect(footer).not.toHaveClass(/text-zinc-400/);
  });
});
