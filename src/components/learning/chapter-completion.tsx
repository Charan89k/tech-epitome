"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";

import {
  completeChapterAction,
  startChapterAction,
  uncompleteChapterAction,
} from "@/app/(shell)/learn/actions";
import { Button } from "@/components/ui/button";
import { route } from "@/lib/utils";

/**
 * The end-of-chapter recap and the completion control.
 *
 * Completion is explicit. Scrolling to the bottom of a page is not evidence
 * that anything was learned, and a progress record that fills itself in is
 * worth nothing to the person relying on it. The button is the only thing
 * that marks a chapter done.
 *
 * Time on the chapter is measured from mount and sent with the completion,
 * clamped server-side so a tab left open overnight cannot claim eight hours.
 */
export function ChapterCompletion({
  chapterId,
  keyTakeaways,
  initiallyComplete,
  signedIn,
  next,
  hasQuiz,
  problemCount,
}: {
  chapterId: string;
  keyTakeaways: string[];
  initiallyComplete: boolean;
  signedIn: boolean;
  next: { title: string; href: string } | null;
  hasQuiz: boolean;
  problemCount: number;
}) {
  const [complete, setComplete] = useState(initiallyComplete);
  const [pending, startTransition] = useTransition();
  // Set in the effect below rather than in the initialiser: calling
  // Date.now() during render is impure, and under StrictMode's double
  // render it would be called twice and discarded once.
  const mountedAt = useRef(0);

  // Records that the chapter was opened. Explicitly does not complete it.
  useEffect(() => {
    mountedAt.current = Date.now();
    if (!signedIn) return;
    void startChapterAction(chapterId);
  }, [chapterId, signedIn]);

  function toggle() {
    const seconds = mountedAt.current
      ? Math.round((Date.now() - mountedAt.current) / 1000)
      : 0;
    startTransition(async () => {
      if (complete) {
        await uncompleteChapterAction(chapterId);
        setComplete(false);
      } else {
        const result = await completeChapterAction(chapterId, seconds);
        if (result.ok) setComplete(true);
      }
    });
  }

  return (
    <section
      aria-labelledby="chapter-recap"
      className="not-prose border-border bg-card surface-edge mt-10 rounded-lg border"
    >
      <div className="border-border border-b px-5 py-4">
        <h2 id="chapter-recap" className="text-sm font-semibold">
          You&rsquo;ve reached the end
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          What this chapter was for:
        </p>
        <ul className="mt-3 space-y-1.5">
          {keyTakeaways.map((takeaway) => (
            <li key={takeaway} className="flex gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground leading-relaxed">{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {(hasQuiz || problemCount > 0) && (
        <p className="border-border text-muted-foreground border-b px-5 py-2.5 text-xs">
          Before moving on:{" "}
          {[
            hasQuiz ? "take the quiz above" : null,
            problemCount > 0
              ? `try ${problemCount} practice problem${problemCount === 1 ? "" : "s"}`
              : null,
          ]
            .filter(Boolean)
            .join(", and ")}
          .
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        {signedIn ? (
          <Button
            variant={complete ? "outline" : "default"}
            onClick={toggle}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : complete ? (
              <RotateCcw className="size-4" />
            ) : (
              <Check className="size-4" />
            )}
            {complete ? "Mark as not complete" : "Mark chapter complete"}
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/signup">Sign in to track progress</Link>
          </Button>
        )}

        {next && (
          <Button asChild variant={complete ? "default" : "ghost"}>
            <Link href={route(next.href)}>
              Continue: {next.title}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}

        {!next && complete && (
          <p className="text-success text-sm">
            That was the last chapter in this course.
          </p>
        )}
      </div>
    </section>
  );
}
