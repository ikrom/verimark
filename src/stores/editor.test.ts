import { describe, it, expect, beforeEach } from "vitest";
import { useEditor, DEFAULT_CONFIG } from "./editor";

describe("editor store", () => {
  beforeEach(() => {
    useEditor.setState({ file: null, hash: "", config: DEFAULT_CONFIG });
  });

  it("initial state has no file and empty hash", () => {
    const s = useEditor.getState();
    expect(s.file).toBeNull();
    expect(s.hash).toBe("");
  });

  it("initial config matches DEFAULT_CONFIG", () => {
    expect(useEditor.getState().config).toEqual(DEFAULT_CONFIG);
  });

  it("setFile updates file", () => {
    const f = new File(["x"], "x.png", { type: "image/png" });
    useEditor.getState().setFile(f);
    expect(useEditor.getState().file).toBe(f);
  });

  it("setHash updates hash", () => {
    useEditor.getState().setHash("deadbeef");
    expect(useEditor.getState().hash).toBe("deadbeef");
  });

  it("updateConfig merges patch into config", () => {
    useEditor.getState().updateConfig({ fontSize: 99, color: "#fff" });
    const cfg = useEditor.getState().config;
    expect(cfg.fontSize).toBe(99);
    expect(cfg.color).toBe("#fff");
    expect(cfg.mode).toBe(DEFAULT_CONFIG.mode);
    expect(cfg.position).toBe(DEFAULT_CONFIG.position);
  });

  it("updateConfig can switch mode", () => {
    useEditor.getState().updateConfig({ mode: "tiled" });
    expect(useEditor.getState().config.mode).toBe("tiled");
  });

  it("resetConfig restores DEFAULT_CONFIG", () => {
    useEditor.getState().updateConfig({ fontSize: 99, mode: "tiled" });
    useEditor.getState().resetConfig();
    expect(useEditor.getState().config).toEqual(DEFAULT_CONFIG);
  });
});

describe("editor store v1 flags", () => {
  it("DEFAULT_CONFIG has includeQR true and v1 flags false", () => {
    expect(DEFAULT_CONFIG.includeQR).toBe(true);
    expect(DEFAULT_CONFIG.faceBlur).toBe(false);
    expect(DEFAULT_CONFIG.ocrRedact).toBe(false);
  });

  it("can update includeQR independently of includeHash", () => {
    useEditor.getState().updateConfig({ includeQR: false });
    const cfg = useEditor.getState().config;
    expect(cfg.includeQR).toBe(false);
    expect(cfg.includeHash).toBe(DEFAULT_CONFIG.includeHash);
  });
});
