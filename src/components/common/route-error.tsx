"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * A segment-level error boundary.
 *
 * Distinct from the root one on purpose. The root boundary replaces the
 * whole page, which is right for a failure in the shell and wrong for a
 * failure inside one route: losing the sidebar and the top bar because a
 * problem list query failed leaves the reader stranded. This keeps the
 * shell and reports the failure in place, so "try again" and "go
 * somewhere else" are both one click away.
 *
 * Shows the digest rather than the message: `error.message` is scrubbed
 * in production anyway, and the digest is what correlates with the log.
 */
export function RouteError({
  error,
  reset,
  what,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** What failed to load, in the learner's words: "the problem list". */
  what: string;
}) {
  useEffect(() => {
    console.error(`Route error while loading ${what}:`, error);
  }, [error, what]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Alert variant="destructive">
        <AlertTitle>Could not load {what}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            This one is on us. Retrying often works — the rest of the site is
            unaffected.
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" />
            Try again
          </Button>
          {error.digest && (
            <p className="text-muted-foreground/70 font-mono text-xs">
              reference: {error.digest}
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
