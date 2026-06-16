import { describe, it, expect } from "vitest";
import { sha256Hex, shortHash } from "./crypto";

describe("sha256Hex", () => {
  it("hashes empty buffer (known vector)", async () => {
    expect(await sha256Hex(new Uint8Array(0))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
  it("hashes 'abc' (NIST test vector)", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("accepts Blob input", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])]);
    const hash = await sha256Hex(blob);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("produces 64-char lowercase hex", async () => {
    const hash = await sha256Hex(new Uint8Array([0xff, 0xab, 0xcd]));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toMatch(/[A-F]/);
  });
  it("is deterministic for same input", async () => {
    const a = await sha256Hex(new TextEncoder().encode("hello"));
    const b = await sha256Hex(new TextEncoder().encode("hello"));
    expect(a).toBe(b);
  });
  it("differs for different input", async () => {
    const a = await sha256Hex(new TextEncoder().encode("hello"));
    const b = await sha256Hex(new TextEncoder().encode("world"));
    expect(a).not.toBe(b);
  });
});

describe("shortHash", () => {
  it("returns first 7 chars by default", () => {
    expect(shortHash("abcdef1234567890")).toBe("abcdef1");
  });
  it("respects custom length", () => {
    expect(shortHash("abcdef1234567890", 4)).toBe("abcd");
  });
  it("returns whole string if shorter than N", () => {
    expect(shortHash("abc", 10)).toBe("abc");
  });
});
