import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("layout", () => {
  test("canvas uses fixed aspect (image centered with letterbox if needed)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.waitForTimeout(800);
    const box = await page.locator("canvas").first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    // Fixed 4:3 aspect — width / height should be ~1.33
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.5);
  });

  test("sidebar fits 4 sections without internal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(500);
    const aside = page.locator('[data-testid="sidebar"]');
    // All sections visible without scroll
    await expect(aside.getByText("Text")).toBeVisible();
    await expect(aside.getByText("Layout")).toBeVisible();
    await expect(aside.getByText("Style")).toBeVisible();
    await expect(aside.getByText("Export")).toBeVisible();
    // Aside must not internally scroll
    const overflow = await aside.evaluate(
      (el) => getComputedStyle(el).overflowY,
    );
    expect(overflow).toBe("hidden");
  });

  test("page itself does not scroll vertically on tool view", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(500);
    const canScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight + 1
      );
    });
    expect(canScroll).toBe(false);
  });
});
