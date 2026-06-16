import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, "..", "fixtures", "sample.png");
const OUT = __dirname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
await page.goto("http://localhost:4321");
await page.waitForLoadState("networkidle");

// 1. Dropzone screenshot
await page.screenshot({
  path: path.join(OUT, "dropzone.png"),
  fullPage: false,
});
console.log("Saved dropzone.png");

// 2. Loading overlay (catch it 50ms after file is selected, before image loads)
await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
await page.waitForTimeout(50); // catch the loading overlay
await page.screenshot({ path: path.join(OUT, "loading.png"), fullPage: false });
console.log("Saved loading.png");
await page.waitForTimeout(2000); // wait for actual load

// 3. Tool with image loaded
await page.screenshot({
  path: path.join(OUT, "tool-loaded.png"),
  fullPage: false,
});
console.log("Saved tool-loaded.png");

// 4. Tiled mode
await page.locator('[data-testid="mode-tiled"]').click();
await page.waitForTimeout(600);
await page.screenshot({
  path: path.join(OUT, "tiled-mode.png"),
  fullPage: false,
});
console.log("Saved tiled-mode.png");

// 5. Toggles (scroll sidebar so the new v1 toggles are visible)
await page.locator('[data-testid="mode-single"]').click();
await page.waitForTimeout(200);
const sidebar = page.locator('[data-testid="sidebar"]');
await sidebar
  .locator('[data-testid="toggle-faceblur"]')
  .scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(OUT, "toggles.png"), fullPage: false });
console.log("Saved toggles.png");

await browser.close();
