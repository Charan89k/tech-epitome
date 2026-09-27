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
    className: "border-ember-500/40 text-ember-300 hover:bg-ember-500/10",
  },
  {
    grade: "EASY",
    label: "Effortless",
    hint: "Longer gap",
    key: "4",
    className: "border-success/40 text-success hover:bg-success/10 hover:text-success",
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
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="text-success mx-auto size-7" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Session complete
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {completed} review{completed === 1 ? "" : "s"} done. Each one is
          scheduled to come back just before you would have forgotten it.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.refresh()}>Check for more</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const Icon = TYPE_ICON[current.entityType] ?? BookOpen;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      {/* Progress. Deliberately plain: a review session is not a game. */}
      <div className="mb-6">
        <div className="text-muted-foreground mb-2 flex items-baseline justify-between text-xs">
          <span className="tabular-nums">
            {index + 1} of {total}
          </span>
          {completed > 0 && (
            <span className="tabular-nums">{completed} done</span>
          )}
        </div>
        <div
          className="bg-muted h-1 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Session progress"
        >
          <div
            className="bg-ember-500 h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {lastResult && (
        <p
          aria-live="polite"
          className="text-muted-foreground mb-4 text-center text-xs"
        >
          {lastResult}
        </p>
      )}

      <article className="border-border bg-card surface-edge rounded-lg border">
        <header className="border-border flex flex-wrap items-center gap-2 border-b px-5 py-3">
          <Icon className="text-ember-500 size-4 shrink-0" aria-hidden="true" />
          <span className="text-muted-foreground font-mono text-[0.68rem] tracking-wider uppercase">
            {current.prompt.kind}
          </span>
          {current.overdueDays > 0 && (
            <span className="text-warning ml-auto text-[0.68rem]">
              {current.overdueDays} day{current.overdueDays === 1 ? "" : "s"} overdue
            </span>
          )}
        </header>

        <div className="px-5 py-6">
          <h1 className="text-lg leading-snug font-medium text-balance">
            {current.prompt.question}
          </h1>

          {current.prompt.context && (
            <p className="text-muted-foreground mt-3 text-xs">
              {current.prompt.context}
            </p>
          )}

          {!revealed ? (
            <div className="mt-8">
              <p className="text-muted-foreground mb-4 text-sm">
                Answer it in your head first — out loud is better. Retrieval is
                what moves this into long-term memory; re-reading does not.
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
                <kbd className="bg-background/20 ml-1 hidden rounded px-1.5 py-0.5 font-mono text-[0.65rem] sm:inline">
                  space
                </kbd>
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {current.prompt.answer.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
                    {section.heading}
                  </h2>
                  <ul className="mt-2 space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm">
                        <span
                          className="bg-ember-500/50 mt-2 size-1 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                        <span className="text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <Link
                href={route(current.prompt.href)}
                className="text-muted-foreground hover:text-ember-300 inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                Re-read {current.prompt.title}
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {revealed && (
          <footer className="border-border border-t px-5 py-4">
            <p className="text-muted-foreground mb-3 text-xs">
              How did that go? Be honest — the schedule is only as good as the
              answer.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((option) => (
                <Button
                  key={option.grade}
                  variant="outline"
                  onClick={() => void submit(option.grade)}
                  disabled={pending}
                  className={cn(
                    "h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left",
                    option.className
                  )}
                >
                  <span className="flex w-full items-center gap-1.5 text-sm font-medium">
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {option.label}
                    <kbd className="text-muted-foreground ml-auto hidden font-mono text-[0.6rem] sm:inline">
                      {option.key}
                    </kbd>
                  </span>
                  <span className="text-muted-foreground text-[0.65rem] font-normal">
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
  );
}
