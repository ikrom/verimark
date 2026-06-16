import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, "..", "fixtures", "sample.png");
const OUT = __dirname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:4321");
await page.waitForLoadState("networkidle");
await page.locator('input[type="file"]').first().setInputFiles(FIXTURE);
await page.waitForTimeout(2000);

// Export the canvas as PNG and check the actual rendered image
const dataUrl = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  return canvas.toDataURL("image/png");
});
if (dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const buf = Buffer.from(base64, "base64");
  writeFileSync(path.join(OUT, "canvas-export.png"), buf);
  console.log("Canvas exported:", buf.length, "bytes");

  // Check if the image is red or white
  const img = await import("@playwright/test");
  // Use a simple approach: check pixel data
  const pixelCheck = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Check center pixel
    const center = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    // Check top-left
    const tl = ctx.getImageData(10, 10, 1, 1).data;
    // Check bottom-right
    const br = ctx.getImageData(canvas.width - 10, canvas.height - 10, 1, 1).data;
    return { center: [...center], topLeft: [...tl], bottomRight: [...br] };
  });
  console.log("Pixel check:", JSON.stringify(pixelCheck));
}

await browser.close();
