export async function sha256Hex(data: ArrayBuffer | Uint8Array | Blob): Promise<string> {
  const buf = data instanceof Blob ? await data.arrayBuffer() : data;
  const hash = await crypto.subtle.digest("SHA-256", buf as BufferSource);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function shortHash(hex: string, len = 7): string {
  return hex.slice(0, len);
}
