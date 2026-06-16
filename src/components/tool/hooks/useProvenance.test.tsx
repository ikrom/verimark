import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProvenance } from "./useProvenance";
import { useEditor } from "~/stores/editor";
import { sha256Hex } from "~/lib/crypto";

describe("useProvenance", () => {
  beforeEach(() => {
    useEditor.setState({ file: null, hash: "" });
  });

  it("computes SHA-256 of file and sets store", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new File([bytes], "x.bin", { type: "application/octet-stream" });
    useEditor.setState({ file, hash: "" });
    const expected = await sha256Hex(bytes);
    renderHook(() => useProvenance());
    await waitFor(() => expect(useEditor.getState().hash).toBe(expected));
  });

  it("clears hash when file is null", async () => {
    useEditor.setState({ file: null, hash: "previous-hash-value" });
    const { result } = renderHook(() => useProvenance());
    await waitFor(() => expect(useEditor.getState().hash).toBe(""));
    expect(result.current.hash).toBe("");
  });

  it("returns short hash from store", async () => {
    const file = new File([new Uint8Array([0xde, 0xad, 0xbe, 0xef])], "x.bin");
    useEditor.setState({ file, hash: "" });
    const { result } = renderHook(() => useProvenance());
    await waitFor(() => expect(result.current.short.length).toBe(7));
  });
});
