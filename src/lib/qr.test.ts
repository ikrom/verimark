import { describe, it, expect } from "vitest";
import { toDataURL } from "./qr";

describe("toDataURL", () => {
  it("returns a base64 PNG data URL", async () => {
    const url = await toDataURL("https://example.com");
    expect(url).toMatch(/^data:image\/png;base64,/);
    expect(url.length).toBeGreaterThan(100);
  });
  it("larger size → larger data URL", async () => {
    const small = await toDataURL("hi", 64);
    const large = await toDataURL("hi", 256);
    expect(large.length).toBeGreaterThan(small.length);
  });
  it("different inputs produce different output", async () => {
    const a = await toDataURL("foo");
    const b = await toDataURL("bar");
    expect(a).not.toBe(b);
  });
});
