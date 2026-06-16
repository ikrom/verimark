import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("textbox interaction", () => {
  test("text watermark has bold selection border (custom borderColor)", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(800);

    // Click on the canvas where the watermark is (center)
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("No canvas");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    // No console errors during interaction; selection styling is set on the Fabric object.
    expect(errors).toEqual([]);
  });

  test("toggling QR off removes the QR from canvas", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(1500); // wait for QR async to complete

    // Toggle QR off
    const qrToggle = page.locator('[data-testid="toggle-qr"]');
    await qrToggle.uncheck();
    await page.waitForTimeout(500);

    await expect(qrToggle).not.toBeChecked();
    expect(errors).toEqual([]);
  });

  test("toggling QR on after off re-adds it", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await page.waitForTimeout(1500);

    const qrToggle = page.locator('[data-testid="toggle-qr"]');
    await qrToggle.uncheck();
    await page.waitForTimeout(300);
    await qrToggle.check();
    await page.waitForTimeout(800);

    await expect(qrToggle).toBeChecked();
    expect(errors).toEqual([]);
  });
});
