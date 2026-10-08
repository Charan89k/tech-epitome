import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client IP, used to key rate limits.
 *
 * Proxy headers are client-controlled unless a trusted proxy overwrites them.
 * On Vercel, `x-forwarded-for` is set by the platform and is trustworthy; on
 * a self-hosted deployment behind an untrusted proxy it is not. Rate limiting
 * is therefore defence in depth, never the only control - the real controls
 * are the password hash cost and the auth checks themselves.
 */
export async function getClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

/**
 * The same derivation for code that holds a `Request` rather than running
 * inside a render — the credentials `authorize` callback, which Auth.js
 * reaches both from the sign-in action and from its own route handler.
 */
export function clientIpFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}
