import { test, expect } from "@playwright/test";

test.describe("security", () => {
  test("home page has strict CSP", async ({ request }) => {
    const r = await request.get("/");
    const csp = r.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });

  test("X-Content-Type-Options nosniff", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("X-Frame-Options DENY", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["x-frame-options"]).toBe("DENY");
  });

  test("Referrer-Policy no-referrer", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["referrer-policy"]).toBe("no-referrer");
  });

  test("Permissions-Policy restricts sensors", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["permissions-policy"]).toMatch(/microphone=\(\)/);
  });

  test("no third-party script connections on page load", async ({ page }) => {
    const externalScripts: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() !== "script") return;
      const url = new URL(req.url());
      if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
        externalScripts.push(req.url());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(externalScripts, `Unexpected 3rd-party script requests: ${externalScripts.join(", ")}`).toEqual([]);
  });

  test("privacy meter shows 0 bytes after file drop", async ({ page }) => {
    await page.goto("/");
    const meter = page.getByText(/0 bytes uploaded/i);
    await expect(meter).toBeVisible();
  });
});
