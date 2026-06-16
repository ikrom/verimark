import { useEffect } from "react";
import { sha256Hex, shortHash } from "~/lib/crypto";
import { useEditor } from "~/stores/editor";

export function useProvenance(): { hash: string; short: string } {
  const file = useEditor((s) => s.file);
  const setHash = useEditor((s) => s.setHash);
  useEffect(() => {
    if (!file) {
      setHash("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const buf = await file.arrayBuffer();
        const hash = await sha256Hex(buf);
        if (!cancelled) setHash(hash);
      } catch {
        if (!cancelled) setHash("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, setHash]);
  const hash = useEditor((s) => s.hash);
  return { hash, short: shortHash(hash) };
}
