import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

/**
 * Edge proxy (what earlier Next.js versions called middleware).
 *
 * Two jobs, both cheap:
 *   1. An *optimistic* auth redirect, so a signed-out user hitting
 *      /dashboard goes to /login without paying for a server render.
 *   2. A per-request Content-Security-Policy nonce.
 *
 * This is not the authorization boundary. It reads a cookie, and a cookie
 * can be stale or forged - so every protected page and server action
 * re-checks through `requireUser`. The proxy is UX; `requireUser` is
 * security.
 */

const { auth } = NextAuth(authConfig);

/** Paths that require a session. Prefix-matched. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/profile",
  "/review",
  // "/interviews", plural. It was "/interview" here, which prefix-matches
  // nothing: the route is /interviews, so the list got no optimistic
  // redirect. Never a hole — `requireUser` covers it server-side — but it
  // meant a signed-out visitor paid for a render before being bounced.
  "/interviews",
  "/onboarding",
  "/ai-tutor",
  "/admin",
];

/** Paths a signed-in user should be bounced away from. */
const AUTH_PAGES = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(request.auth);

  if (!signedIn && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return withCsp(request);
});

/**
 * Content-Security-Policy with a per-request nonce.
 *
 * The CSP must be set on the *request* headers as well as the response:
 * that is how Next discovers the nonce and stamps it onto the script tags
 * it emits. Setting it only on the response blocks Next's own bootstrap
 * script, and the page never hydrates - every button on the site silently
 * stops working while the HTML still looks correct.
 *
 * `strict-dynamic` lets the nonced bootstrap load the rest of the bundle
 * without enumerating every chunk hash.
 *
 * Skipped entirely in development: Turbopack's HMR client uses inline
 * scripts and eval, so a dev CSP would have to be loosened to the point of
 * proving nothing, while breaking fast refresh. CSP is a production control
 * and is verified against a production build.
 */
function withCsp(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/trace/")) return traceWorkerResponse();

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const nonce = crypto.randomUUID().replaceAll("-", "");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    // Next inlines critical CSS, and Radix writes inline styles for
    // positioning; neither can be nonced.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    // Monaco's language workers run from a blob URL.
    `worker-src 'self' blob:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** Where the trace workers fetch Pyodide from. Pinned in python-worker.js. */
const TRACE_RUNTIME_ORIGIN = "https://cdn.jsdelivr.net";

/**
 * The policy for the live-trace workers in /public/trace.
 *
 * A dedicated worker is governed by the CSP delivered with its own script,
 * not the page's, so these files can be granted what the page never is:
 * eval, to run the learner's JavaScript, and WebAssembly, to run Python.
 * In exchange they get almost no network. connect-src names only the
 * runtime CDN, so code typed into the editor cannot reach this site's API
 * carrying the learner's session cookie. Issued in development too: workers
 * do not take part in hot reload, so there is nothing to loosen it for.
 */
function traceWorkerResponse(): NextResponse {
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    [
      `default-src 'none'`,
      `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' ${TRACE_RUNTIME_ORIGIN}`,
      `connect-src ${TRACE_RUNTIME_ORIGIN}`,
    ].join("; ")
  );
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation, which need
     * neither an auth check nor a CSP and are requested constantly.
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
