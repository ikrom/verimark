import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("tool", () => {
  test("home page loads and shows dropzone + privacy meter", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/drop your file here/i)).toBeVisible();
    await expect(page.getByText(/0 bytes uploaded/i)).toBeVisible();
  });

  test("drop a file shows canvas + controls", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.getByText(/Position/)).toBeVisible();
    await expect(page.getByText(/Appearance/)).toBeVisible();
    await expect(page.getByText(/Export/)).toBeVisible();
  });

  test("custom watermark text is editable", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const textarea = page.getByPlaceholder(/verifikasi/i);
    await textarea.fill("My custom mark");
    await expect(textarea).toHaveValue("My custom mark");
    await expect(page.getByText(/SHA-256:/)).toBeVisible();
  });

  test("switching to tiled mode hides position controls", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.getByText(/Position/)).toBeVisible();
    await page.getByRole("button", { name: /tiled \(repeat\)/i }).click();
    await expect(page.getByText(/Position/)).not.toBeVisible();
  });

  test("download exports a PNG file", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    // Wait for the canvas to be initialized and the image to load.
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.getByText(/SHA-256:/)).toBeVisible();
    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await page.getByRole("button", { name: /^download$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test("remove returns to dropzone", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.getByText(/SHA-256:/)).toBeVisible();
    await page.getByRole("button", { name: /^remove$/i }).click();
    await expect(page.getByText(/drop your file here/i)).toBeVisible();
  });

  test("reject non-image (txt file)", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("just a text file"),
    });
    await expect(page.getByRole("alert").filter({ hasText: /unrecognized|mismatch|empty/i })).toBeVisible({ timeout: 5_000 });
  });
});
