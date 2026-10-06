import "server-only";

import type { Language } from "@/generated/prisma/enums";
import { summarise } from "./local-adapter";
import {
  outputMatches,
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
 * run (isolate: namespaces, cgroups, seccomp) on its own machines. One
 * adapter serves every way of reaching Judge0; only configuration changes:
 *
 *   public CE        CODE_EXECUTION_API_URL=https://ce.judge0.com, no key.
 *                    Free and rate limited — fine to launch on, not to scale on.
 *   RapidAPI         URL on *.rapidapi.com plus the RapidAPI key; sent as
 *                    X-RapidAPI-Key / X-RapidAPI-Host.
 *   self-hosted      your instance's URL plus its AUTHN token, sent as
 *                    X-Auth-Token.
 *
 * All of a request's tests go up as one batch and are polled together, so a
 * submit costs two or three round trips rather than one per test. Hidden
 * test inputs are sent to the Judge0 host — unavoidable when it runs them —
 * but never returned to the learner: only sample cases carry their input,
 * expected and actual output back.
 */

/** Judge0 CE 1.14 language ids, newest runtime of each. */
const LANGUAGE_ID: Partial<Record<Language, number>> = {
  PYTHON: 113, // Python 3.14.0
  JAVASCRIPT: 102, // Node.js 22.08.0
  JAVA: 91, // JDK 17.0.6
  CPP: 105, // GCC 14.1.0
};

// Judge0 status ids. 1 and 2 are still in progress.
const IN_QUEUE = 1;
const PROCESSING = 2;
const TIME_LIMIT = 5;
const COMPILE_ERROR = 6;
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
  /** Injectable for tests. */
  fetch?: typeof fetch;
};

export class Judge0ExecutionAdapter implements CodeExecutionService {
  readonly name = "judge0";
  readonly isSandboxed = true;

  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly fetcher: typeof fetch;

  constructor(config: Judge0Config) {
    this.base = config.url.replace(/\/+$/, "");
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
    const languageId = LANGUAGE_ID[request.language];
    if (!languageId) {
      return failure(
        request,
        `${request.language} is not supported by the execution service.`
      );
    }
    if (request.tests.length === 0) return summarise(request, [], 0);

    const started = Date.now();
    // Judge0 takes seconds and kilobytes; it applies the limit per test.
    const cpuSeconds = Math.max(1, request.timeLimitMs / 1000);
    const submissions = request.tests.map((test) => ({
      language_id: languageId,
      source_code: encode(request.program),
      stdin: encode(test.input),
      cpu_time_limit: cpuSeconds,
      wall_time_limit: cpuSeconds * 3,
      memory_limit: request.memoryLimitMb * 1024,
      // The JVM and V8 reserve address space far beyond what they use; let
      // Judge0 enforce memory on the process tree rather than per thread.
      enable_per_process_and_thread_memory_limit: false,
      enable_per_process_and_thread_time_limit: false,
    }));

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
      if (response.status === 429) {
        return failure(
          request,
          "The code runner is busy right now. Please try again in a minute."
        );
      }
      if (!response.ok) {
        return failure(
          request,
          `The code runner refused the request (HTTP ${response.status}).`
        );
      }
      const created = (await response.json()) as { token?: string; error?: string }[];
      if (created.some((item) => !item.token)) {
        return failure(request, "The code runner could not accept this submission.");
      }
      tokens = created.map((item) => item.token!);
    } catch {
      return failure(
        request,
        "The code runner could not be reached. Please try again."
      );
    }

    const finished = await this.poll(tokens);
    if (!finished) {
      return failure(
        request,
        "The code runner took too long to respond. Please try again."
      );
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
          ? { input: test.input, expected: test.expected, actual: truncate(stdout) }
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
  expected: string
): TestOutcome {
  if (result.status.id === TIME_LIMIT) return "TIMEOUT";
  // 3 Accepted and 4 Wrong Answer both mean "ran to completion": Judge0 is
  // not given the expected output, so the comparison is always ours.
  if (result.status.id === 3 || result.status.id === 4) {
    return outputMatches(stdout, expected) ? "PASSED" : "WRONG_ANSWER";
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
