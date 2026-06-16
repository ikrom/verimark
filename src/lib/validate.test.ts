import { describe, it, expect } from "vitest";
import { detectType, validateFile, sanitizeFilename, MAX_FILE } from "./validate";

function makeFile(bytes: number[], name = "test", type = ""): File {
  const arr = new Uint8Array(bytes);
  const blob = new Blob([arr], { type });
  return new File([blob], name, { type });
}

describe("detectType", () => {
  it("detects JPEG (FF D8 FF)", async () => {
    const f = makeFile([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(await detectType(f)).toBe("image/jpeg");
  });
  it("detects PNG", async () => {
    const f = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(await detectType(f)).toBe("image/png");
  });
  it("detects PDF", async () => {
    const f = makeFile([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await detectType(f)).toBe("application/pdf");
  });
  it("detects WebP (RIFF...WEBP)", async () => {
    const f = makeFile([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(await detectType(f)).toBe("image/webp");
  });
  it("detects GIF", async () => {
    const f = makeFile([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(await detectType(f)).toBe("image/gif");
  });
  it("detects BMP", async () => {
    const f = makeFile([0x42, 0x4d]);
    expect(await detectType(f)).toBe("image/bmp");
  });
  it("detects TIFF (little-endian)", async () => {
    const f = makeFile([0x49, 0x49, 0x2a, 0x00]);
    expect(await detectType(f)).toBe("image/tiff");
  });
  it("detects TIFF (big-endian)", async () => {
    const f = makeFile([0x4d, 0x4d, 0x00, 0x2a]);
    expect(await detectType(f)).toBe("image/tiff");
  });
  it("detects HEIC (ftyp+heic)", async () => {
    const f = makeFile([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(await detectType(f)).toBe("image/heic");
  });
  it("returns unknown for random bytes", async () => {
    const f = makeFile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect(await detectType(f)).toBe("unknown");
  });
  it("returns unknown for empty input", async () => {
    const f = makeFile([]);
    expect(await detectType(f)).toBe("unknown");
  });
});

describe("validateFile", () => {
  it("rejects empty file", async () => {
    const f = makeFile([], "x.png", "image/png");
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/empty/i);
  });
  it("rejects oversized file", async () => {
    const f = new File([new Uint8Array(MAX_FILE + 1)], "big.png", { type: "image/png" });
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/exceeds/i);
  });
  it("rejects unknown format", async () => {
    const f = makeFile([0x4f, 0x4c, 0x4c, 0x4f, ...Array(20).fill(0)], "x.bin", "application/octet-stream");
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unrecognized/i);
  });
  it("rejects PE signature even when declared as PNG", async () => {
    const f = makeFile([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0], "evil.png", "image/png");
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unrecognized/i);
  });
  it("rejects MIME mismatch (valid PNG declared as JPEG)", async () => {
    const f = makeFile(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(20).fill(0x55)],
      "ok.png",
      "image/jpeg",
    );
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/mismatch/i);
  });
  it("accepts valid PNG with matching MIME", async () => {
    const f = makeFile(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(20).fill(0x55)],
      "ok.png",
      "image/png",
    );
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(true);
    expect(r.detected).toBe("image/png");
  });
  it("accepts HEIC with empty declared MIME (Safari quirk)", async () => {
    const f = makeFile(
      [0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, ...Array(10).fill(0)],
      "x.heic",
      "",
    );
    const r = await validateFile(f, 0);
    expect(r.ok).toBe(true);
  });
  it("respects batch cap", async () => {
    const f = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff], "ok.png", "image/png");
    const r = await validateFile(f, 500 * 1024 * 1024 - 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/batch/i);
  });
});

describe("sanitizeFilename", () => {
  it("strips path separators", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
  });
  it("replaces control chars with underscore", () => {
    expect(sanitizeFilename("foo\x00bar.txt")).toBe("foo_bar.txt");
  });
  it("caps at 120 chars", () => {
    const long = `${"a".repeat(200)}.png`;
    expect(sanitizeFilename(long).length).toBe(120);
  });
  it("handles empty input", () => {
    expect(sanitizeFilename("")).toBe("file");
  });
  it("strips Windows-forbidden chars", () => {
    expect(sanitizeFilename('a<b>c|d"e?f*g.txt')).toBe("a_b_c_d_e_f_g.txt");
  });
  it("handles Windows backslash path", () => {
    expect(sanitizeFilename("C:\\Users\\foo\\image.png")).toBe("image.png");
  });
});
