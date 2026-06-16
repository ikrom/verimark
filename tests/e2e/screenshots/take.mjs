import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, "..", "fixtures", "sample.png");
const OUT = __dirname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:4321");
await page.waitForLoadState("networkidle");

// 1. Dropzone screenshot
await page.screenshot({ path: path.join(OUT, "dropzone.png"), fullPage: false });
console.log("Saved dropzone.png");

// 2. Tool with image loaded
await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
await page.waitForTimeout(1200); // fabric init + render
await page.screenshot({ path: path.join(OUT, "tool-loaded.png"), fullPage: false });
console.log("Saved tool-loaded.png");

// 3. Tiled mode
await page.getByRole("button", { name: /tiled \(repeat\)/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, "tiled-mode.png"), fullPage: false });
console.log("Saved tiled-mode.png");

await browser.close();
