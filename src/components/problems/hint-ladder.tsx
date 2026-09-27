"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Loader2, Lock } from "lucide-react";

import { revealHintAction } from "@/app/(shell)/problems/actions";
import { Button } from "@/components/ui/button";

/**
 * Progressive hints.
 *
 * The ladder is enforced on the server: this component asks for "the next
 * hint" and the server decides which that is from the stored counter. There
 * is no way to jump to the last one, which matters because the escalation
 * is the teaching device — a hint that names the pattern immediately is
 * just the answer with extra steps.
 */
export function HintLadder({
  slug,
  totalHints,
  initiallyRevealed,
  signedIn,
}: {
  slug: string;
  totalHints: number;
  initiallyRevealed: number;
  signedIn: boolean;
}) {
  // Hints already opened in a previous session are re-fetched one tap at a
  // time rather than dumped on the page, so returning to a problem does not
  // spoil it.
  const [revealed, setRevealed] = useState<{ index: number; body: string }[]>([]);
  const [count, setCount] = useState(initiallyRevealed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (totalHints === 0) return null;

  const remaining = totalHints - revealed.length;

  function next() {
    setError(null);
    startTransition(async () => {
      const result = await revealHintAction(slug);
      if (result.ok) {
        setRevealed((previous) => [
          ...previous,
          { index: result.data.index, body: result.data.body },
        ]);
        setCount(result.data.index);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section aria-labelledby="hints" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="hints" className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="text-warning size-4" aria-hidden="true" />
          Hints
        </h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {revealed.length}/{totalHints}
        </span>
      </div>

      {count > 0 && revealed.length === 0 && (
        <p className="text-muted-foreground text-xs">
          You opened {count} hint{count === 1 ? "" : "s"} on a previous visit.
          They are not shown automatically — try again before reopening them.
        </p>
      )}

      {revealed.map((hint) => (
        <div
          key={hint.index}
          className="border-warning/25 bg-warning/5 rounded-md border p-3"
        >
          <p className="text-warning text-[0.68rem] font-medium tracking-wider uppercase">
            Hint {hint.index}
          </p>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {hint.body}
          </p>
        </div>
      ))}

      {!signedIn ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Lock className="size-3.5" aria-hidden="true" />
          Sign in to open hints.
        </p>
      ) : remaining > 0 ? (
        <Button variant="outline" size="sm" onClick={next} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {revealed.length === 0 ? "Show a hint" : "Next hint"}
          <span className="text-muted-foreground ml-1 text-xs">({remaining} left)</span>
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          That is every hint. If you are still stuck, the solution below walks
          through the reasoning.
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </section>
  );
}
