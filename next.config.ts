import type { NextConfig } from "next";

// Read once so a missing value fails visibly at startup rather than silently
// producing a `undefined/...` destination.
const BACKEND_URL = process.env.BACKEND_URL;

// Safety headers on every page — added 2026-10-26 after the live check found
// none. Framing is allowed for this site only ('self'), so no other site can
// show the sign-in page inside its own and trick people into typing there.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Don't announce "Next.js" in every answer.
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    // Required for the `forbidden()` / `unauthorized()` interrupts and their
    // matching `forbidden.tsx` / `unauthorized.tsx` conventions. Still flagged
    // experimental as of 16.2 — drop these three files if you'd rather not
    // depend on it.
    authInterrupts: true,
  },
  redirects() {
    return [
      // Every screen lives in its own folder, so sign-in is `/login`. There is
      // no public landing page, so `/` just forwards there.
      { source: "/", destination: "/login", permanent: false },
    ];
  },
  rewrites() {
    if (!BACKEND_URL) {
      console.warn(
        "[next.config] BACKEND_URL is not set — /api/* will 404. Copy .env.example to .env.local."
      );
      return [];
    }

    // Same-origin proxy: the browser only ever calls `/api/...` on this app's
    // own domain, and Next forwards it to the VPS server-side. Keeps the
    // backend address out of the browser, avoids CORS entirely, and means the
    // request reaches the backend from this server's IP — which is the one on
    // its allowlist.
    //
    // Returning a plain array behaves as `afterFiles`, so any Route Handler you
    // later add under `app/api/...` takes precedence over the proxy.
    //
    // `/api` has to be repeated in the destination. Only the named parameter is
    // substituted — a literal prefix in `source` is not carried over, so
    // `${BACKEND_URL}/:path*` would send /api/auth/login to /auth/login and 404.
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
