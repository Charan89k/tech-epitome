"use client";

import { useState, useTransition } from "react";

import { submitAptitudeAction } from "@/app/(shell)/campus/aptitude/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AptitudeResult } from "@/data/aptitude";
import { cn } from "@/lib/utils";

type Question = { id: string; prompt: string; options: readonly string[] };

export function AptitudeSet({
  topicKey,
  questions,
}: {
  topicKey: string;
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AptitudeResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const review = new Map(result?.review.map((r) => [r.id, r]));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFailed(false);
        start(async () => {
          try {
            const graded = await submitAptitudeAction(topicKey, answers);
            setResult(graded);
            setFailed(!graded);
          } catch {
            setFailed(true);
          }
        });
      }}
    >
      {result && (
        <Alert variant="info" role="status" className="mb-4">
          <AlertDescription>
            You got <span className="font-mono">{result.correct}</span> of{" "}
            <span className="font-mono">{result.total}</span>. Explanations are below.
          </AlertDescription>
        </Alert>
      )}
      {failed && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>That could not be saved. Try again.</AlertDescription>
        </Alert>
      )}
      <ol className="space-y-6">
        {questions.map((q, i) => {
          const r = review.get(q.id);
          return (
            <li key={q.id}>
              <fieldset disabled={Boolean(result)}>
                <legend className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-subtle-foreground">
                    {i + 1}
                  </span>
                  {q.prompt}
                </legend>
                <div className="mt-2 space-y-1">
                  {q.options.map((option, index) => (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm",
                        r && index === r.answer && "border-success/60 text-success",
                        r &&
                          index === r.chosen &&
                          index !== r.answer &&
                          "border-destructive/60"
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === index}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: index }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {r && (
                  <p className="mt-2 text-sm text-muted-foreground">{r.explanation}</p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className="mt-6">
        {result ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Try again
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? "Checking..." : "Check my answers"}
          </Button>
        )}
      </div>
    </form>
  );
}
