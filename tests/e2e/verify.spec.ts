import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test.describe("verify", () => {
  test("verify page with no hash shows fallback message", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /verify provenance/i })).toBeVisible();
    await expect(page.getByText(/no hash in url/i)).toBeVisible();
  });

  test("verify with hash in URL shows expected hash", async ({ page }) => {
    const hash = "a".repeat(64);
    await page.goto(`/verify?h=${hash}&t=2026-06-15T10:00:00.000Z`);
    await expect(page.getByText(hash)).toBeVisible();
    // The footer also has "© 2026", so target the embedded timestamp specifically.
    await expect(page.getByText(/embedded at: /i)).toBeVisible();
  });

  test("verify computes hash for uploaded file", async ({ page }) => {
    await page.goto("/verify");
    await page.locator("#verify-file").setInputFiles(FIXTURE);
    await expect(page.getByText(/^[0-9a-f]{64}$/)).toBeVisible({ timeout: 5_000 });
  });
});
