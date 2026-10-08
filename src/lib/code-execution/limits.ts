/**
 * The resource ceilings for running learner code, in one place.
 *
 * Every adapter clamps what it asks for to these values, and the self-hosted
 * Judge0 enforces the same numbers server-side through its MAX_* settings
 * (infra/judge0/judge0.conf.template). The two are deliberately redundant: a
 * forged or buggy request is refused by whichever side sees it first, and
 * neither side trusts the other to have done it.
 *
 * Per-problem `timeLimitMs` and `memoryLimitMb` still apply, but only ever
 * downwards — a problem can ask for less than this, never more.
 */
export const EXECUTION_LIMITS = {
  /** CPU seconds per test case. */
  maxCpuSeconds: 5,
  /** Wall-clock seconds per test case, covering sleeps and blocking I/O. */
  maxWallSeconds: 10,
  maxMemoryMb: 256,
  maxStackKb: 64_000,
  /** Largest file a program may write, which on Judge0 includes stdout. */
  maxOutputKb: 1024,
  /** Bytes of stdout/stderr an in-process adapter captures before killing. */
  maxCaptureBytes: 1024 * 1024,
  /** Processes plus threads. The JVM alone starts ~20. */
  maxProcesses: 60,
  /** Test cases sent to Judge0 in one batch request (its own default cap). */
  maxBatchSize: 20,
} as const;

/**
 * How long an identical submit (same learner, problem, language and code) is
 * answered from the stored result instead of executing again. Long enough to
 * absorb a double click or a resubmit from a second tab, short enough that a
 * deliberate retry a minute later still runs.
 */
export const DUPLICATE_SUBMIT_WINDOW_MS = 15_000;

/** Limits for one custom Run input, checked before anything executes. */
export const CUSTOM_INPUT_LIMITS = {
  maxChars: 16_000,
  maxLines: 2_000,
  /** Largest count line accepted for a string[] or int[][] parameter. */
  maxCount: 1_000,
} as const;

export function clampCpuSeconds(timeLimitMs: number): number {
  const seconds = Math.max(1, timeLimitMs / 1000);
  return Math.min(seconds, EXECUTION_LIMITS.maxCpuSeconds);
}

export function clampWallSeconds(cpuSeconds: number): number {
  return Math.min(cpuSeconds * 2, EXECUTION_LIMITS.maxWallSeconds);
}

export function clampMemoryMb(memoryLimitMb: number): number {
  return Math.min(Math.max(16, memoryLimitMb), EXECUTION_LIMITS.maxMemoryMb);
}

/**
 * How an exceeded file-size limit shows up when the process survives it.
 *
 * Not every runtime dies of SIGXFSZ: CPython ignores the signal, so the
 * write fails with EFBIG ("File too large") and the program exits with an
 * exception instead. On Judge0, stdout is itself a file, so a Python print
 * loop ends exactly this way. Matching the error text is what turns that
 * into an output-limit verdict rather than a misleading runtime error.
 */
export const FILE_TOO_LARGE = /File too large|EFBIG|\[Errno 27\]/;

