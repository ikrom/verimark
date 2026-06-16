import { useEffect, useState } from "react";

let bytesOut = 0;
const listeners = new Set<(n: number) => void>();
let initialized = false;

function notify(): void {
  for (const l of listeners) l(bytesOut);
}

function estimateSize(body: unknown): number {
  if (!body) return 0;
  if (typeof body === "string") return new Blob([body]).size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (body instanceof Blob) return body.size;
  if (body instanceof FormData) return 0;
  if (body instanceof URLSearchParams) return body.toString().length;
  if (Array.isArray(body)) {
    return body.reduce((sum, item) => sum + estimateSize(item), 0);
  }
  return 0;
}

function init(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const size = estimateSize(args[1]?.body);
    if (size > 0) {
      bytesOut += size;
      notify();
    }
    return origFetch(...args);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const size = estimateSize(body);
    if (size > 0) {
      bytesOut += size;
      notify();
    }
    return origSend.call(this, body);
  };
}

export function useNetworkMonitor(): number {
  const [bytes, setBytes] = useState(0);
  useEffect(() => {
    init();
    const fn = (n: number) => setBytes(n);
    listeners.add(fn);
    setBytes(bytesOut);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return bytes;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
