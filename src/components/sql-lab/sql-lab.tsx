"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Loader2, Play, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compareRows, type Comparison } from "@/lib/sql-lab/compare";
import { LIBRARY_SCHEMA, SCHEMA_QUERY, STARTER_QUERY } from "@/lib/sql-lab/dataset";
import { SQL_EXERCISES, type SqlExercise } from "@/lib/sql-lab/exercises";
import { SqlEngine, SqlTimeoutError, type SqlResult } from "@/lib/sql-lab/runner";

const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> }
);

const SOLVED_KEY = "tech-epitome:sql-solved";
const ROWS_SHOWN = 200;

type EngineStatus = "loading" | "ready" | "failed";
type TableSchema = { name: string; columns: string[] };

function loadSolved(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(SOLVED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function toSchema(result: SqlResult | undefined): TableSchema[] {
  const tables = new Map<string, string[]>();
  for (const [table, column, type] of result?.rows ?? []) {
    const columns = tables.get(table!) ?? [];
    tables.set(table!, [...columns, `${column} ${type}`]);
  }
  return [...tables].map(([name, columns]) => ({ name, columns }));
}

const lastWithColumns = (results: SqlResult[]) =>
  results.findLast((result) => result.fields.length > 0);

function ResultTable({ result }: { result: SqlResult }) {
  const shown = result.rows.slice(0, ROWS_SHOWN);
  return (
    <div>
      <p role="status" className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
        {result.rows.length > ROWS_SHOWN ? `, showing the first ${ROWS_SHOWN}` : ""}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-y border-border bg-muted/40">
              {result.fields.map((field, index) => (
                <th key={index} scope="col" className="px-3 py-1.5 font-medium">
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, index) => (
                  <td key={index} className="px-3 py-1.5 whitespace-nowrap">
                    {value ?? <span className="text-muted-foreground">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A real PostgreSQL in the learner's browser, so no query ever reaches a server. */
export function SqlLab() {
  const engine = useRef<SqlEngine | null>(null);
  const [status, setStatus] = useState<EngineStatus>("loading");
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [sql, setSql] = useState(STARTER_QUERY);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SqlResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exercise, setExercise] = useState<SqlExercise | null>(null);
  const [verdict, setVerdict] = useState<Comparison | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);

  const boot = useCallback(async () => {
    const next = engine.current ?? new SqlEngine();
    engine.current = next;
    setStatus("loading");
    try {
      await next.start(LIBRARY_SCHEMA);
      setSchema(toSchema((await next.run(SCHEMA_QUERY))[0]));
      setStatus("ready");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    const next = new SqlEngine();
    engine.current = next;
    // Read here, not in the initial state, so the server's render still matches.
    void Promise.resolve().then(() => {
      setSolved(loadSolved());
      return boot();
    });
    return () => next.stop();
  }, [boot]);

  async function attempt(work: (current: SqlEngine) => Promise<void>) {
    if (!engine.current || status !== "ready" || running) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    setVerdict(null);
    try {
      await work(engine.current);
    } catch (caught) {
      setResults(null);
      if (caught instanceof SqlTimeoutError) {
        await boot();
        setNotice(
          "That query ran for over 10 seconds, so it was stopped. The data is back to its starting state."
        );
      } else {
        setError(caught instanceof Error ? caught.message : "The query failed.");
      }
    } finally {
      setRunning(false);
    }
  }

  const run = () =>
    attempt(async (current) => {
      setResults(await current.run(sql));
    });

  const check = (target: SqlExercise) =>
    attempt(async (current) => {
      const answer = await current.run(sql);
      setResults(answer);
      const expected = await current.run(target.solution);
      const outcome = compareRows(
        lastWithColumns(answer)?.rows ?? [],
        lastWithColumns(expected)?.rows ?? [],
        target.ordered
      );
      setVerdict(outcome);
      if (outcome.correct && !solved.includes(target.id)) {
        const next = [...solved, target.id];
        setSolved(next);
        try {
          window.localStorage.setItem(SOLVED_KEY, JSON.stringify(next));
        } catch {
          // Losing the tick is a minor inconvenience; the answer still checked.
        }
      }
    });

  const reset = () =>
    attempt(async () => {
      setResults(null);
      await boot();
      setNotice("The data is back to its starting state.");
    });

  function choose(next: SqlExercise) {
    setExercise(next);
    setVerdict(null);
    setShowAnswer(false);
    setSql("");
  }

  // Capture phase, because Monaco claims Ctrl+Enter for itself. No dependency
  // list: `run` closes over the current query, so it must never go stale.
  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopPropagation();
      void run();
    }
    window.addEventListener("keydown", onShortcut, true);
    return () => window.removeEventListener("keydown", onShortcut, true);
  });

  const shown = results ? lastWithColumns(results) : null;
  const ready = status === "ready" && !running;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <section aria-labelledby="exercises-heading">
          <h2 id="exercises-heading" className="text-sm font-semibold">
            Exercises{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {solved.length}/{SQL_EXERCISES.length}
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ticks are saved in this browser only.
          </p>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {SQL_EXERCISES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  aria-current={exercise?.id === item.id ? "true" : undefined}
                  className="flex min-h-11 w-full items-center gap-2 py-2 text-left text-sm transition-colors outline-none hover:text-brand-300 focus-visible:ring-2 focus-visible:ring-ring aria-current:font-semibold"
                >
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.group}</span>
                  {solved.includes(item.id) && (
                    <Check className="size-4 text-success" aria-label="Solved" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="schema-heading">
          <h2 id="schema-heading" className="text-sm font-semibold">
            Tables
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            An invented lending library.
          </p>
          {schema.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Shown once the database is running.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {schema.map((table) => (
                <li key={table.name}>
                  <details>
                    <summary className="cursor-pointer font-mono text-xs">
                      {table.name}
                    </summary>
                    <ul className="mt-1 ml-3 space-y-0.5 font-mono text-[0.7rem] text-muted-foreground">
                      {table.columns.map((column) => (
                        <li key={column}>{column}</li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="min-w-0 space-y-4">
        {exercise && (
          <section
            aria-labelledby="exercise-title"
            className="rounded-lg border border-border bg-card p-4"
          >
            <h2 id="exercise-title" className="text-sm font-semibold">
              {exercise.title}
            </h2>
            <p className="mt-1 text-sm">{exercise.prompt}</p>
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Hint</summary>
              <p className="mt-1">{exercise.hint}</p>
            </details>
            {showAnswer ? (
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
                {exercise.solution}
              </pre>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-0"
                onClick={() => setShowAnswer(true)}
              >
                Show the answer
              </Button>
            )}
          </section>
        )}

        <div className="dark overflow-hidden rounded-lg border border-border bg-background text-foreground">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
            <Button
              size="sm"
              className="h-8"
              onClick={() => void run()}
              disabled={!ready}
            >
              {running ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )}
              Run
            </Button>
            {exercise && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => void check(exercise)}
                disabled={!ready}
              >
                <Check className="size-3.5" aria-hidden="true" />
                Check answer
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-8"
              onClick={() => void reset()}
              disabled={!ready}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset data
            </Button>
          </div>
          <div className="h-56">
            <CodeEditor language="SQL" value={sql} onChange={setSql} theme="dark" />
          </div>
          <p className="border-t border-border px-3 py-1.5 text-[0.65rem] text-muted-foreground">
            Ctrl+Enter runs. Tab moves focus out of the editor; Ctrl+M lets Tab indent.
          </p>
        </div>

        {verdict && (
          <Alert variant={verdict.correct ? "default" : "destructive"}>
            <AlertTitle>{verdict.correct ? "Correct" : "Not yet"}</AlertTitle>
            {!verdict.correct && <AlertDescription>{verdict.reason}</AlertDescription>}
          </Alert>
        )}

        <section
          aria-labelledby="output-heading"
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <h2
            id="output-heading"
            className="border-b border-border px-3 py-2 text-xs font-medium"
          >
            Output
          </h2>
          {status === "loading" && (
            <p
              role="status"
              className="flex items-center gap-2 p-4 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Starting PostgreSQL in your browser. The first time downloads about 16 MB.
            </p>
          )}
          {status === "failed" && (
            <div className="space-y-3 p-4">
              <p role="alert" className="text-sm">
                The database could not start. It downloads from a public CDN, so check
                your connection or any content blocker.
              </p>
              <Button size="sm" variant="outline" onClick={() => void boot()}>
                Try again
              </Button>
            </div>
          )}
          {status === "ready" && (
            <>
              {notice && (
                <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
                  {notice}
                </p>
              )}
              {error && (
                <pre
                  role="alert"
                  className="overflow-x-auto p-3 font-mono text-xs whitespace-pre-wrap text-destructive"
                >
                  {error}
                </pre>
              )}
              {!error && !notice && !results && (
                <p className="p-4 text-sm text-muted-foreground">
                  Run a query to see its rows here.
                </p>
              )}
              {!error && results && !shown && (
                <p role="status" className="p-4 text-sm text-muted-foreground">
                  Done. {results.at(-1)?.affectedRows ?? 0} rows changed.
                </p>
              )}
              {!error && shown && <ResultTable result={shown} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
