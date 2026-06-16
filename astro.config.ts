import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

// Default adapter: Vercel (for production deploy).
// For local `astro preview` / `astro dev` (incl. Playwright), set
// `ASTRO_ADAPTER=node` to swap in the Node adapter.
const adapter =
  process.env.ASTRO_ADAPTER === "node"
    ? node({ mode: "standalone" })
    : vercel();

export default defineConfig({
  site: "https://verimark.thetas.dev",
  output: "server",
  integrations: [
    react(),
    sitemap({
      // SSR routes are dynamic; explicitly list the public pages.
      customPages: [
        "https://verimark.thetas.dev/",
        "https://verimark.thetas.dev/verify",
        "https://verimark.thetas.dev/privacy",
        "https://verimark.thetas.dev/terms",
      ],
    }),
  ],
  adapter,
  vite: {
    plugins: [tailwindcss() as any],
  },
});
