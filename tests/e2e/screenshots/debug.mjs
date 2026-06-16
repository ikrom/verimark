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

const consoleLogs = [];
page.on("console", (msg) => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
});

await page.goto("http://localhost:4321");
await page.waitForLoadState("networkidle");

await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
await page.waitForTimeout(2000);

// Get canvas + image dimensions
const dims = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const wrapper = canvas?.parentElement;
  return {
    canvasW: canvas?.width,
    canvasH: canvas?.height,
    canvasClientW: canvas?.clientWidth,
    canvasClientH: canvas?.clientHeight,
    canvasRect: canvas?.getBoundingClientRect(),
    wrapperRect: wrapper?.getBoundingClientRect(),
  };
});
console.log("DIMS:", JSON.stringify(dims, null, 2));
console.log("CONSOLE LOGS:");
for (const l of consoleLogs) console.log("  ", l);

await browser.close();
