import type * as Fabric from "fabric";

export function buildTiledPattern(
  fabricNs: typeof Fabric,
  text: string,
  options: {
    fontSize?: number;
    color?: string;
    opacity?: number;
    rotation?: number;
    fontFamily?: string;
  } = {},
): Fabric.Pattern {
  const {
    fontSize = 24,
    color = "#000000",
    opacity = 0.2,
    rotation = -30,
    fontFamily = "Inter",
  } = options;
  const cw = 360;
  const ch = 220;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.clearRect(0, 0, cw, ch);
  ctx.font = `${fontSize}px ${fontFamily}, sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillText(text, 0, 0);
  return new fabricNs.Pattern({ source: c, repeat: "repeat" });
}

export function applyTiledWatermark(
  fabricNs: typeof Fabric,
  canvas: Fabric.Canvas,
  text: string,
  options: Parameters<typeof buildTiledPattern>[2] = {},
): void {
  const existing = canvas
    .getObjects()
    .find(
      (o) =>
        (o as Fabric.Object & { __isTiledWatermark?: boolean })
          .__isTiledWatermark,
    );
  if (existing) canvas.remove(existing);
  if (!text.trim()) {
    canvas.requestRenderAll();
    return;
  }
  const pattern = buildTiledPattern(fabricNs, text, options);
  const rect = new fabricNs.Rect({
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    fill: pattern,
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
  (
    rect as Fabric.Object & { __isTiledWatermark?: boolean }
  ).__isTiledWatermark = true;
  canvas.add(rect);
  canvas.sendObjectToBack(rect);
  canvas.requestRenderAll();
}

export function clearTiledWatermark(canvas: Fabric.Canvas): void {
  const existing = canvas
    .getObjects()
    .find(
      (o) =>
        (o as Fabric.Object & { __isTiledWatermark?: boolean })
          .__isTiledWatermark,
    );
  if (existing) {
    canvas.remove(existing);
    canvas.requestRenderAll();
  }
}
