import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/safe-redirect";

/**
 * Regression tests for the `?next=` open redirect.
 *
 * The original check was `startsWith("/") && !startsWith("//")`, which let
 * `/\evil.example.com` through. A backslash is not an escape hatch peculiar to
 * one parser: WHATWG specifies that in a special scheme a backslash is treated
 * as a slash, and that tab, newline and carriage return are stripped from a URL
 * before parsing. So three separate payloads all collapse to `//host`.
 *
 * These tests assert the property that actually matters — the resolved origin
 * never changes — rather than the string the function happens to return. A
 * future rewrite of the predicate is free as long as the origin holds.
 */

const ORIGIN = "https://tech-epitome.vercel.app";

/** What a browser would navigate to, given this value in a `Location` header. */
function resolvedOrigin(path: string): string {
  return new URL(path, ORIGIN).origin;
}

describe("safeInternalPath", () => {
  const HOSTILE = [
    ["protocol-relative", "//evil.example.com"],
    ["backslash", "/\\evil.example.com"],
    ["double backslash", "/\\\\evil.example.com"],
    ["backslash after slash", "/\\/evil.example.com"],
    ["tab then slash", "/\t/evil.example.com"],
    ["newline then slash", "/\n/evil.example.com"],
    ["carriage return then slash", "/\r/evil.example.com"],
    ["absolute https", "https://evil.example.com"],
    ["absolute http", "http://evil.example.com"],
    ["scheme-less absolute", "evil.example.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>alert(1)</script>"],
    ["userinfo confusion", "/\\@evil.example.com"],
    ["encoded backslash is inert but still not a host", "/%5Cevil.example.com"],
  ] as const;

  it.each(HOSTILE)("rejects %s and stays on this origin", (_label, payload) => {
    const result = safeInternalPath(payload, "/dashboard");
    expect(resolvedOrigin(result)).toBe(ORIGIN);
  });

  it("never lets any hostile payload reach another origin, whatever the fallback", () => {
    for (const [, payload] of HOSTILE) {
      for (const fallback of ["/dashboard", "", "/onboarding"]) {
        const result = safeInternalPath(payload, fallback);
        // An empty fallback resolves to the origin root, which is still us.
        expect(resolvedOrigin(result || "/")).toBe(ORIGIN);
      }
    }
  });

  const LEGITIMATE = [
    "/dashboard",
    "/login",
    "/prepare",
    "/dashboard?foo=bar",
    "/dashboard#section",
    "/problems?difficulty=hard",
    "/learn/dsa/foundations/arrays/two-pointers",
    "/problems?q=two%20sum&difficulty=easy",
    "/review#due",
    "/patterns/sliding-window",
  ];

  it.each(LEGITIMATE)("passes the internal path %s through unchanged", (path) => {
    expect(safeInternalPath(path, "/dashboard")).toBe(path);
    expect(resolvedOrigin(path)).toBe(ORIGIN);
  });

  it("falls back when there is nothing usable", () => {
    expect(safeInternalPath(undefined, "/dashboard")).toBe("/dashboard");
    expect(safeInternalPath(null, "/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("", "/dashboard")).toBe("/dashboard");
    expect(safeInternalPath(42, "/dashboard")).toBe("/dashboard");
    expect(safeInternalPath({}, "/dashboard")).toBe("/dashboard");
  });

  it("honours the caller's fallback, including the empty one signup relies on", () => {
    expect(safeInternalPath("https://evil.example.com", "")).toBe("");
    expect(safeInternalPath(undefined, "")).toBe("");
  });

  it("takes the first entry of a repeated search param", () => {
    expect(safeInternalPath(["/review", "/dashboard"], "/dashboard")).toBe("/review");
    // A hostile first entry is still rejected, not rescued by a safe second.
    expect(safeInternalPath(["//evil.example.com", "/review"], "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects a relative path that is not absolute", () => {
    expect(safeInternalPath("dashboard", "/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("../admin", "/dashboard")).toBe("/dashboard");
  });
});
