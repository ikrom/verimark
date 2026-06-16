import { describe, it, expect } from "vitest";
import { buildWatermarkText, PRESETS } from "./presets";

describe("PRESETS", () => {
  it("starts with a blank/custom preset", () => {
    expect(PRESETS[0].id).toBe("blank");
    expect(PRESETS[0].purpose).toBe("");
  });
  it("has at least 5 entries", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
  });
  it("has unique ids", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("all entries have non-empty labels", () => {
    for (const p of PRESETS) expect(p.label.length).toBeGreaterThan(0);
  });
});

describe("buildWatermarkText", () => {
  const fixed = new Date("2026-06-15T10:00:00Z");

  it("returns purpose only when date+hash disabled", () => {
    expect(buildWatermarkText("KYC", false, "", fixed)).toBe("KYC");
  });
  it("includes date when enabled", () => {
    const out = buildWatermarkText("KYC", true, "", fixed);
    expect(out).toMatch(/^KYC · \d{2}-\d{2}-\d{4}$/);
  });
  it("includes hash with # prefix when enabled", () => {
    expect(buildWatermarkText("KYC", false, "abc1234", fixed)).toBe("KYC · #abc1234");
  });
  it("joins all three with middle dot", () => {
    expect(buildWatermarkText("KYC", true, "abc", fixed)).toBe("KYC · 15-06-2026 · #abc");
  });
  it("skips empty purpose gracefully", () => {
    expect(buildWatermarkText("", true, "abc", fixed)).toBe("15-06-2026 · #abc");
  });
  it("skips empty hash gracefully", () => {
    expect(buildWatermarkText("KYC", true, "", fixed)).toBe("KYC · 15-06-2026");
  });
});
