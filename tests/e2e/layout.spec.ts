import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("layout", () => {
  test("canvas resizes to image aspect ratio (no letterboxing)", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.locator("canvas").first()).toBeVisible();
    // Wait for fabric to load + render
    await page.waitForTimeout(800);
    const box = await page.locator("canvas").first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    // Fixture is 100x100 → canvas should be roughly square (aspect 0.5-2.0)
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2.0);
    // Canvas must not dominate the viewport — leave room for sidebar
    expect(box.width).toBeLessThan(page.viewportSize()!.width - 340);
  });

  test("sidebar is internal-scrollable and all sections are reachable", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(500);
    const aside = page.locator('[data-testid="sidebar"]');
    const overflow = await aside.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflow).toBe("auto");
    // All sections must be reachable (auto-scrolls in Playwright)
    await expect(aside.getByText("Preset")).toBeVisible();
    await expect(aside.getByText("Text")).toBeVisible();
    await expect(aside.getByText("Mode")).toBeVisible();
    await expect(aside.getByText("Position")).toBeVisible();
    await expect(aside.getByText("Font")).toBeVisible();
    await expect(aside.getByText("Appearance")).toBeVisible();
    await expect(aside.getByText("Export")).toBeVisible();
  });

  test("page itself does not scroll vertically on tool view", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(500);
    // The body should not need to scroll — sidebar absorbs overflow
    const canScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight + 1;
    });
    expect(canScroll).toBe(false);
  });
});
