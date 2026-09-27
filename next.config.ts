import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * No Content-Security-Policy here on purpose: a static CSP would have to
 * allow 'unsafe-inline' for Next's bootstrap scripts, which makes it
 * decorative. CSP is issued per-request with a nonce from `proxy.ts`.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `unauthorized()` and `forbidden()` return real 401/403 responses and
  // render unauthorized.tsx / forbidden.tsx. Still flagged experimental in
  // 16.x; see README "Known limitations".
  experimental: {
    authInterrupts: true,
  },

  // The argon2 addon is a native module and must not be bundled.
  serverExternalPackages: ["@node-rs/argon2"],

  typedRoutes: true,

  // Playwright drives the dev server over 127.0.0.1 while Next serves it as
  // localhost; without this, HMR requests are rejected as cross-origin.
  allowedDevOrigins: ["127.0.0.1"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // `/pricing` shipped in an earlier iteration. CodeForge is free, so the
  // route is gone — but a dead link is a worse answer than a page that says
  // there is nothing to pay, so it lands on the features page instead.
  async redirects() {
    return [{ source: "/pricing", destination: "/features", permanent: true }];
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The dashboard and everything behind auth must never be indexed.
      {
        source:
          "/:path(dashboard|settings|profile|admin|interview|review|ai-tutor)/:rest*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
