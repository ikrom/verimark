export function exportCanvas(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg",
  filename: string,
  quality = 0.95,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const mime = format === "png" ? "image/png" : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Export failed: canvas produced no blob"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      mime,
      quality,
    );
  });
}
