# Verimark

Add a verifiable watermark to your confidential files. 100% client-side. SHA-256 provenance.

- 🔒 100% client-side — your file never leaves your device
- 🔐 Verifiable provenance — SHA-256 hash + QR code embedded in the watermark
- 🛡️ Magic-byte validation + EXIF stripping
- ✨ Tiled or single watermark modes
- 🌗 Dark/light, keyboard-friendly, accessible
- 🛠️ Optional QR code toggle (v1: face blur, OCR redaction — UI placeholders)

## Stack

Astro 5 · React 19 · Tailwind 4 · Fabric.js 7 · Zustand 5 · bun

## Features (MVP)

- 🔒 100% client-side — your file never leaves your device
- 🔐 Verifiable provenance — SHA-256 hash + QR code embedded in the watermark
- 🛡️ Magic-byte validation + EXIF stripping
- ✨ Tiled or single watermark modes
- 🌗 Dark/light, keyboard-friendly, accessible
- 🛠️ Optional QR code toggle (v1: face blur, OCR redaction — UI placeholders)

## Development

```sh
bun install
bun run dev      # http://localhost:4321
bun run build
bun run check
bun run lint
bun run format
bun run test       # unit + integration
bun run test:e2e   # Playwright
```

## Deploy (Vercel)

1. Push to GitHub (see "Push to GitHub" below)
2. **vercel.com/new** → Import the repo
3. Framework: **Other**
4. Build command: `bun run build`
5. Output dir: `dist`
6. Install command: `bun install`
7. Environment variable: `BUN_VERSION=1.3.14`
8. Deploy
9. Settings → Domains → add `verimark.thetas.dev`
10. DNS at registrar: `CNAME verimark → cname.vercel-dns.com`

### DNS record

| Type  | Name     | Value                  |
|-------|----------|------------------------|
| CNAME | verimark | cname.vercel-dns.com.  |

## Push to GitHub

```sh
cd /Users/940126/projects/verimark
git init
git add -A
git commit -m "MVP v0.1.0-alpha: Verimark with full test suite"
gh repo create verimark --public --source=. \
  --description "Verifiable watermarks for confidential files. 100% client-side. SHA-256 provenance. MIT."
git push -u origin main
git tag 0.1.0-alpha
git push --tags
```

## Architecture

- `src/pages/` — Astro routes (static, prerendered)
- `src/components/tool/` — React 19 island (`client:only="react"`)
- `src/lib/` — pure utilities (validate, crypto, qr, export, presets)
- `src/stores/` — Zustand state
- `public/` — static assets

All processing happens in the browser. The server is a static CDN.

## Privacy

- Strict CSP via `vercel.json` + `src/middleware.ts` (no `unsafe-eval`, no third-party origins except Google Fonts)
- Magic-byte validation rejects mismatched MIME / disguised executables
- Canvas re-encode strips EXIF metadata
- Network monitor (live "0 bytes uploaded" indicator) patches `fetch` + `XMLHttpRequest` to verify no outbound traffic
- SHA-256 provenance allows recipient to verify the file matches the watermarked original
- Open source, auditable on GitHub

## License

MIT
