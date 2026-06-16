import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import * as fabric from "fabric";
import { useEditor, type WatermarkConfig } from "~/stores/editor";
import { applyTiledWatermark, clearTiledWatermark } from "~/lib/tiledWatermark";
import { exportCanvas } from "~/lib/export";
import { toDataURL } from "~/lib/qr";
import { PRESETS, buildWatermarkText } from "~/lib/presets";
import { validateFile, sanitizeFilename, type Detected } from "~/lib/validate";
import { shortHash } from "~/lib/crypto";
import { formatBytes } from "./hooks/useNetworkMonitor";
import { useProvenance } from "./hooks/useProvenance";
import { PrivacyMeter } from "./PrivacyMeter";

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
];

const POSITIONS: Array<{ value: WatermarkConfig["position"]; label: string }> =
  [
    { value: "top-left", label: "Top left" },
    { value: "top", label: "Top" },
    { value: "top-right", label: "Top right" },
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "bottom", label: "Bottom" },
    { value: "bottom-right", label: "Bottom right" },
  ];

function getPositionCoords(
  pos: string,
  w: number,
  h: number,
  textW: number,
  textH: number,
): { left: number; top: number } {
  const m = 20;
  switch (pos) {
    case "top-left":
      return { left: m, top: m };
    case "top":
      return { left: (w - textW) / 2, top: m };
    case "top-right":
      return { left: w - textW - m, top: m };
    case "left":
      return { left: m, top: (h - textH) / 2 };
    case "center":
      return { left: (w - textW) / 2, top: (h - textH) / 2 };
    case "right":
      return { left: w - textW - m, top: (h - textH) / 2 };
    case "bottom-left":
      return { left: m, top: h - textH - m };
    case "bottom":
      return { left: (w - textW) / 2, top: h - textH - m };
    case "bottom-right":
      return { left: w - textW - m, top: h - textH - m };
    default:
      return { left: (w - textW) / 2, top: (h - textH) / 2 };
  }
}

export function Editor() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const textObjRef = useRef<fabric.Textbox | null>(null);
  const qrImgRef = useRef<fabric.FabricImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<Detected>("unknown");
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
  const [presetId, setPresetId] = useState("blank");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wrapperSize, setWrapperSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [canvasVersion, setCanvasVersion] = useState(0);

  const file = useEditor((s) => s.file);
  const hash = useEditor((s) => s.hash);
  const config = useEditor((s) => s.config);
  const setFile = useEditor((s) => s.setFile);
  const setHash = useEditor((s) => s.setHash);
  const updateConfig = useEditor((s) => s.updateConfig);
  const resetConfig = useEditor((s) => s.resetConfig);

  useProvenance();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setWrapperSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // Re-run when file changes: the wrapper is conditionally mounted,
    // so we need the ref to be re-read after the file-driven mount.
  }, [file]);

  // Init fabric + load image. Use naturalWidth/Height from underlying HTMLImageElement
  useEffect(() => {
    if (
      !file ||
      !canvasElRef.current ||
      wrapperSize.w === 0 ||
      wrapperSize.h === 0
    )
      return;
    const canvasEl = canvasElRef.current;
    const url = URL.createObjectURL(file);
    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      try {
        const img = await fabric.FabricImage.fromURL(url);
        if (cancelled) return;
        // Use underlying image element for true natural dimensions
        const el = img.getElement() as HTMLImageElement;
        const iw = el?.naturalWidth || img.width || 1;
        const ih = el?.naturalHeight || img.height || 1;
        // Fixed 4:3 canvas aspect (predictable, matches watermarkktp pattern)
        const padding = 16;
        const maxW = Math.max(200, wrapperSize.w - padding);
        const maxH = Math.max(200, wrapperSize.h - padding);
        const ASPECT = 4 / 3;
        let cw = maxW;
        let ch = cw / ASPECT;
        if (ch > maxH) {
          ch = maxH;
          cw = ch * ASPECT;
        }
        cw = Math.max(200, Math.floor(cw));
        ch = Math.max(200, Math.floor(ch));
        if (fabricRef.current) {
          fabricRef.current.dispose();
        }
        const c = new fabric.Canvas(canvasEl, {
          width: cw,
          height: ch,
          backgroundColor: "#ffffff",
        });
        fabricRef.current = c;
        const fit = Math.min(cw / iw, ch / ih);
        img.set({
          scaleX: fit,
          scaleY: fit,
          selectable: false,
          evented: false,
        });
        c.add(img);
        c.centerObject(img);
        c.requestRenderAll();
        setCanvasVersion((v) => v + 1);
      } catch {
        if (!cancelled) setError("Failed to load image");
      } finally {
        URL.revokeObjectURL(url);
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, wrapperSize.w, wrapperSize.h]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const presetPurpose = PRESETS.find((p) => p.id === presetId)?.purpose ?? "";
    const fullText = buildWatermarkText(
      presetId === "blank" ? config.text : presetPurpose,
      config.includeDate,
      config.includeHash ? shortHash(hash) : "",
    );

    if (textObjRef.current) {
      canvas.remove(textObjRef.current);
      textObjRef.current = null;
    }
    if (qrImgRef.current) {
      canvas.remove(qrImgRef.current);
      qrImgRef.current = null;
    }

    if (config.mode === "tiled") {
      if (fullText.trim()) {
        applyTiledWatermark(canvas, fullText, {
          fontSize: config.fontSize,
          color: config.color,
          opacity: config.opacity,
          rotation: config.rotation,
        });
      } else {
        clearTiledWatermark(canvas);
      }
      canvas.requestRenderAll();
      return;
    }

    clearTiledWatermark(canvas);

    if (!fullText.trim()) {
      canvas.requestRenderAll();
      return;
    }

    const tb = new fabric.Textbox(fullText, {
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      fill: config.color,
      opacity: config.opacity,
      angle: config.rotation,
      textAlign: "center",
      originX: "left",
      originY: "top",
    });
    const tbW = tb.width ?? 200;
    const tbH = tb.height ?? 60;
    const coords = getPositionCoords(config.position, cw, ch, tbW, tbH);
    tb.set(coords);
    canvas.add(tb);
    textObjRef.current = tb;
    canvas.setActiveObject(tb);

    if (hash && config.includeQR && typeof window !== "undefined") {
      const verifyUrl = `${window.location.origin}/verify?h=${hash}&t=${encodeURIComponent(new Date().toISOString())}`;
      void (async () => {
        try {
          const dataUrl = await toDataURL(verifyUrl, 80);
          const qrImg = await fabric.FabricImage.fromURL(dataUrl);
          const size = Math.min(60, Math.floor(Math.min(cw, ch) * 0.15));
          qrImg.set({
            left: cw - size - 12,
            top: ch - size - 12,
            selectable: true,
          });
          const c = fabricRef.current;
          if (c) {
            c.add(qrImg);
            qrImgRef.current = qrImg;
            c.requestRenderAll();
          }
        } catch {
          // non-fatal
        }
      })();
    }

    canvas.requestRenderAll();
  }, [config, hash, presetId, canvasVersion]);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      const f = files[0];
      const r = await validateFile(f, 0);
      if (!r.ok) {
        setError(r.reason ?? "Invalid file");
        return;
      }
      if (r.detected === "application/pdf") {
        setError("PDF support coming in v1. Drop an image for now.");
        return;
      }
      setDetectedType(r.detected);
      const clean = sanitizeFilename(f.name);
      const safeFile = new File([f], clean, { type: r.detected });
      setIsLoading(true);
      setFile(safeFile);
    },
    [setFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      void onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onExport = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || !file) return;
    setIsExporting(true);
    setError(null);
    try {
      const ext = exportFormat === "png" ? "png" : "jpg";
      const baseName = file.name.replace(/\.[^.]+$/, "");
      await exportCanvas(
        canvas.getElement(),
        exportFormat,
        `${baseName}-verimarked.${ext}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [file, exportFormat]);

  const onResetFile = useCallback(() => {
    setFile(null);
    setHash("");
    setDetectedType("unknown");
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
  }, [setFile, setHash]);

  if (!file) {
    return (
      <div className="flex flex-col h-full">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="flex-1 flex items-center justify-center p-6"
        >
          <div className="w-full max-w-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-12 rounded-full bg-accent-50 dark:bg-accent-100/10 flex items-center justify-center text-accent-600">
                <svg
                  className="size-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Drop your file here</h2>
              <p className="text-sm text-zinc-500 max-w-sm">
                Or pick a file. JPEG, PNG, WebP, GIF, BMP, TIFF. 100%
                client-side — your file never leaves your device.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white px-5 py-2.5 font-medium transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    void onFiles(e.target.files)
                  }
                />
                Choose file
              </label>
              {error && (
                <p className="text-sm text-rose-600 mt-2" role="alert">
                  {error}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-4">
                Magic-byte validation · 100MB cap · EXIF stripped on export
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 px-4 pb-2">
          <PrivacyMeter />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 p-3 overflow-hidden">
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
            <span className="truncate" title={file.name}>
              {file.name} · {formatBytes(file.size)} · {detectedType}
              {hash && (
                <span className="ml-2 font-mono">
                  SHA-256: {shortHash(hash, 12)}…
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={onResetFile}
              className="text-rose-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <div
            ref={wrapperRef}
            className="flex-1 relative flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-2 min-h-0"
          >
            <canvas
              ref={canvasElRef}
              className="max-w-full max-h-full"
              style={{ display: "block" }}
            />
            {isLoading && (
              <div
                data-testid="loading-overlay"
                className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 z-10"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="size-6 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-500">Loading image…</p>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0">
            <PrivacyMeter />
          </div>
        </div>

        <aside
          data-testid="sidebar"
          className="overflow-hidden flex flex-col gap-1.5 pr-0.5"
        >
          <Section title="Text">
            <select
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
              data-testid="preset-select"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <textarea
              value={config.text}
              onChange={(e) => updateConfig({ text: e.target.value })}
              rows={1}
              placeholder="Verifikasi, 10-10-2026"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs resize-none"
            />
            <div className="flex flex-col gap-0.5 text-[10px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeDate}
                  onChange={(e) =>
                    updateConfig({ includeDate: e.target.checked })
                  }
                  className="size-3"
                />
                Include today's date
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeHash}
                  onChange={(e) =>
                    updateConfig({ includeHash: e.target.checked })
                  }
                  className="size-3"
                />
                Include file hash (verifiable)
              </label>
            </div>
          </Section>

          <Section title="Layout">
            <div className="grid grid-cols-2 gap-1">
              {(["single", "tiled"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateConfig({ mode: m })}
                  data-testid={`mode-${m}`}
                  className={`px-2 py-1 rounded text-[11px] border ${
                    config.mode === m
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-100/10 text-accent-700 dark:text-accent-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {m === "single" ? "Single" : "Tiled"}
                </button>
              ))}
            </div>
            {config.mode === "single" && (
              <select
                value={config.position}
                onChange={(e) =>
                  updateConfig({
                    position: e.target.value as WatermarkConfig["position"],
                  })
                }
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
          </Section>

          <Section title="Style">
            <select
              value={config.fontFamily}
              onChange={(e) => updateConfig({ fontFamily: e.target.value })}
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={8}
                max={120}
                value={config.fontSize}
                onChange={(e) =>
                  updateConfig({ fontSize: Number(e.target.value) })
                }
                className="flex-1 h-1"
              />
              <span className="text-[10px] text-zinc-500 font-mono w-8 text-right">
                {config.fontSize}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
                className="size-6 rounded border border-zinc-300 dark:border-zinc-700 shrink-0"
              />
              <input
                type="text"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
                className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono min-w-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-500">
                  Op {Math.round(config.opacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.opacity}
                  onChange={(e) =>
                    updateConfig({ opacity: Number(e.target.value) })
                  }
                  className="h-1"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-500">
                  Rot {config.rotation}°
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={config.rotation}
                  onChange={(e) =>
                    updateConfig({ rotation: Number(e.target.value) })
                  }
                  className="h-1"
                />
              </label>
            </div>
            <div
              className="border-t border-zinc-200 dark:border-zinc-800 pt-1.5 space-y-0.5 text-[10px]"
              data-testid="toggles"
            >
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeQR}
                  onChange={(e) =>
                    updateConfig({ includeQR: e.target.checked })
                  }
                  data-testid="toggle-qr"
                  className="size-3"
                />
                Show QR verify code
              </label>
              <label
                className="flex items-center gap-1.5 cursor-not-allowed opacity-50"
                title="Coming in v1"
              >
                <input
                  type="checkbox"
                  checked={config.faceBlur}
                  disabled
                  onChange={(e) => updateConfig({ faceBlur: e.target.checked })}
                  data-testid="toggle-faceblur"
                  className="size-3"
                />
                Blur faces <span className="text-zinc-400">(v1)</span>
              </label>
              <label
                className="flex items-center gap-1.5 cursor-not-allowed opacity-50"
                title="Coming in v1"
              >
                <input
                  type="checkbox"
                  checked={config.ocrRedact}
                  disabled
                  onChange={(e) =>
                    updateConfig({ ocrRedact: e.target.checked })
                  }
                  data-testid="toggle-ocr"
                  className="size-3"
                />
                OCR redaction <span className="text-zinc-400">(v1)</span>
              </label>
            </div>
          </Section>

          <Section title="Export" className="mt-auto">
            <div className="grid grid-cols-2 gap-1">
              {(["png", "jpeg"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setExportFormat(f)}
                  className={`px-2 py-1 rounded text-[11px] border uppercase ${
                    exportFormat === f
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-100/10 text-accent-700 dark:text-accent-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {f === "png" ? "PNG" : "JPG"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void onExport()}
              disabled={isExporting}
              data-testid="download-btn"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-medium transition"
            >
              {isExporting ? "Exporting…" : "Download"}
            </button>
            <button
              type="button"
              onClick={resetConfig}
              className="w-full text-[10px] text-zinc-500 hover:text-zinc-700 underline"
            >
              Reset watermark settings
            </button>
            {error && (
              <p className="text-[10px] text-rose-600" role="alert">
                {error}
              </p>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  testId,
  className,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testId ?? `section-${title.toLowerCase()}`}
      className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 space-y-1.5${className ? ` ${className}` : ""}`}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}
