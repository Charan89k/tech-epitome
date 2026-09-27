import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Language } from "@/generated/prisma/enums";
import { summarise } from "./local-adapter";
import {
  outputMatches,
  type CodeExecutionService,
  type ExecutionRequest,
  type ExecutionResult,
  type TestResult,
} from "./types";

/**
 * Container executor: one throwaway container per run.
 *
 * This is the adapter intended for untrusted input. Every flag below is a
 * control the local adapter cannot provide:
 *
 *   --network=none        no sockets at all, in or out
 *   --read-only           the image filesystem cannot be modified
 *   --tmpfs /work         a small writable scratch mount, noexec where the
 *                         language does not need to produce a binary
 *   --memory / --memory-swap  a hard RSS ceiling, swap disabled so the limit
 *                         is real rather than deferred to disk
 *   --cpus                a CPU share, so one submission cannot starve others
 *   --pids-limit          fork bombs terminate instead of exhausting the host
 *   --cap-drop=ALL        no capabilities
 *   --security-opt no-new-privileges  setuid binaries cannot escalate
 *   --user 65534:65534    runs as nobody, never root
 *
 * Status: implemented, but NOT yet exercised - the development machine this
 * was built on had no Docker daemon access. It is wired up and selectable via
 * CODE_EXECUTION_DRIVER=docker, and `isAvailable()` probes the daemon so a
 * misconfiguration surfaces as a clear message rather than a hang. Treat it
 * as unverified until it has run against a real daemon; see README
 * "Known limitations".
 */

type ContainerSpec = {
  image: string;
  filename: string;
  /** Shell run inside the container. Compilation and execution both happen there. */
  command: (timeoutSeconds: number) => string;
};

const SPECS: Partial<Record<Language, ContainerSpec>> = {
  PYTHON: {
    image: "python:3.13-alpine",
    filename: "solution.py",
    command: (t) => `timeout -s KILL ${t} python3 -I /work/solution.py`,
  },
  JAVASCRIPT: {
    image: "node:22-alpine",
    filename: "solution.js",
    command: (t) => `timeout -s KILL ${t} node /work/solution.js`,
  },
  JAVA: {
    image: "eclipse-temurin:21-jdk-alpine",
    filename: "Main.java",
    command: (t) =>
      `javac -nowarn -d /work /work/Main.java && timeout -s KILL ${t} java -XX:+UseSerialGC -Xmx256m -cp /work Main`,
  },
  CPP: {
    image: "gcc:14",
    filename: "solution.cpp",
    command: (t) =>
      `g++ -std=c++20 -O2 -w -o /work/solution /work/solution.cpp && timeout -s KILL ${t} /work/solution`,
  },
};

export class DockerExecutionAdapter implements CodeExecutionService {
  readonly name = "docker";
  readonly isSandboxed = true;

  async isAvailable(): Promise<boolean> {
    try {
      const probe = await run("docker", ["version", "--format", "{{.Server.Version}}"], "", 5000);
      // `docker version` still prints client info and exits non-zero when the
      // daemon is unreachable, so the exit code is what matters here.
      return probe.code === 0;
    } catch {
      return false;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const spec = SPECS[request.language];
    if (!spec) {
      return {
        status: "INTERNAL_ERROR",
        passed: 0,
        total: request.tests.length,
        executionTimeMs: 0,
        memoryKb: null,
        compileError: `${request.language} has no container image configured.`,
        results: [],
      };
    }

    // turbopackIgnore keeps the bundler from statically tracing this
    // path. Without it, a join() on a runtime value makes Turbopack
    // conservatively trace the entire project into the server output,
    // which bloats the deployment and can trip size limits.
    const dir = await mkdtemp(
      join(/* turbopackIgnore: true */ tmpdir(), "codeforge-docker-")
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

      const timeoutSeconds = Math.max(1, Math.ceil(request.timeLimitMs / 1000));
      const results: TestResult[] = [];

      for (const test of request.tests) {
        const outcome = await run(
          "docker",
          [
            "run",
            "--rm",
            "--interactive",
            "--network=none",
            "--read-only",
            `--memory=${request.memoryLimitMb}m`,
            `--memory-swap=${request.memoryLimitMb}m`,
            "--cpus=1",
            "--pids-limit=64",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "--user=65534:65534",
            // The source is mounted read-only; /work is a separate writable
            // tmpfs so compilation output has somewhere to go without making
            // the submitted source mutable.
            "--tmpfs=/work:rw,size=64m,mode=1777",
            "--volume",
            `${dir}:/src:ro`,
            "--workdir=/work",
            spec.image,
            "sh",
            "-c",
            `cp /src/* /work/ && ${spec.command(timeoutSeconds)}`,
          ],
          test.input,
          // The host-side deadline is deliberately looser than the in-container
          // one: the container should police itself, and this only catches a
          // daemon that has stopped responding.
          request.timeLimitMs + 30_000
        );

        const isCompileFailure =
          /error:|cannot find symbol|\berror\b.*\.java/i.test(outcome.stderr) &&
          outcome.stdout.trim() === "";

        if (isCompileFailure && results.length === 0) {
          return {
            status: "COMPILE_ERROR",
            passed: 0,
            total: request.tests.length,
            executionTimeMs: Date.now() - started,
            memoryKb: null,
            compileError: outcome.stderr.slice(0, 4000),
            results: [],
          };
        }

        const visible = test.isSample
          ? {
              input: test.input,
              expected: test.expected,
              actual: outcome.stdout.slice(0, 4000),
            }
          : {};

        // 137 is SIGKILL: either the in-container `timeout` fired or the
        // cgroup OOM killer did. The stderr text distinguishes them.
        const killed = outcome.code === 137 || outcome.signal === "SIGKILL";
        const oom = /out of memory|OutOfMemoryError|bad_alloc|Killed/i.test(
          outcome.stderr
        );

        results.push({
          testCaseId: test.id,
          isSample: test.isSample,
          runtimeMs: outcome.durationMs,
          ...visible,
          outcome: killed
            ? oom
              ? "MEMORY_LIMIT"
              : "TIMEOUT"
            : outcome.code !== 0
              ? "RUNTIME_ERROR"
              : outputMatches(outcome.stdout, test.expected)
                ? "PASSED"
                : "WRONG_ANSWER",
          ...(outcome.code !== 0 ? { stderr: outcome.stderr.slice(0, 2000) } : {}),
        });

        if (!test.isSample && results[results.length - 1]!.outcome !== "PASSED") {
          break;
        }
      }

      return summarise(request, results, Date.now() - started);
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

type RunOutcome = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
};

function run(
  command: string,
  args: string[],
  stdin: string,
  timeoutMs: number
): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"] as const,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    const MAX_CAPTURE = 256 * 1024;

    child.stdout.on("data", (c: Buffer) => {
      if (stdout.length < MAX_CAPTURE) stdout += c.toString("utf8");
    });
    child.stderr.on("data", (c: Buffer) => {
      if (stderr.length < MAX_CAPTURE) stderr += c.toString("utf8");
    });

    const finish = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, durationMs: Date.now() - started });
    };

    child.on("error", (error) => {
      stderr += `\n${error.message}`;
      finish(null, null);
    });
    child.on("close", finish);
    child.stdin.on("error", () => {});
    child.stdin.end(stdin);
  });
}
