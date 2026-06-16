import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildTiledPattern } from "./tiledWatermark";

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  const fakeCtx = {
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 0 }),
    translate: () => {},
    rotate: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    rect: () => {},
    getImageData: () => ({ data: new Uint8Array(4), width: 1, height: 1 }),
    putImageData: () => {},
    createImageData: () => ({ data: new Uint8Array(4), width: 1, height: 1 }),
    drawImage: () => {},
    set fillStyle(_v: string | CanvasGradient | CanvasPattern) {},
    set strokeStyle(_v: string | CanvasGradient | CanvasPattern) {},
    set font(_v: string) {},
    set globalAlpha(_v: number) {},
    set textAlign(_v: CanvasTextAlign) {},
    set textBaseline(_v: CanvasTextBaseline) {},
    set lineWidth(_v: number) {},
    set lineCap(_v: CanvasLineCap) {},
    set lineJoin(_v: CanvasLineJoin) {},
    set globalCompositeOperation(_v: GlobalCompositeOperation) {},
  };
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(fakeCtx) as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("buildTiledPattern", () => {
  it("returns a Fabric Pattern instance", () => {
    const p = buildTiledPattern("hello");
    expect(p).toBeDefined();
    expect(p.repeat).toBe("repeat");
  });

  it("respects custom options", () => {
    const p = buildTiledPattern("hi", {
      fontSize: 48,
      color: "#ff0000",
      opacity: 0.4,
      rotation: -45,
      fontFamily: "Arial",
    });
    expect(p).toBeDefined();
  });

  it("handles empty text without throwing", () => {
    expect(() => buildTiledPattern("")).not.toThrow();
  });

  it("handles unicode text", () => {
    expect(() => buildTiledPattern("Verifikasi ✓ · 🔒")).not.toThrow();
  });
});
