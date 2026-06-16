# Verimark

Add a verifiable watermark to your confidential files. 100% client-side. SHA-256 provenance.

- 🔒 100% client-side — your file never leaves your device
- 🔐 Verifiable provenance — SHA-256 hash + QR code embedded in the watermark
- 🛡️ Magic-byte validation + EXIF stripping
- ✨ Tiled or single watermark modes
- 🌗 Dark/light, keyboard-friendly, accessible
- 🌍 Subdomain: https://verimark.thetas.dev

## Stack

Astro 5 · React 19 · Tailwind 4 · Fabric.js 7 · Zustand 5 · bun

## Development

```sh
bun install
bun run dev      # http://localhost:4321
bun run build
bun run check
bun run lint
bun run format
```

## Deploy

Hosted on Vercel as a static site.

1. Create new Vercel project pointing at the repo.
2. Build command: `bun run build`.
3. Output directory: `dist`.
4. Add custom domain `verimark.thetas.dev` (CNAME to `cname.vercel-dns.com`).

## Architecture

- `src/pages/` — Astro routes (static, prerendered)
- `src/components/tool/` — React 19 island (`client:only="react"`)
- `src/lib/` — pure utilities (validate, crypto, qr, export, presets)
- `src/stores/` — Zustand state
- `public/` — static assets

All processing happens in the browser. The server is a static CDN.

## Security

- Strict CSP via `vercel.json` (no `unsafe-eval`, no third-party origins)
- Magic-byte validation rejects mismatched MIME / disguised executables
- Canvas re-encode strips EXIF metadata
- Network monitor (live "0 bytes uploaded" indicator) patches `fetch` + `XMLHttpRequest` to verify no outbound traffic
- SHA-256 provenance allows recipient to verify the file matches the watermarked original

## License

MIT
