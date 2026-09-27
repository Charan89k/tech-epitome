"use client";

import { useEffect } from "react";

/**
 * The last resort: an error thrown by the root layout itself.
 *
 * `error.tsx` is rendered *inside* the root layout, so a failure in that
 * layout has no boundary — React unmounts everything and the user gets a
 * blank page. This replaces the document, which is why it has to render
 * its own `<html>` and `<body>`.
 *
 * Deliberately styled with inline attributes and no imports beyond React.
 * Whatever broke may have been the theme provider, the font loader or the
 * stylesheet itself; a fallback that depends on those can fail the same
 * way and show nothing at all.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b1d21",
          color: "#e9e9ec",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Tech Epitome could not start
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#a0a0aa",
            }}
          >
            Something failed before the page could be built. Reloading often
            works.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #3a3d44",
              background: "#26282d",
              color: "inherit",
              font: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, monospace",
                color: "#6f7079",
              }}
            >
              reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
