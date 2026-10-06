"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { route } from "@/lib/utils";

/**
 * "Which pattern is this?" drill.
 *
 * The clues stay hidden until the reader commits to looking, because the
 * exercise is worthless if the answer is on screen while they think. This is
 * the single most important interaction in the product: it rehearses the
 * recognition step that an interview actually tests.
 */
export function RecognitionDrill({
  prompt,
  clues,
  answerPatternSlug,
  answerPatternName,
  explanation,
}: {
  prompt: string;
  clues: string[];
  answerPatternSlug: string;
  answerPatternName: string;
  explanation: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="not-prose border-ember-500/25 bg-ember-500/5 my-6 rounded-xl border p-5">
      <p className="text-ember-400 font-mono text-[0.7rem] tracking-wider uppercase">
        Can you recognise the pattern?
      </p>

      <p className="text-foreground mt-2.5 text-sm leading-relaxed">{prompt}</p>

      {!revealed ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setRevealed(true)}
        >
          <Eye className="size-4" />
          Show the clues and answer
        </Button>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Clues
            </p>
            <ul className="mt-2 space-y-1.5">
              {clues.map((clue) => (
                <li
                  key={clue}
                  className="text-muted-foreground flex gap-2 text-sm"
                >
                  <span className="text-success mt-px shrink-0" aria-hidden="true">
                    ✓
                  </span>
                  {clue}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Pattern
            </p>
            <Link
              href={route(`/patterns/${answerPatternSlug}`)}
              className="text-ember-400 mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              {answerPatternName}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
