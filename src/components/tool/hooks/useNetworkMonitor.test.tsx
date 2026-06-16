import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkMonitor, formatBytes } from "./useNetworkMonitor";

describe("useNetworkMonitor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts at 0 bytes", () => {
    const { result } = renderHook(() => useNetworkMonitor());
    expect(result.current).toBe(0);
  });

  it("increments after fetch with string body", async () => {
    const { result } = renderHook(() => useNetworkMonitor());
    const before = result.current;
    await act(async () => {
      await fetch("data:text/plain,x", { method: "POST", body: "hello-world" });
    });
    expect(result.current).toBeGreaterThan(before);
  });

  it("increments after fetch with Blob body", async () => {
    const { result } = renderHook(() => useNetworkMonitor());
    const before = result.current;
    const blob = new Blob([new Uint8Array(1024)]);
    await act(async () => {
      await fetch("data:text/plain,x", { method: "POST", body: blob });
    });
    expect(result.current).toBeGreaterThanOrEqual(before + 1024);
  });

  it("does not double-count on multiple subscribers", async () => {
    renderHook(() => useNetworkMonitor());
    const { result: r2 } = renderHook(() => useNetworkMonitor());
    const before = r2.current;
    const blob = new Blob([new Uint8Array(512)]);
    await act(async () => {
      await fetch("data:text/plain,x", { method: "POST", body: blob });
    });
    // The byte count must increase by exactly the body size, not body size × number of subscribers.
    expect(r2.current - before).toBe(512);
  });
});

describe("formatBytes", () => {
  it("formats < 1 KB as B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats < 1 MB as KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
  it("formats >= 1 MB as MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
