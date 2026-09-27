"use client";

import { AlertCircle, Check, Clock, MemoryStick, ShieldAlert, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { RunOutcome } from "@/services/submissions";

const OUTCOME_LABEL: Record<string, string> = {
  PASSED: "Passed",
  WRONG_ANSWER: "Wrong answer",
  TIMEOUT: "Timed out",
  RUNTIME_ERROR: "Runtime error",
  MEMORY_LIMIT: "Out of memory",
};

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong answer",
  TIME_LIMIT_EXCEEDED: "Time limit exceeded",
  MEMORY_LIMIT_EXCEEDED: "Memory limit exceeded",
  RUNTIME_ERROR: "Runtime error",
  COMPILE_ERROR: "Compile error",
  INTERNAL_ERROR: "Something went wrong",
  QUEUED: "Queued",
  RUNNING: "Running",
};

/**
 * The results panel.
 *
 * Hidden cases show only their outcome. Their input and expected output are
 * stripped server-side, so a failing hidden case is reported as "hidden case
 * 7 failed" and nothing more — otherwise the panel would be a way to read
 * the whole test suite.
 */
export function TestResults({
  outcome,
  pending,
  mode,
}: {
  outcome: RunOutcome | null;
  pending: boolean;
  mode: "run" | "submit" | null;
}) {
  if (pending) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
        <span className="bg-ember-500 size-1.5 animate-pulse rounded-full" />
        {mode === "submit" ? "Running every test…" : "Running sample tests…"}
      </div>
    );
  }

  if (!outcome) {
    return (
      <EmptyState
        title="No results yet"
        description="Run your code against the sample tests, or submit to run the full suite."
        size="sm"
      />
    );
  }

  const { result, executor } = outcome;
  const accepted = result.status === "ACCEPTED";

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            className={cn(
              "border",
              accepted
                ? "border-success/35 bg-success/12 text-success"
                : "border-destructive/35 bg-destructive/12 text-destructive"
            )}
          >
            {STATUS_LABEL[result.status] ?? result.status}
          </Badge>

          <span className="text-muted-foreground text-xs tabular-nums">
            {result.passed}/{result.total} tests
          </span>

          <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
            <Clock className="size-3" aria-hidden="true" />
            {result.executionTimeMs} ms
          </span>

          {result.memoryKb !== null && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
              <MemoryStick className="size-3" aria-hidden="true" />
              {Math.round(result.memoryKb / 1024)} MB
            </span>
          )}
        </div>

        {!executor.sandboxed && (
          <p className="border-warning/30 bg-warning/6 text-warning flex items-start gap-2 rounded-md border p-2.5 text-[0.7rem] leading-relaxed">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Running via <code className="font-mono">{executor.name}</code>, which
            provides no isolation. Development only.
          </p>
        )}

        {result.compileError && (
          <div className="border-destructive/30 bg-destructive/6 rounded-md border p-3">
            <p className="text-destructive flex items-center gap-1.5 text-xs font-semibold">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              Compile error
            </p>
            <pre className="text-muted-foreground mt-2 max-w-full overflow-x-auto font-mono text-[0.7rem] leading-relaxed break-words whitespace-pre-wrap">
              {result.compileError}
            </pre>
          </div>
        )}

        <ul className="space-y-2">
          {result.results.map((test, index) => {
            const passed = test.outcome === "PASSED";

            return (
              <li
                key={test.testCaseId}
                className={cn(
                  "rounded-md border p-3",
                  passed
                    ? "border-border bg-card"
                    : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="flex items-center gap-2">
                  {passed ? (
                    <Check className="text-success size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <X className="text-destructive size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-xs font-medium">
                    {test.isSample ? `Sample ${index + 1}` : `Hidden case ${index + 1}`}
                  </span>
                  <span
                    className={cn(
                      "text-[0.68rem]",
                      passed ? "text-muted-foreground" : "text-destructive"
                    )}
                  >
                    {OUTCOME_LABEL[test.outcome] ?? test.outcome}
                  </span>
                  <span className="text-muted-foreground ml-auto text-[0.68rem] tabular-nums">
                    {test.runtimeMs} ms
                  </span>
                </div>

                {/* Only sample cases carry their data back to the client. */}
                {test.input !== undefined && (
                  <dl className="mt-2.5 space-y-1.5">
                    <Row label="Input" value={test.input} />
                    <Row label="Expected" value={test.expected ?? ""} />
                    <Row
                      label="Your output"
                      value={test.actual ?? ""}
                      tone={passed ? undefined : "bad"}
                    />
                  </dl>
                )}

                {test.stderr && (
                  <pre className="text-muted-foreground mt-2 max-h-40 overflow-auto font-mono text-[0.68rem] leading-relaxed whitespace-pre-wrap">
                    {test.stderr}
                  </pre>
                )}

                {!test.isSample && !passed && (
                  <p className="text-muted-foreground mt-2 text-[0.68rem]">
                    Hidden cases do not show their input. Re-read the constraints
                    and think about which edge case this might be.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </ScrollArea>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bad";
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2">
      <dt className="text-muted-foreground text-[0.68rem]">{label}</dt>
      <dd
        className={cn(
          "overflow-x-auto font-mono text-[0.7rem] whitespace-pre-wrap",
          tone === "bad" ? "text-destructive" : "text-foreground"
        )}
      >
        {value === "" ? <span className="text-muted-foreground/50">(empty)</span> : value}
      </dd>
    </div>
  );
}
