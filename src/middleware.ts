import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // Astro 5 hydration emits inline <script> tags whose hashes change per build.
  // We allow 'unsafe-inline' in script-src to match the runtime needs; the
  // equivalent vercel.json header in production should be kept in lock-step.
  // style-src keeps 'unsafe-inline' for Tailwind/inline-style compat.
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  );
  return response;
});
