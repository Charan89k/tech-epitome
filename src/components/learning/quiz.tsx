"use client";

import { useState, useTransition } from "react";
import { Check, CircleHelp, Loader2, RotateCcw, X } from "lucide-react";

import { submitQuizAction } from "@/app/(shell)/learn/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { QuizResult } from "@/services/quiz";
import type { QuizView } from "@/services/quiz";

/**
 * The quiz engine's UI.
 *
 * Every answer is graded on the server; this component never knows the
 * correct option until the result comes back. That is not paranoia about
 * cheating so much as a design constraint — the correct answer and its
 * explanation are teaching material, and showing them early destroys the
 * exercise.
 */
export function Quiz({
  quiz,
  signedIn,
}: {
  quiz: QuizView;
  signedIn: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = Object.keys(answers).length;
  const complete = answered === quiz.questions.length;

  function submit() {
    setError(null);
    startTransition(async () => {
      const response = await submitQuizAction({
        quizSlug: quiz.slug,
        answers,
      });
      if (response.ok) {
        setResult(response.data);
      } else {
        setError(response.error);
      }
    });
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  const gradedById = new Map(result?.graded.map((g) => [g.questionId, g]) ?? []);

  return (
    <section
      className="not-prose border-border bg-card surface-edge my-6 rounded-xl border"
      aria-labelledby={`quiz-${quiz.slug}`}
    >
      <header className="border-border flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0">
          <p className="text-ember-400 font-mono text-[0.68rem] tracking-wider uppercase">
            Quick quiz
          </p>
          <h3 id={`quiz-${quiz.slug}`} className="truncate text-sm font-semibold">
            {quiz.title}
          </h3>
        </div>
        {result && (
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "tabular text-lg font-semibold",
                result.passed ? "text-success" : "text-warning"
              )}
            >
              {result.percent}%
            </p>
            <p className="text-muted-foreground text-[0.68rem]">
              {result.score}/{result.maxScore}
            </p>
          </div>
        )}
      </header>

      <div className="divide-border divide-y">
        {quiz.questions.map((question, index) => {
          const graded = gradedById.get(question.id);
          const selected = answers[question.id];

          return (
            <fieldset
              key={question.id}
              // min-w-0 is load-bearing: browsers give <fieldset> a UA
              // default of min-inline-size: min-content, so it refuses to
              // shrink below its widest child — a code snippet here — and
              // pushes the whole page wider on a phone.
              className="min-w-0 px-5 py-4"
            >
              <legend className="mb-3 flex gap-2.5 text-sm">
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {index + 1}
                </span>
                <span className="text-foreground">{question.prompt}</span>
              </legend>

              {question.code && (
                <pre className="border-border bg-muted/40 mb-3 max-w-full overflow-x-auto rounded-md border p-3 font-mono text-[0.72rem] leading-relaxed">
                  <code>{question.code}</code>
                </pre>
              )}

              <RadioGroup
                value={selected ?? ""}
                onValueChange={(value) =>
                  setAnswers((previous) => ({ ...previous, [question.id]: value }))
                }
                disabled={Boolean(result) || pending}
                className="gap-2"
              >
                {question.options.map((option) => {
                  const isCorrect = graded?.correctAnswer === option.id;
                  const isChosen = selected === option.id;
                  const showRight = graded && isCorrect;
                  const showWrong = graded && isChosen && !isCorrect;

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border px-3 py-2 transition-colors",
                        showRight
                          ? "border-success/40 bg-success/8"
                          : showWrong
                            ? "border-destructive/40 bg-destructive/8"
                            : isChosen
                              ? "border-ember-500/40 bg-ember-500/6"
                              : "border-border"
                      )}
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={`${question.id}-${option.id}`}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {option.text}
                      </Label>
                      {showRight && (
                        <Check className="text-success mt-0.5 size-4 shrink-0" aria-label="Correct answer" />
                      )}
                      {showWrong && (
                        <X className="text-destructive mt-0.5 size-4 shrink-0" aria-label="Your answer, incorrect" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>

              {graded && (
                <div
                  className={cn(
                    "mt-3 rounded-md border p-3",
                    graded.correct
                      ? "border-success/25 bg-success/5"
                      : "border-warning/25 bg-warning/5"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      graded.correct ? "text-success" : "text-warning"
                    )}
                  >
                    {graded.correct ? "Correct" : "Not quite"}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {graded.explanation}
                  </p>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <footer className="border-border flex flex-wrap items-center gap-3 border-t px-5 py-3">
        {!signedIn ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <CircleHelp className="size-3.5" aria-hidden="true" />
            Sign in to submit and record your score.
          </p>
        ) : result ? (
          <>
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <p className="text-muted-foreground text-xs">
              {result.passed
                ? "Passed. The explanations above are worth reading either way."
                : `You need ${quiz.passScore}% to pass. Read the explanations and retry.`}
            </p>
          </>
        ) : (
          <>
            <Button size="sm" onClick={submit} disabled={!complete || pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? "Checking…" : "Check answers"}
            </Button>
            <p className="text-muted-foreground text-xs tabular-nums">
              {answered}/{quiz.questions.length} answered
            </p>
          </>
        )}

        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </footer>
    </section>
  );
}
