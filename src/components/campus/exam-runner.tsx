"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  saveAnswerAction,
  submitAttemptAction,
} from "@/app/(shell)/campus/learning-actions";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import type { Language } from "@/generated/prisma/enums";
import { EXAM_LANGUAGES } from "@/lib/campus/schemas";

/**
 * The exam page's interactive half. The server owns time and validity;
 * this only draws a countdown from the server's clock, saves each answer
 * as it changes, and retries saves that did not reach the server.
 *
 * Every save carries a sequence number that only grows, so retries and
 * out-of-order arrivals cannot overwrite newer work (the server keeps the
 * highest). Nothing here can extend the deadline: once it passes, the
 * server refuses saves and the attempt closes with what it already has.
 */

export type RunnerQuestion = {
  key: string;
  kind: "CHOICE" | "CODING";
  type: string | null;
  points: number;
  options: { id: string; text: string }[];
  starterCode: Record<string, string>;
  prompt: ReactNode;
};

type SaveState = "saving" | "saved" | "retrying" | "error";

const LANGUAGE_LABELS: Record<(typeof EXAM_LANGUAGES)[number], string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  JAVA: "Java",
  CPP: "C++",
};

const DEBOUNCE_MS = 800;
const FIRST_RETRY_MS = 2000;
const MAX_RETRY_MS = 30_000;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunner({
  slug,
  attemptId,
  deadlineAt,
  serverNow,
  questions,
  saved,
}: {
  slug: string;
  attemptId: string;
  deadlineAt: string;
  serverNow: string;
  questions: RunnerQuestion[];
  saved: Record<string, { value: unknown; seq: number }>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, v.value]))
  );
  const [states, setStates] = useState<Record<string, SaveState>>({});
  const [closed, setClosed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sequence numbers continue from the highest the server has stored.
  const seq = useRef(Math.max(0, ...Object.values(saved).map((v) => v.seq)));
  const pending = useRef(new Map<string, { value: unknown; seq: number }>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const retryDelay = useRef(new Map<string, number>());

  // Offset between the server's clock and this device's, measured at load.
  const deadline = new Date(deadlineAt).getTime();
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [remaining, setRemaining] = useState(
    () => deadline - new Date(serverNow).getTime()
  );
  // Lets a scheduled retry call the latest `send` without `send` naming itself.
  const sendRef = useRef<(key: string) => Promise<void>>(async () => {});

  const mark = (key: string, state: SaveState) =>
    setStates((prev) => ({ ...prev, [key]: state }));

  const send = useCallback(
    async (key: string): Promise<void> => {
      const job = pending.current.get(key);
      if (!job) return;
      mark(key, "saving");
      let result: Awaited<ReturnType<typeof saveAnswerAction>> | null = null;
      try {
        result = await saveAnswerAction(slug, {
          attemptId,
          questionKey: key,
          value: job.value,
          seq: job.seq,
        });
      } catch {
        result = null; // Offline or a server error: retried below.
      }

      if (result?.status === "saved" || result?.status === "stale") {
        if (pending.current.get(key)?.seq === job.seq) pending.current.delete(key);
        retryDelay.current.delete(key);
        // "stale": a newer answer (this tab's next save, or another tab's) is stored.
        const superseded = result.status === "stale" && result.seq > seq.current;
        mark(key, superseded ? "error" : "saved");
        return;
      }
      if (result?.status === "closed") {
        pending.current.clear();
        setClosed(true);
        return;
      }
      if (result?.status === "error") {
        pending.current.delete(key);
        mark(key, "error");
        return;
      }
      const wait = Math.min(
        (retryDelay.current.get(key) ?? FIRST_RETRY_MS / 2) * 2,
        MAX_RETRY_MS
      );
      retryDelay.current.set(key, wait);
      mark(key, "retrying");
      timers.current.set(
        key,
        setTimeout(() => void sendRef.current(key), wait)
      );
    },
    [attemptId, slug]
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const change = (key: string, value: unknown, debounce: boolean) => {
    if (closed) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    seq.current += 1;
    pending.current.set(key, { value, seq: seq.current });
    clearTimeout(timers.current.get(key));
    if (!debounce) {
      void send(key);
      return;
    }
    mark(key, "saving");
    timers.current.set(
      key,
      setTimeout(() => void send(key), DEBOUNCE_MS)
    );
  };

  const flush = async () => {
    for (const key of [...pending.current.keys()]) {
      clearTimeout(timers.current.get(key));
      await send(key);
    }
  };

  useEffect(() => {
    const tick = setInterval(() => {
      const left = deadline - (Date.now() + offset);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(tick);
        setClosed(true);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [deadline, offset]);

  // Time is up or the server refused a save: reload the server's view,
  // which closes the attempt with the answers it already has.
  useEffect(() => {
    if (!closed) return;
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [closed, router]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const submit = async () => {
    setSubmitting(true);
    await flush();
    await submitAttemptAction(slug, attemptId);
  };

  const unsaved = Object.values(states).some((s) => s === "saving" || s === "retrying");
  const minutesLeft = Math.ceil(remaining / 60_000);

  return (
    <div>
      <div
        className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
        role="region"
        aria-label="Exam status"
      >
        <p className="text-sm">
          Time left:{" "}
          <span
            className={`font-mono font-semibold tabular-nums ${remaining < 5 * 60_000 ? "text-destructive" : ""}`}
          >
            {formatRemaining(remaining)}
          </span>
          <span className="sr-only" aria-live="polite">
            {minutesLeft <= 5 && minutesLeft > 0 ? `${minutesLeft} minutes left` : ""}
          </span>
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {closed
            ? "Time is up. Your saved answers are final."
            : unsaved
              ? "Saving…"
              : "All changes saved"}
        </p>
      </div>

      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={q.key} className="rounded-lg border border-border p-4">
            <fieldset disabled={closed || submitting}>
              <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-semibold">
                <span>Question {i + 1}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {q.points} {q.points === 1 ? "point" : "points"}
                </span>
              </legend>
              <div className="mt-2">{q.prompt}</div>
              <div className="mt-4">
                {q.kind === "CHOICE" ? (
                  <ChoiceInput
                    question={q}
                    value={answers[q.key]}
                    onChange={(v) => change(q.key, v, false)}
                  />
                ) : (
                  <CodingInput
                    question={q}
                    value={
                      answers[q.key] as { language: Language; code: string } | undefined
                    }
                    onChange={(v) => change(q.key, v, true)}
                  />
                )}
              </div>
              <SaveBadge state={states[q.key]} />
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        {confirming ? (
          <>
            <p className="text-sm">Submit now? You cannot change answers afterwards.</p>
            <Button onClick={submit} disabled={submitting || closed}>
              {submitting ? "Submitting…" : "Yes, submit"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={submitting}
            >
              Keep working
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirming(true)} disabled={closed}>
            Submit answers
          </Button>
        )}
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState | undefined }) {
  if (!state) return null;
  const text = {
    saving: "Saving…",
    saved: "Saved",
    retrying: "Not saved yet. Retrying…",
    error: "Not saved. Reload the page: another tab may have newer answers.",
  }[state];
  const bad = state === "error" || state === "retrying";
  return (
    <p className={`mt-3 text-xs ${bad ? "text-destructive" : "text-muted-foreground"}`}>
      {text}
    </p>
  );
}

function ChoiceInput({
  question,
  value,
  onChange,
}: {
  question: RunnerQuestion;
  value: unknown;
  onChange: (value: string | string[]) => void;
}) {
  const multi = question.type === "MULTI_SELECT";
  const chosen = new Set(
    Array.isArray(value) ? value : typeof value === "string" ? [value] : []
  );
  return (
    <div className="space-y-2">
      {multi && <p className="text-xs text-muted-foreground">Select all that apply.</p>}
      {question.options.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary"
        >
          <input
            type={multi ? "checkbox" : "radio"}
            name={question.key}
            value={o.id}
            checked={chosen.has(o.id)}
            onChange={(e) => {
              if (!multi) return onChange(o.id);
              const next = new Set(chosen);
              if (e.target.checked) next.add(o.id);
              else next.delete(o.id);
              onChange(question.options.map((x) => x.id).filter((id) => next.has(id)));
            }}
            className="mt-0.5"
          />
          <span className="whitespace-pre-wrap">{o.text}</span>
        </label>
      ))}
    </div>
  );
}

function CodingInput({
  question,
  value,
  onChange,
}: {
  question: RunnerQuestion;
  value: { language: Language; code: string } | undefined;
  onChange: (value: { language: Language; code: string }) => void;
}) {
  const offered = EXAM_LANGUAGES.filter((l) => question.starterCode[l] !== undefined);
  const languages = offered.length > 0 ? offered : [...EXAM_LANGUAGES];
  const language = value?.language ?? languages[0]!;
  const code = value?.code ?? question.starterCode[language] ?? "";
  const selectId = `${question.key}-language`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="text-sm font-medium">
          Language
        </label>
        <select
          id={selectId}
          value={language}
          onChange={(e) => {
            const next = e.target.value as Language;
            // Swap in the new starter unless the student has written code.
            const untouched = !value || value.code === question.starterCode[language];
            onChange({
              language: next,
              code: untouched ? (question.starterCode[next] ?? "") : code,
            });
          }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      <div className="h-80 overflow-hidden rounded-md border border-border">
        <CodeEditor
          language={language}
          value={code}
          onChange={(next) => onChange({ language, code: next })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Code does not run during the exam. After you submit it is checked against hidden
        tests if your college has code execution enabled; otherwise your instructor
        grades it.
      </p>
    </div>
  );
}
