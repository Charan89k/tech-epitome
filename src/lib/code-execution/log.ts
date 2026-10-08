import "server-only";

import type { Language, SubmissionStatus } from "@/generated/prisma/enums";

/**
 * One structured line per code execution.
 *
 * Written as a single JSON object to stdout, which Vercel's log drain keeps
 * as a searchable record: `event:"code_execution"` finds every run, and
 * `executionId` ties a learner's report to a line.
 *
 * What is deliberately absent: the learner's code, their custom input, any
 * test input or expected output (hidden or not), stderr, and anything from
 * the environment. The fields below are the whole schema — there is no
 * free-form "details" bag for something sensitive to slip into later.
 */

export type ExecutionMode = "run" | "custom" | "submit";

export type ExecutionLogEntry = {
  executionId: string;
  /** Internal user id; "anonymous" for a signed-out Run. Never an IP. */
  userId: string;
  problemId: string;
  language: Language;
  mode: ExecutionMode;
  provider: string;
  status: SubmissionStatus | "EXCEPTION";
  durationMs: number;
  memoryKb: number | null;
  testCount: number;
  /** True when a duplicate submit was answered from the stored result. */
  deduplicated?: boolean;
};

export type FailureCategory =
  | "none"
  | "wrong_answer"
  | "compile"
  | "runtime"
  | "timeout"
  | "memory"
  | "output_limit"
  | "provider"
  | "exception";

export function failureCategory(status: ExecutionLogEntry["status"]): FailureCategory {
  switch (status) {
    case "ACCEPTED":
      return "none";
    case "WRONG_ANSWER":
      return "wrong_answer";
    case "COMPILE_ERROR":
      return "compile";
    case "RUNTIME_ERROR":
      return "runtime";
    case "TIME_LIMIT_EXCEEDED":
      return "timeout";
    case "MEMORY_LIMIT_EXCEEDED":
      return "memory";
    case "OUTPUT_LIMIT_EXCEEDED":
      return "output_limit";
    case "EXCEPTION":
      return "exception";
    default:
      // INTERNAL_ERROR, QUEUED, RUNNING: the executor did not give a verdict.
      return "provider";
  }
}

export function logExecution(entry: ExecutionLogEntry): void {
  console.info(
    JSON.stringify({
      event: "code_execution",
      at: new Date().toISOString(),
      executionId: entry.executionId,
      userId: entry.userId,
      problemId: entry.problemId,
      language: entry.language,
      mode: entry.mode,
      provider: entry.provider,
      status: entry.status,
      failure: failureCategory(entry.status),
      durationMs: entry.durationMs,
      memoryKb: entry.memoryKb,
      testCount: entry.testCount,
      deduplicated: entry.deduplicated ?? false,
    })
  );
}
