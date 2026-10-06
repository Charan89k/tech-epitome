"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  ExternalLink,
  ListChecks,
  Loader2,
  Shapes,
} from "lucide-react";

import { gradeReviewAction } from "@/app/(shell)/review/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { EntityType, ReviewGrade } from "@/generated/prisma/enums";
import type { ReviewPrompt } from "@/lib/review/prompts";
import { cn, route } from "@/lib/utils";

/**
 * One review session.
 *
 * The whole design rests on one rule: the answer is never on screen until
 * the learner says they have attempted recall. Showing both at once turns
 * retrieval practice into reading, which is the thing spaced repetition
 * exists to avoid.
 *
 * The queue is handed over whole by the server and worked through in
 * memory. Refetching between cards would put a network round trip inside
 * the one interaction that has to feel immediate, and the ordering is
 * already fixed the moment the session starts.
 */

export type SessionCard = {
  id: string;
  entityType: EntityType;
  stage: string;
  overdueDays: number;
  lapses: number;
  prompt: ReviewPrompt;
};

const TYPE_ICON: Partial<Record<EntityType, typeof BookOpen>> = {
  CHAPTER: BookOpen,
  PATTERN: Shapes,
  PROBLEM: ListChecks,
};

/**
 * The grading ladder.
 *
 * Wording is about recall, not about the content: "Forgot" and "Struggled"
 * describe what happened in the learner's head, which is the only thing
 * they can honestly report.
 */
const GRADES: {
  grade: ReviewGrade;
  label: string;
  hint: string;
  key: string;
  className: string;
}[] = [
  {
    grade: "AGAIN",
    label: "Forgot",
    hint: "Comes back this session",
    key: "1",
    className:
      "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
  },
  {
    grade: "HARD",
    label: "Struggled",
    hint: "Barely moves",
    key: "2",
    className: "border-warning/40 text-warning hover:bg-warning/10 hover:text-warning",
  },
  {
    grade: "GOOD",
    label: "Recalled",
    hint: "Normal spacing",
    key: "3",
    className:
      "border-ember-500/40 text-ember-300 hover:bg-ember-500/10 hover:text-ember-200",
  },
  {
    grade: "EASY",
    label: "Effortless",
    hint: "Longer gap",
    key: "4",
    className:
      "border-ember-500/60 bg-ember-500/10 text-ember-200 hover:bg-ember-500/20 hover:text-ember-100",
  },
];

export function ReviewSession({ initialQueue }: { initialQueue: SessionCard[] }) {
  const router = useRouter();

  const [queue, setQueue] = useState<SessionCard[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Guards against a double submission: a second click, or a keystroke
  // landing while the first request is still in flight, must not grade the
  // card twice.
  const submitting = useRef(false);

  const current = queue[index];
  const total = queue.length;
  const finished = index >= total;

  const submit = useCallback(
    async (grade: ReviewGrade) => {
      if (!current || submitting.current) return;

      submitting.current = true;
      setPending(true);
      setError(null);

      try {
        const response = await gradeReviewAction({
          reviewItemId: current.id,
          grade,
        });

        if (!response.ok) {
          setError(response.error);
          return;
        }

        setCompleted((value) => value + 1);
        setLastResult(
          response.data.requeueInSession
            ? "Back before the end of this session."
            : `Next up ${response.data.nextIn}.`
        );

        if (response.data.requeueInSession) {
          // A forgotten card returns at the end of the session rather than
          // immediately: a gap of even a few minutes and a few other cards
          // is what makes the second attempt a recall instead of an echo.
          setQueue((previous) => [...previous, current]);
        }

        setRevealed(false);
        setIndex((value) => value + 1);
      } finally {
        setPending(false);
        submitting.current = false;
      }
    },
    [current]
  );

  // Keyboard shortcuts: space to reveal, 1-4 to grade. The same order as
  // the buttons, so the mapping is learnable by looking at the screen.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }
      if (finished || pending) return;

      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }

      if (revealed) {
        const match = GRADES.find((option) => option.key === event.key);
        if (match) {
          event.preventDefault();
          void submit(match.grade);
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [revealed, finished, pending, submit]);

  const progressPercent = useMemo(
    () => (total === 0 ? 100 : Math.round((index / total) * 100)),
    [index, total]
  );

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card px-6 py-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-ember-500/12 ring-1 ring-ember-500/25">
            <CheckCircle2 className="size-6 text-ember-400" aria-hidden="true" />
          </div>
          <h1 className="tracking-headline mt-4 text-xl font-bold">Session complete</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed} review{completed === 1 ? "" : "s"} done. Each one is scheduled
            to come back just before you would have forgotten it.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.refresh()}>Check for more</Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const Icon = TYPE_ICON[current.entityType] ?? BookOpen;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Progress. Deliberately plain: a review session is not a game. */}
        <div className="mb-6">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
            <span className="text-[0.68rem] font-medium tracking-wider text-muted-foreground uppercase">
              Review session
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">
              <span className="text-foreground">
                {index + 1} of {total}
              </span>
              {completed > 0 && <span> · {completed} done</span>}
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={index}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Session progress"
          >
            <div
              className="h-full rounded-full bg-ember-500 transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {lastResult && (
          <p
            aria-live="polite"
            className="mb-4 text-center text-xs text-muted-foreground"
          >
            {lastResult}
          </p>
        )}

        <article className="overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ember-500/12 px-2.5 py-1 text-[0.68rem] font-medium tracking-wider text-ember-300 uppercase">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {current.prompt.kind}
            </span>
            {current.overdueDays > 0 && (
              <span className="ml-auto text-[0.68rem] text-warning">
                {current.overdueDays} day{current.overdueDays === 1 ? "" : "s"} overdue
              </span>
            )}
          </header>

          <div className="px-5 py-7 sm:px-6 sm:py-8">
            <h1 className="tracking-headline text-xl leading-snug font-semibold text-balance sm:text-2xl">
              {current.prompt.question}
            </h1>

            {current.prompt.context && (
              <p className="mt-3 text-xs text-muted-foreground">
                {current.prompt.context}
              </p>
            )}

            {!revealed ? (
              <div className="mt-8 border-t border-dashed border-border pt-6">
                <p className="mb-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  Answer it in your head first — out loud is better. Retrieval is what
                  moves this into long-term memory; re-reading does not.
                </p>
                {/* h-11 rather than the default h-8: this is the primary
                  action of the page and the one control a thumb has to hit
                  reliably. */}
                <Button
                  onClick={() => setRevealed(true)}
                  className="h-11 w-full sm:w-auto"
                >
                  <Eye className="size-4" />
                  Show answer
                  <kbd className="ml-1 hidden rounded bg-background/20 px-1.5 py-0.5 font-mono text-[0.65rem] sm:inline">
                    space
                  </kbd>
                </Button>
              </div>
            ) : (
              <div className="mt-7 space-y-5 border-t border-border pt-6">
                {current.prompt.answer.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-[0.68rem] font-medium tracking-wider text-ember-300/90 uppercase">
                      {section.heading}
                    </h2>
                    <ul className="mt-2 space-y-1.5">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm">
                          <span
                            className="mt-2 size-1 shrink-0 rounded-full bg-ember-500/50"
                            aria-hidden="true"
                          />
                          <span className="leading-relaxed text-foreground/85">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <Link
                  href={route(current.prompt.href)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-ember-300"
                >
                  Re-read {current.prompt.title}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {revealed && (
            <footer className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
              <p className="mb-3 text-xs text-muted-foreground">
                How did that go? Be honest — the schedule is only as good as the answer.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADES.map((option) => (
                  <Button
                    key={option.grade}
                    variant="outline"
                    onClick={() => void submit(option.grade)}
                    disabled={pending}
                    className={cn(
                      "h-auto flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left whitespace-normal",
                      option.className
                    )}
                  >
                    <span className="flex w-full items-center gap-1.5 text-sm font-medium">
                      {pending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : null}
                      {option.label}
                      <kbd className="ml-auto hidden rounded border border-border px-1 font-mono text-[0.6rem] text-muted-foreground sm:inline">
                        {option.key}
                      </kbd>
                    </span>
                    <span className="text-[0.65rem] font-normal text-muted-foreground">
                      {option.hint}
                    </span>
                  </Button>
                ))}
              </div>
            </footer>
          )}
        </article>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setRevealed(false);
                  setIndex((value) => value + 1);
                }}
              >
                Skip
                <ArrowRight className="size-3.5" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
