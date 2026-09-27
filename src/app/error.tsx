"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { StatusScreen } from "@/components/common/status-screen";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary.
 *
 * Shows the digest rather than the message: `error.message` is scrubbed in
 * production anyway, and the digest is what correlates with the server log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <>
      <StatusScreen
        icon={TriangleAlert}
        title="Something went wrong"
        description="This one is on us. Retrying often works; if it does not, the reference below identifies the failure in our logs."
        primary={{ label: "Back to home", href: "/" }}
        secondary={
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
        }
      />
      {error.digest && (
        <p className="text-muted-foreground/60 pb-8 text-center font-mono text-xs">
          reference: {error.digest}
        </p>
      )}
    </>
  );
}
