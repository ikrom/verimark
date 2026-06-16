export type Detected =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/bmp"
  | "image/tiff"
  | "image/heic"
  | "image/heif"
  | "application/pdf"
  | "unknown";

export interface ValidationResult {
  ok: boolean;
  detected: Detected;
  reason?: string;
}

export const MAX_FILE = 100 * 1024 * 1024;
export const MAX_BATCH = 500 * 1024 * 1024;

const RULES: Array<{ sig: number[]; mask: number[]; type: Detected }> = [
  { sig: [0xff, 0xd8, 0xff], mask: [1, 1, 1], type: "image/jpeg" },
  { sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mask: [1, 1, 1, 1, 1, 1, 1, 1], type: "image/png" },
  { sig: [0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50], mask: [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1], type: "image/webp" },
  { sig: [0x47, 0x49, 0x46, 0x38], mask: [1, 1, 1, 1], type: "image/gif" },
  { sig: [0x42, 0x4d], mask: [1, 1], type: "image/bmp" },
  { sig: [0x49, 0x49, 0x2a, 0x00], mask: [1, 1, 1, 1], type: "image/tiff" },
  { sig: [0x4d, 0x4d, 0x00, 0x2a], mask: [1, 1, 1, 1], type: "image/tiff" },
  { sig: [0x25, 0x50, 0x44, 0x46, 0x2d], mask: [1, 1, 1, 1, 1], type: "application/pdf" },
  { sig: [-1, -1, -1, -1, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], mask: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], type: "image/heic" },
  { sig: [-1, -1, -1, -1, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x66], mask: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], type: "image/heif" },
  { sig: [-1, -1, -1, -1, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31], mask: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], type: "image/heif" },
];

function matchSig(head: Uint8Array, sig: number[], mask: number[]): boolean {
  if (head.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (mask[i] === 1 && head[i] !== sig[i]) return false;
  }
  return true;
}

export async function detectType(file: File): Promise<Detected> {
  const slice = file.slice(0, 16);
  const buf = new Uint8Array(await slice.arrayBuffer());
  for (const r of RULES) {
    if (matchSig(buf, r.sig, r.mask)) return r.type;
  }
  return "unknown";
}

export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const clean = base.replace(/[\x00-\x1f\x7f<>:"|?*]/g, "_").slice(0, 120);
  return clean || "file";
}

export async function validateFile(
  file: File,
  batchUsed: number,
): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, detected: "unknown", reason: "Empty file" };
  if (file.size > MAX_FILE) {
    return { ok: false, detected: "unknown", reason: `Exceeds 100MB (${(file.size / 1048576).toFixed(1)}MB)` };
  }
  if (batchUsed + file.size > MAX_BATCH) {
    return { ok: false, detected: "unknown", reason: "Batch cap 500MB exceeded" };
  }
  const detected = await detectType(file);
  if (detected === "unknown") {
    return { ok: false, detected, reason: "Unrecognized file format" };
  }
  if (
    file.type &&
    file.type !== "" &&
    file.type !== detected &&
    file.type !== "image/heic" &&
    file.type !== "image/heif"
  ) {
    return { ok: false, detected, reason: `MIME mismatch: declared ${file.type}, detected ${detected}` };
  }
  return { ok: true, detected };
}
