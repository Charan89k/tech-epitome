import type { Language, SubmissionStatus } from "@/generated/prisma/enums";

/**
 * The contract between the application and whatever actually runs code.
 *
 * Nothing above this layer knows whether execution happens in a subprocess,
 * a container, or a remote service - which is the point: the development
 * adapter and the production adapter are not interchangeable in terms of
 * safety, and the application must not encode assumptions about either.
 */

export type ExecutionTestCase = {
  id: string;
  input: string;
  expected: string;
  /** Sample cases may have their input shown to the learner; hidden ones must not. */
  isSample: boolean;
};

export type ExecutionRequest = {
  language: Language;
  /** The learner's code, already spliced into its harness. */
  program: string;
  tests: ExecutionTestCase[];
  /** Wall-clock budget per test case. */
  timeLimitMs: number;
  memoryLimitMb: number;
};

export type TestOutcome =
  | "PASSED"
  | "WRONG_ANSWER"
  | "TIMEOUT"
  | "RUNTIME_ERROR"
  | "MEMORY_LIMIT";

export type TestResult = {
  testCaseId: string;
  isSample: boolean;
  outcome: TestOutcome;
  runtimeMs: number;
  /** Populated for sample cases only; hidden inputs never reach the client. */
  input?: string;
  expected?: string;
  actual?: string;
  stderr?: string;
};

export type ExecutionResult = {
  status: SubmissionStatus;
  passed: number;
  total: number;
  /** Total wall-clock across all cases. */
  executionTimeMs: number;
  /** Peak observed, in kilobytes. Null when the adapter cannot measure it. */
  memoryKb: number | null;
  /** Compiler output, when compilation failed. */
  compileError?: string;
  results: TestResult[];
};

export interface CodeExecutionService {
  /** Human-readable adapter name, surfaced in the results panel. */
  readonly name: string;
  /**
   * Whether this adapter provides real isolation. The UI shows a warning
   * when it does not, so nobody mistakes the development executor for a
   * sandbox.
   */
  readonly isSandboxed: boolean;
  /** Whether the adapter can run at all in this environment. */
  isAvailable(): Promise<boolean>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

/**
 * Compares produced output with expected output.
 *
 * Trailing whitespace on each line and trailing blank lines are ignored,
 * because they are an artefact of how a language's print function terminates
 * output, not a property of the answer. Everything else must match exactly.
 */
export function outputMatches(actual: string, expected: string): boolean {
  return normaliseOutput(actual) === normaliseOutput(expected);
}

export function normaliseOutput(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}
