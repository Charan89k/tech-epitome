import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Language } from "@/generated/prisma/enums";
import {
  outputMatches,
  type CodeExecutionService,
  type ExecutionRequest,
  type ExecutionResult,
  type TestResult,
} from "./types";

/**
 * Development executor: a plain subprocess with POSIX resource limits.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT A SANDBOX. Read this before deploying anything.
 *
 * What it does enforce:
 *   - CPU time      (RLIMIT_CPU, so a spin loop cannot hold a core)
 *   - Address space (RLIMIT_AS, so a runaway allocation cannot OOM the box)
 *   - Output size   (RLIMIT_FSIZE, so a print loop cannot fill the disk)
 *   - Wall clock    (SIGKILL after the deadline, covering sleeps and I/O waits)
 *   - A scratch directory per run, removed afterwards
 *
 * What it does NOT enforce, and cannot without root or a container runtime:
 *   - Network isolation. Submitted code CAN open sockets.
 *   - Filesystem isolation. It runs as the developer's own user and can read
 *     and write anything that user can, including this repository and
 *     ~/.ssh. The scratch directory is a convenience, not a boundary.
 *   - Process isolation. It shares the host PID and user namespace.
 *
 * Consequently this adapter is for a single trusted developer running their
 * own code on their own machine, and it refuses to start in production.
 * `DockerAdapter` is the one intended for untrusted input.
 * ---------------------------------------------------------------------------
 */

type LanguageSpec = {
  filename: string;
  /** Compile step, if the language needs one. */
  compile?: (dir: string) => { command: string; args: string[] };
  run: (dir: string, memoryMb: number) => { command: string; args: string[] };
  /**
   * How this language's memory ceiling is enforced.
   *
   *   "rlimit"  RLIMIT_AS is a good proxy for real usage. True of CPython and
   *             of native binaries, whose virtual size tracks their resident
   *             size closely.
   *   "runtime" The runtime reserves an enormous virtual address space up
   *             front regardless of what it will actually use - a 64-bit JVM
   *             reserves tens of gigabytes of VA, and V8 reserves a large
   *             heap cage. Applying RLIMIT_AS to those kills the process
   *             during startup, before any submitted code runs. For these the
   *             ceiling is imposed by the runtime's own heap flag instead.
   *
   * The trade-off is explicit: "runtime" enforcement bounds the managed heap,
   * not total process memory, so it is weaker than an OS limit. The container
   * adapter does not have this problem - a cgroup memory limit applies to
   * every language uniformly.
   */
  memoryEnforcement: "rlimit" | "runtime";
};

const SPECS: Partial<Record<Language, LanguageSpec>> = {
  PYTHON: {
    filename: "solution.py",
    // -I isolates from the user's site-packages and PYTHONPATH, so a stray
    // local module cannot change behaviour between machines.
    run: (dir) => ({ command: "python3", args: ["-I", join(dir, "solution.py")] }),
    memoryEnforcement: "rlimit",
  },
  JAVASCRIPT: {
    filename: "solution.js",
    run: (dir, memoryMb) => ({
      command: "node",
      args: [`--max-old-space-size=${memoryMb}`, join(dir, "solution.js")],
    }),
    memoryEnforcement: "runtime",
  },
  JAVA: {
    filename: "Main.java",
    compile: (dir) => ({
      command: "javac",
      args: ["-nowarn", "-d", dir, join(dir, "Main.java")],
    }),
    run: (dir, memoryMb) => ({
      command: "java",
      args: [
        "-XX:+UseSerialGC",
        "-Xss64m",
        `-Xmx${memoryMb}m`,
        "-cp",
        dir,
        "Main",
      ],
    }),
    memoryEnforcement: "runtime",
  },
  CPP: {
    filename: "solution.cpp",
    compile: (dir) => ({
      command: "g++",
      args: [
        "-std=c++20",
        "-O2",
        "-w",
        "-o",
        join(dir, "solution"),
        join(dir, "solution.cpp"),
      ],
    }),
    run: (dir) => ({ command: join(dir, "solution"), args: [] }),
    memoryEnforcement: "rlimit",
  },
};

type RunOutcome = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
};

export class LocalExecutionAdapter implements CodeExecutionService {
  readonly name = "local-subprocess (development only)";
  readonly isSandboxed = false;

  async isAvailable(): Promise<boolean> {
    return process.env.NODE_ENV !== "production";
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (process.env.NODE_ENV === "production") {
      // Belt and braces: the factory already refuses to select this adapter
      // in production, but an unsandboxed executor must never be one
      // mis-edited config away from running untrusted code on a server.
      throw new Error(
        "LocalExecutionAdapter is disabled in production. It provides no isolation."
      );
    }

    const spec = SPECS[request.language];
    if (!spec) {
      return failure(request, `${request.language} is not runnable locally.`);
    }

    // turbopackIgnore keeps the bundler from statically tracing this
    // path. Without it, a join() on a runtime value makes Turbopack
    // conservatively trace the entire project into the server output,
    // which bloats the deployment and can trip size limits.
    const dir = await mkdtemp(
      join(/* turbopackIgnore: true */ tmpdir(), "codeforge-run-")
    );
    const started = Date.now();

    try {
      // Same reason as the mkdtemp above: `dir` is a runtime temp path,
      // not a project file, so it must not drag the project into the trace.
      await writeFile(
        join(/* turbopackIgnore: true */ dir, spec.filename),
        request.program,
        "utf8"
      );

      if (spec.compile) {
        const compileStep = spec.compile(dir);
        const compiled = await this.runProcess(
          compileStep.command,
          compileStep.args,
          "",
          // Compilation gets its own, more generous budget: g++ and javac
          // routinely take longer than the program they produce. javac is
          // itself a JVM, so no address-space cap is applied here.
          { timeoutMs: 30_000, memoryMb: 0, cpuSeconds: 30, limitAddressSpace: false }
        );

        if (compiled.code !== 0) {
          return {
            status: "COMPILE_ERROR",
            passed: 0,
            total: request.tests.length,
            executionTimeMs: Date.now() - started,
            memoryKb: null,
            compileError: truncate(compiled.stderr || compiled.stdout),
            results: [],
          };
        }
      }

      const runStep = spec.run(dir, request.memoryLimitMb);
      const results: TestResult[] = [];

      for (const test of request.tests) {
        const outcome = await this.runProcess(
          runStep.command,
          runStep.args,
          test.input,
          {
            timeoutMs: request.timeLimitMs,
            memoryMb: request.memoryLimitMb,
            cpuSeconds: Math.max(1, Math.ceil(request.timeLimitMs / 1000)),
            limitAddressSpace: spec.memoryEnforcement === "rlimit",
          }
        );

        results.push(toTestResult(test, outcome));

        // Stop at the first hidden failure. The learner is told which case
        // number broke, and running the remaining cases tells them nothing
        // they can act on while costing real CPU.
        if (!test.isSample && results[results.length - 1]!.outcome !== "PASSED") {
          break;
        }
      }

      return summarise(request, results, Date.now() - started);
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {
        // A leftover temp directory is untidy, not incorrect.
      });
    }
  }

  /**
   * Spawns a process under `prlimit`, feeds it stdin, and kills it if it
   * outlives the wall clock.
   */
  private runProcess(
    command: string,
    args: string[],
    stdin: string,
    limits: {
      timeoutMs: number;
      memoryMb: number;
      cpuSeconds: number;
      limitAddressSpace: boolean;
    }
  ): Promise<RunOutcome> {
    return new Promise((resolve) => {
      const started = Date.now();

      // RLIMIT_CPU stops a busy loop; the wall-clock kill below covers
      // sleeping and blocking, which CPU time does not.
      const wrapped = [
        `--cpu=${limits.cpuSeconds}`,
        // See LanguageSpec.memoryEnforcement for why this is conditional.
        ...(limits.limitAddressSpace && limits.memoryMb > 0
          ? [`--as=${limits.memoryMb * 1024 * 1024}`]
          : []),
        `--fsize=${8 * 1024 * 1024}`,
        `--nofile=256`,
        "--",
        command,
        ...args,
      ];

      const child = spawn("prlimit", wrapped, {
        stdio: ["pipe", "pipe", "pipe"] as const,
        // A deliberately bare environment: no inherited secrets, and no
        // PATH-dependent surprises from the developer's shell. Cast because
        // ProcessEnv is declared with required keys this intentionally omits.
        env: {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          HOME: "/nonexistent",
          LANG: "C.UTF-8",
        } as unknown as NodeJS.ProcessEnv,
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, limits.timeoutMs);

      // Cap captured output so a print loop cannot exhaust server memory
      // before RLIMIT_FSIZE notices.
      const MAX_CAPTURE = 256 * 1024;
      child.stdout.on("data", (chunk: Buffer) => {
        if (stdout.length < MAX_CAPTURE) stdout += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk: Buffer) => {
        if (stderr.length < MAX_CAPTURE) stderr += chunk.toString("utf8");
      });

      const finish = (code: number | null, signal: NodeJS.Signals | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          code,
          signal,
          timedOut,
          durationMs: Date.now() - started,
        });
      };

      child.on("error", (error) => {
        stderr += `\n${error.message}`;
        finish(null, null);
      });
      child.on("close", finish);

      child.stdin.on("error", () => {
        // The program may exit without reading stdin; that is not an error.
      });
      child.stdin.end(stdin);
    });
  }
}

function toTestResult(
  test: ExecutionRequest["tests"][number],
  outcome: RunOutcome
): TestResult {
  const base = {
    testCaseId: test.id,
    isSample: test.isSample,
    runtimeMs: outcome.durationMs,
  };

  // Only sample cases carry their input and expected value back to the
  // client. Echoing a hidden case would turn the results panel into a way
  // to read the entire test suite.
  const visible = test.isSample
    ? {
        input: test.input,
        expected: test.expected,
        actual: truncate(outcome.stdout, 4000),
      }
    : {};

  if (outcome.timedOut) {
    return { ...base, ...visible, outcome: "TIMEOUT" };
  }

  // prlimit reports an exceeded RLIMIT_AS as a failed allocation, which
  // most runtimes surface as an out-of-memory message rather than a signal.
  if (
    outcome.signal === "SIGSEGV" ||
    /out of memory|OutOfMemoryError|std::bad_alloc|MemoryError/i.test(
      outcome.stderr
    )
  ) {
    return {
      ...base,
      ...visible,
      outcome: "MEMORY_LIMIT",
      stderr: truncate(outcome.stderr, 2000),
    };
  }

  if (outcome.code !== 0) {
    return {
      ...base,
      ...visible,
      outcome: "RUNTIME_ERROR",
      stderr: truncate(outcome.stderr, 2000),
    };
  }

  const passed = outputMatches(outcome.stdout, test.expected);
  return {
    ...base,
    ...visible,
    outcome: passed ? "PASSED" : "WRONG_ANSWER",
  };
}

export function summarise(
  request: ExecutionRequest,
  results: TestResult[],
  elapsedMs: number
): ExecutionResult {
  const passed = results.filter((r) => r.outcome === "PASSED").length;
  const firstFailure = results.find((r) => r.outcome !== "PASSED");

  const status = !firstFailure
    ? "ACCEPTED"
    : firstFailure.outcome === "TIMEOUT"
      ? "TIME_LIMIT_EXCEEDED"
      : firstFailure.outcome === "MEMORY_LIMIT"
        ? "MEMORY_LIMIT_EXCEEDED"
        : firstFailure.outcome === "RUNTIME_ERROR"
          ? "RUNTIME_ERROR"
          : "WRONG_ANSWER";

  return {
    status,
    passed,
    total: request.tests.length,
    executionTimeMs: elapsedMs,
    memoryKb: null,
    results,
  };
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

function truncate(value: string, max = 4000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n… output truncated`;
}
