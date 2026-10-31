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
/**
 * Whether the request probably comes from a phone: the `Sec-CH-UA-Mobile`
 * client hint where the browser sends it, otherwise the user agent. Only a
 * layout hint for the first render; the media query has the final say.
 */
export async function isLikelyMobileRequest(): Promise<boolean> {
  return likelyMobileFromHeaders(await headers());
}

export function likelyMobileFromHeaders(h: Headers): boolean {
  const agent = h.get("user-agent") ?? "";
  // iPads say "Mobile/" in their user agent but get the desktop layout.
  if (/iPad/i.test(agent)) return false;
  const hint = h.get("sec-ch-ua-mobile");
  if (hint) return hint === "?1";
  return /Mobi|iPhone|iPod/i.test(agent);
}

export function clientIpFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}
