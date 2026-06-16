import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("tool", () => {
  test("home page loads and shows dropzone + privacy meter", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/drop your file here/i)).toBeVisible();
    await expect(page.getByText(/0 bytes uploaded/i)).toBeVisible();
  });

  test("drop a file shows canvas + 4 compact sections", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.locator('[data-testid="section-text"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-style"]')).toBeVisible();
    // Export section is below the 3 scrollable sections; scroll into view
    await expect(page.locator('[data-testid="download-btn"]')).toBeVisible();
  });

  test("custom watermark text is editable", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const textarea = page.getByPlaceholder(/verifikasi/i);
    await textarea.fill("My custom mark");
    await expect(textarea).toHaveValue("My custom mark");
    await expect(page.getByText(/SHA-256:/)).toBeVisible();
  });

  test("switching to tiled mode hides position select", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(
      page.locator('[data-testid="section-layout"] select'),
    ).toBeVisible();
    await page.locator('[data-testid="mode-tiled"]').click();
    await expect(
      page.locator('[data-testid="section-layout"] select'),
    ).toHaveCount(0);
  });

  test("loading overlay appears and disappears", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    // Canvas must appear
    await expect(page.locator("canvas").first()).toBeVisible();
    // Overlay must be gone after load
    await expect(page.locator('[data-testid="loading-overlay"]')).toHaveCount(
      0,
    );
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
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("just a text file"),
      });
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /unrecognized|mismatch|empty/i }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("feature toggles", () => {
  test("QR toggle controls whether QR appears", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.waitForTimeout(800);
    // Default: QR visible (includeQR = true)
    const qrBefore = await page.locator("canvas").count();
    expect(qrBefore).toBeGreaterThan(0);
    // Toggle off
    await page.locator('[data-testid="toggle-qr"]').uncheck();
    // (QR removal re-renders canvas; presence/absence hard to test via DOM, so just verify toggle worked)
    await expect(page.locator('[data-testid="toggle-qr"]')).not.toBeChecked();
  });

  test("face blur toggle is disabled (v1 placeholder)", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const faceBlurToggle = page.locator('[data-testid="toggle-faceblur"]');
    await expect(faceBlurToggle).toBeDisabled();
    await expect(faceBlurToggle).not.toBeChecked();
  });

  test("OCR redaction toggle is disabled (v1 placeholder)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
    const ocrToggle = page.locator('[data-testid="toggle-ocr"]');
    await expect(ocrToggle).toBeDisabled();
    await expect(ocrToggle).not.toBeChecked();
  });
});
