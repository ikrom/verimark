import { create } from "zustand";

export interface WatermarkConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  rotation: number;
  opacity: number;
  mode: "single" | "tiled";
  position:
    | "center"
    | "top-left"
    | "top"
    | "top-right"
    | "left"
    | "right"
    | "bottom-left"
    | "bottom"
    | "bottom-right";
  includeDate: boolean;
  includeHash: boolean; // text hash (manual)
  includeQR: boolean; // QR code in corner
  faceBlur: boolean; // v1 placeholder
  ocrRedact: boolean; // v1 placeholder
}

export const DEFAULT_CONFIG: WatermarkConfig = {
  text: "",
  fontFamily: "Inter",
  fontSize: 36,
  color: "#000000",
  rotation: 0,
  opacity: 0.5,
  mode: "single",
  position: "center",
  includeDate: true,
  includeHash: true,
  includeQR: true,
  faceBlur: false,
  ocrRedact: false,
};

interface EditorState {
  file: File | null;
  hash: string;
  config: WatermarkConfig;
  setFile: (f: File | null) => void;
  setHash: (h: string) => void;
  updateConfig: (patch: Partial<WatermarkConfig>) => void;
  resetConfig: () => void;
}

export const useEditor = create<EditorState>((set) => ({
  file: null,
  hash: "",
  config: DEFAULT_CONFIG,
  setFile: (f) => set({ file: f }),
  setHash: (h) => set({ hash: h }),
  updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  resetConfig: () => set({ config: DEFAULT_CONFIG }),
}));
