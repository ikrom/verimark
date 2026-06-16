import { describe, it, expect, vi } from "vitest";
import { exportCanvas } from "./export";

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 10;
  c.height = 10;
  return c;
}

describe("exportCanvas", () => {
  it("calls toBlob with image/png for PNG format", async () => {
    const canvas = makeCanvas();
    const toBlob = vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
      cb(new Blob(["x"]));
      return null;
    });
    await exportCanvas(canvas, "png", "out.png");
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.95);
  });

  it("calls toBlob with image/jpeg for JPEG format", async () => {
    const canvas = makeCanvas();
    const toBlob = vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
      cb(new Blob(["x"]));
      return null;
    });
    await exportCanvas(canvas, "jpeg", "out.jpg");
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.95);
  });

  it("respects custom quality", async () => {
    const canvas = makeCanvas();
    const toBlob = vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
      cb(new Blob(["x"]));
      return null;
    });
    await exportCanvas(canvas, "jpeg", "out.jpg", 0.5);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.5);
  });

  it("rejects when toBlob returns null blob", async () => {
    const canvas = makeCanvas();
    vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
      cb(null);
      return null;
    });
    await expect(exportCanvas(canvas, "png", "out.png")).rejects.toThrow();
  });
});
