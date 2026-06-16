import * as fabric from "fabric";

export function buildTiledPattern(
  text: string,
  options: {
    fontSize?: number;
    color?: string;
    opacity?: number;
    rotation?: number;
    fontFamily?: string;
  } = {},
): fabric.Pattern {
  const { fontSize = 24, color = "#000000", opacity = 0.2, rotation = -30, fontFamily = "Inter" } = options;
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
  return new fabric.Pattern({ source: c, repeat: "repeat" });
}

export function applyTiledWatermark(
  canvas: fabric.Canvas,
  text: string,
  options: Parameters<typeof buildTiledPattern>[1] = {},
): void {
  const existing = canvas
    .getObjects()
    .find((o) => (o as fabric.Object & { __isTiledWatermark?: boolean }).__isTiledWatermark);
  if (existing) canvas.remove(existing);
  if (!text.trim()) {
    canvas.requestRenderAll();
    return;
  }
  const pattern = buildTiledPattern(text, options);
  const rect = new fabric.Rect({
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    fill: pattern,
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
  (rect as fabric.Object & { __isTiledWatermark?: boolean }).__isTiledWatermark = true;
  canvas.add(rect);
  canvas.sendObjectToBack(rect);
  canvas.requestRenderAll();
}

export function clearTiledWatermark(canvas: fabric.Canvas): void {
  const existing = canvas
    .getObjects()
    .find((o) => (o as fabric.Object & { __isTiledWatermark?: boolean }).__isTiledWatermark);
  if (existing) {
    canvas.remove(existing);
    canvas.requestRenderAll();
  }
}
