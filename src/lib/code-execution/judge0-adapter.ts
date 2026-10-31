import "server-only";

import type { Language } from "@/generated/prisma/enums";
import {
  clampCpuSeconds,
  clampMemoryMb,
  clampWallSeconds,
  EXECUTION_LIMITS,
  FILE_TOO_LARGE,
} from "./limits";
import { summarise } from "./local-adapter";
import {
  judgeOutput,
  type CodeExecutionService,
  type ExecutionRequest,
  type ExecutionResult,
  type TestOutcome,
  type TestResult,
} from "./types";

/**
 * Executes code on a Judge0 server — the `remote` driver.
 *
 * Serverless hosts have no container runtime and must never run submitted
 * code in-process, so production delegates to Judge0, which sandboxes each
 * run with isolate on its own machines: mount, PID, IPC and network
 * namespaces, a per-box uid, cgroup and rlimit resource limits. isolate does
 * no general syscall filtering (no seccomp policy), so the kernel is part of
 * the attack surface and the Judge0 host is the real security boundary;
 * infra/judge0 treats it as disposable for exactly that reason. One
 * adapter serves every way of reaching Judge0; only configuration changes:
 *
 *   public CE        CODE_EXECUTION_API_URL=https://ce.judge0.com, no key.
 *                    Free and rate limited — fine to launch on, not to scale on.
 *   RapidAPI         URL on *.rapidapi.com plus the RapidAPI key; sent as
 *                    X-RapidAPI-Key / X-RapidAPI-Host.
 *   self-hosted      your instance's URL plus its AUTHN token, sent as
 *                    X-Auth-Token.
 *
 * Language ids differ between Judge0 installations, so they are
 * configuration (JUDGE0_LANGUAGE_IDS), defaulting to the public server's.
 *
 * Limits are clamped to EXECUTION_LIMITS on every request, and networking is
 * explicitly refused per submission. A self-hosted server enforces the same
 * ceilings itself (MAX_* and ALLOW_ENABLE_NETWORK=false), so neither side
 * relies on the other.
 *
 * All of a request's tests go up in batches of at most
 * EXECUTION_LIMITS.maxBatchSize and are polled together, so a submit costs
 * two or three round trips rather than one per test. Hidden
 * test inputs are sent to the Judge0 host — unavoidable when it runs them —
 * but never returned to the learner: only sample cases carry their input,
 * expected and actual output back.
 */

export type Judge0LanguageIds = Partial<Record<Language, number>>;

/**
 * The public server's (ce.judge0.com) ids, newest runtime of each. Used only
 * when JUDGE0_LANGUAGE_IDS is unset; a self-hosted image has its own.
 */
export const PUBLIC_JUDGE0_LANGUAGE_IDS: Judge0LanguageIds = {
  PYTHON: 113, // Python 3.14.0
  JAVASCRIPT: 102, // Node.js 22.08.0
  JAVA: 91, // JDK 17.0.6
  CPP: 105, // GCC 14.1.0
};

/**
 * Parses "PYTHON:71,JAVASCRIPT:63,JAVA:62,CPP:54".
 *
 * Throws on anything malformed rather than guessing: a wrong id silently
 * runs the learner's code under a different language.
 */
export function parseJudge0LanguageIds(value: string): Judge0LanguageIds {
  const ids: Judge0LanguageIds = {};
  for (const pair of value.split(",").map((part) => part.trim()).filter(Boolean)) {
    const match = /^(PYTHON|JAVASCRIPT|JAVA|CPP):(\d{1,6})$/.exec(pair);
    if (!match) {
      throw new Error(
        `JUDGE0_LANGUAGE_IDS entry "${pair}" is not LANGUAGE:id (PYTHON, JAVASCRIPT, JAVA or CPP).`
      );
    }
    ids[match[1] as Language] = Number(match[2]);
  }
  return ids;
}

// Judge0 status ids. 1 and 2 are still in progress.
const IN_QUEUE = 1;
const PROCESSING = 2;
const TIME_LIMIT = 5;
const COMPILE_ERROR = 6;
/** Runtime Error (SIGXFSZ): wrote past max_file_size. stdout is a file there. */
const FILE_SIZE_EXCEEDED = 8;
const INTERNAL_ERROR = 13;
const EXEC_FORMAT_ERROR = 14;

/** Polling budget for one batch. Vercel functions allow far longer. */
const POLL_DEADLINE_MS = 45_000;
const POLL_INTERVAL_MS = 700;

type Judge0Result = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: { id: number; description: string };
};

export type Judge0Config = {
  url: string;
  key?: string;
  /** Defaults to PUBLIC_JUDGE0_LANGUAGE_IDS. */
  languageIds?: Judge0LanguageIds;
  /** Injectable for tests. */
  fetch?: typeof fetch;
};

export class Judge0ExecutionAdapter implements CodeExecutionService {
  readonly name = "judge0";
  readonly isSandboxed = true;

  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly fetcher: typeof fetch;
  private readonly languageIds: Judge0LanguageIds;

  constructor(config: Judge0Config) {
    this.base = config.url.replace(/\/+$/, "");
    this.languageIds = config.languageIds ?? PUBLIC_JUDGE0_LANGUAGE_IDS;
    this.fetcher = config.fetch ?? fetch;
    const host = new URL(this.base).host;
    this.headers = { "content-type": "application/json" };
    if (config.key) {
      if (host.endsWith("rapidapi.com")) {
        this.headers["x-rapidapi-key"] = config.key;
        this.headers["x-rapidapi-host"] = host;
      } else {
        this.headers["x-auth-token"] = config.key;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetcher(`${this.base}/about`, {
        headers: this.headers,
        signal: AbortSignal.timeout(5_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const languageId = this.languageIds[request.language];
    if (!languageId) {
      return failure(
        request,
        `${request.language} is not supported by the execution service.`
      );
    }
    if (request.tests.length === 0) return summarise(request, [], 0);

    const started = Date.now();
    // Judge0 takes seconds and kilobytes; it applies the limit per test.
    // Clamped here so no problem record, bug or forged call can ask the
    // server for more than EXECUTION_LIMITS allows.
    const cpuSeconds = clampCpuSeconds(request.timeLimitMs);
    const submissions = request.tests.map((test) => ({
      language_id: languageId,
      source_code: encode(request.program),
      stdin: encode(test.input),
      cpu_time_limit: cpuSeconds,
      wall_time_limit: clampWallSeconds(cpuSeconds),
      memory_limit: clampMemoryMb(request.memoryLimitMb) * 1024,
      stack_limit: EXECUTION_LIMITS.maxStackKb,
      max_file_size: EXECUTION_LIMITS.maxOutputKb,
      max_processes_and_or_threads: EXECUTION_LIMITS.maxProcesses,
      enable_network: false,
      // The JVM and V8 reserve address space far beyond what they use; let
      // Judge0 enforce memory on the process tree rather than per thread.
      enable_per_process_and_thread_memory_limit: false,
      enable_per_process_and_thread_time_limit: false,
    }));

    const finished: Judge0Result[] = [];
    for (let i = 0; i < submissions.length; i += EXECUTION_LIMITS.maxBatchSize) {
      const chunk = await this.runBatch(
        submissions.slice(i, i + EXECUTION_LIMITS.maxBatchSize)
      );
      if (typeof chunk === "string") return failure(request, chunk);
      finished.push(...chunk);
    }

    // A compile error is the same for every test; report it once.
    const compile = finished.find((result) => result.status.id === COMPILE_ERROR);
    if (compile) {
      return {
        status: "COMPILE_ERROR",
        passed: 0,
        total: request.tests.length,
        executionTimeMs: Date.now() - started,
        memoryKb: null,
        compileError: truncate(
          decode(compile.compile_output) || decode(compile.stderr)
        ),
        results: [],
      };
    }

    if (
      finished.some(
        (r) => r.status.id === INTERNAL_ERROR || r.status.id === EXEC_FORMAT_ERROR
      )
    ) {
      return failure(
        request,
        "The code runner hit an internal error. Please try again."
      );
    }

    const results: TestResult[] = [];
    let peakMemory = 0;
    for (const [index, test] of request.tests.entries()) {
      const result = finished[index]!;
      const stdout = decode(result.stdout);
      const stderr = decode(result.stderr) || decode(result.message);
      peakMemory = Math.max(peakMemory, result.memory ?? 0);

      const outcome = classify(result, stdout, stderr, test.expected);
      results.push({
        testCaseId: test.id,
        isSample: test.isSample,
        outcome,
        runtimeMs: Math.round(Number(result.time ?? 0) * 1000),
        ...(test.isSample
          ? {
              input: test.input,
              ...(test.expected !== null ? { expected: test.expected } : {}),
              actual: truncate(stdout),
            }
          : {}),
        // stderr is learner-visible only for sample cases, matching the
        // other adapters: a hidden case's error can quote its input.
        ...(outcome === "RUNTIME_ERROR" && test.isSample
          ? { stderr: truncate(stderr, 2000) }
          : {}),
      });

      // Same rule as the container adapter: stop reporting at the first
      // failing hidden case, so failures cannot be used to map hidden tests.
      if (!test.isSample && outcome !== "PASSED") break;
    }

    const summary = summarise(request, results, Date.now() - started);
    return { ...summary, memoryKb: peakMemory || null };
  }

  /** Creates one batch and waits for it. A string is the learner-facing failure. */
  private async runBatch(
    submissions: Record<string, unknown>[]
  ): Promise<Judge0Result[] | string> {
    let tokens: string[];
    try {
      const response = await this.fetcher(
        `${this.base}/submissions/batch?base64_encoded=true`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ submissions }),
          signal: AbortSignal.timeout(15_000),
        }
      );
      if (response.status === 429 || response.status === 503) {
        return "The code runner is busy right now. Please try again in a minute.";
      }
      if (!response.ok) {
        return `The code runner refused the request (HTTP ${response.status}).`;
      }
      const created = (await response.json()) as { token?: string; error?: string }[];
      if (created.length !== submissions.length || created.some((item) => !item.token)) {
        return "The code runner could not accept this submission.";
      }
      tokens = created.map((item) => item.token!);
    } catch {
      return "The code runner could not be reached. Please try again.";
    }

    const finished = await this.poll(tokens);
    return finished ?? "The code runner took too long to respond. Please try again.";
  }

  private async poll(tokens: string[]): Promise<Judge0Result[] | null> {
    const deadline = Date.now() + POLL_DEADLINE_MS;
    const query = new URLSearchParams({
      tokens: tokens.join(","),
      base64_encoded: "true",
      fields: "stdout,stderr,compile_output,message,time,memory,status",
    });
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const response = await this.fetcher(`${this.base}/submissions/batch?${query}`, {
          headers: this.headers,
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) continue;
        const { submissions } = (await response.json()) as {
          submissions: Judge0Result[];
        };
        const pending = submissions.some(
          (s) => s.status.id === IN_QUEUE || s.status.id === PROCESSING
        );
        if (!pending) return submissions;
      } catch {
        // A dropped poll is retried until the deadline.
      }
    }
    return null;
  }
}

function classify(
  result: Judge0Result,
  stdout: string,
  stderr: string,
  expected: string | null
): TestOutcome {
  if (result.status.id === TIME_LIMIT) return "TIMEOUT";
  if (result.status.id === FILE_SIZE_EXCEEDED) return "OUTPUT_LIMIT";
  // A runtime that ignores SIGXFSZ (CPython) exits on EFBIG instead.
  if (result.status.id >= 7 && result.status.id <= 12 && FILE_TOO_LARGE.test(stderr)) {
    return "OUTPUT_LIMIT";
  }
  // 3 Accepted and 4 Wrong Answer both mean "ran to completion": Judge0 is
  // not given the expected output, so the comparison is always ours.
  if (result.status.id === 3 || result.status.id === 4) {
    return judgeOutput(stdout, expected);
  }
  if (/MemoryError|OutOfMemoryError|bad_alloc|heap out of memory/i.test(stderr)) {
    return "MEMORY_LIMIT";
  }
  // 7–12: signals and non-zero exits.
  return "RUNTIME_ERROR";
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string | null): string {
  return value ? Buffer.from(value, "base64").toString("utf8") : "";
}

function truncate(value: string, max = 4000): string {
  return value.length > max ? `${value.slice(0, max)}\n…(truncated)` : value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failure(request: ExecutionRequest, message: string): ExecutionResult {
  return {
    status: "INTERNAL_ERROR",
    passed: 0,
    total: request.tests.length,
    executionTimeMs: 0,
    memoryKb: null,
    compileError: message,
    results: [],
  };
}
