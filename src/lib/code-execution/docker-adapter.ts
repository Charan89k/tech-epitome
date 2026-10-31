import "server-only";

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import type { Language } from "@/generated/prisma/enums";
import {
  clampCpuSeconds,
  clampMemoryMb,
  EXECUTION_LIMITS,
  FILE_TOO_LARGE,
} from "./limits";
import { summarise } from "./local-adapter";
import {
  judgeOutput,
  type CodeExecutionService,
  type ExecutionRequest,
  type ExecutionResult,
  type TestResult,
} from "./types";

/**
 * Container executor: one throwaway container per test case.
 *
 * Every submission is hostile. The controls, each checked by
 * docker-adapter.security.integration.test.ts against a real daemon:
 *
 *   --network=none        no sockets in or out: no internet, metadata
 *                         endpoint, database or internal service
 *   no host mounts        the source arrives on stdin, so no host path is
 *                         ever visible inside the container
 *   --read-only           the image filesystem cannot be modified
 *   --tmpfs /work, /tmp   small size-capped scratch space, gone on exit
 *   --memory / --memory-swap  a hard RSS ceiling, no swap
 *   --cpus, --pids-limit  one CPU; fork bombs hit a process cap
 *   --ulimit fsize/nofile bounded file writes and open files
 *   --init                PID 1 is an init, so the time limit kills reliably
 *                         and every process dies with the container
 *   --cap-drop=ALL, no-new-privileges, --user 65534  no root, no escalation
 *   seccomp               Docker's default profile (never "unconfined")
 *   --ipc=none, --log-driver=none, no -e  no shared memory, no stored
 *                         output, and none of the host's environment
 *   EXECUTION_DOCKER_RUNTIME  e.g. "runsc" (gVisor) for a user-space kernel;
 *                         plain runc shares the host kernel, which is why
 *                         this belongs on a dedicated worker host
 *
 * Runs in the execution worker (worker/server.ts), never in the web app:
 * a Docker socket is root on its host. See docs/EXECUTION.md.
 */

/** Printed to stderr only when the compile step itself fails. */
const COMPILE_MARKER = "__TE_COMPILE_FAILED__";

function compile(command: string): string {
  return `{ ${command} || { echo ${COMPILE_MARKER} >&2; exit 1; }; }`;
}

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
      `${compile("javac -nowarn -d /work /work/Main.java")} && timeout -s KILL ${t} java -XX:+UseSerialGC -XX:-UsePerfData -Xss64m -Xmx200m -cp /work Main`,
  },
  CPP: {
    image: "gcc:14",
    filename: "solution.cpp",
    command: (t) =>
      `${compile("g++ -std=c++20 -O2 -w -o /work/solution /work/solution.cpp")} && timeout -s KILL ${t} /work/solution`,
  },
};

/** Languages this adapter can run. Anything else is reported as unavailable. */
export const DOCKER_LANGUAGES = Object.keys(SPECS) as Language[];

/**
 * Written to stderr when the container's cgroup recorded an OOM kill. A
 * program can print it too, but only to mislabel its own failed run.
 */
const OOM_MARKER = "__TE_OOM_KILL__";

/** Extra time the host allows beyond the in-container limit, for start-up. */
const HOST_GRACE_MS = 30_000;

/**
 * The stdin a container receives: a byte count line, the source, then the
 * test input. `read` and `dd bs=1` consume exactly the header and source,
 * so the program inherits only its own input.
 */
export function frameStdin(program: string, input: string): string {
  return `${Buffer.byteLength(program, "utf8")}\n${program}${input}`;
}

export function containerArgs(
  name: string,
  spec: ContainerSpec,
  memoryMb: number,
  timeoutSeconds: number,
  runtime?: string
): string[] {
  return [
    "run",
    "--rm",
    "--interactive",
    // A real init as PID 1: the kernel ignores signals sent to a namespace's
    // init from inside it, so without this `timeout` could not kill a busy
    // loop, and leftover forks would outlive the program.
    "--init",
    `--name=${name}`,
    ...(runtime ? [`--runtime=${runtime}`] : []),
    "--network=none",
    "--ipc=none",
    "--log-driver=none",
    "--read-only",
    `--memory=${memoryMb}m`,
    `--memory-swap=${memoryMb}m`,
    "--oom-score-adj=1000",
    "--cpus=1",
    `--pids-limit=${EXECUTION_LIMITS.maxProcesses}`,
    `--ulimit=fsize=${EXECUTION_LIMITS.maxOutputKb * 1024}`,
    "--ulimit=nofile=64:64",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--user=65534:65534",
    "--hostname=sandbox",
    // exec: a compiled C++ binary runs from here. Docker tmpfs is noexec by default.
    "--tmpfs=/work:rw,exec,nosuid,nodev,size=64m,mode=1777",
    "--tmpfs=/tmp:rw,noexec,nosuid,size=16m,mode=1777",
    "--workdir=/work",
    "--env=HOME=/work",
    spec.image,
    "sh",
    "-c",
    `IFS= read -r n && dd of=/work/${spec.filename} bs=1 count="$n" 2>/dev/null && ` +
      `{ ${spec.command(timeoutSeconds)}; rc=$?; ` +
      // The cgroup's own OOM counter, so a memory kill is not mistaken for a timeout.
      `grep -qs '^oom_kill [1-9]' /sys/fs/cgroup/memory.events && echo ${OOM_MARKER} >&2; exit $rc; }`,
  ];
}

export class DockerExecutionAdapter implements CodeExecutionService {
  readonly name = "docker";
  readonly isSandboxed = true;

  async isAvailable(): Promise<boolean> {
    try {
      const probe = await run(
        "docker",
        ["version", "--format", "{{.Server.Version}}"],
        "",
        5000
      );
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

    const started = Date.now();
    const timeoutSeconds = Math.ceil(clampCpuSeconds(request.timeLimitMs));
    const memoryMb = clampMemoryMb(request.memoryLimitMb);
    const results: TestResult[] = [];

    for (const test of request.tests) {
      const name = `te-run-${randomUUID()}`;
      const outcome = await run(
        "docker",
        containerArgs(
          name,
          spec,
          memoryMb,
          timeoutSeconds,
          process.env.EXECUTION_DOCKER_RUNTIME
        ),
        frameStdin(request.program, test.input),
        // The container polices itself; this only catches a stuck daemon,
        // and then removes the container rather than orphaning it.
        request.timeLimitMs + HOST_GRACE_MS,
        name
      );

      const isCompileFailure = outcome.stderr.includes(COMPILE_MARKER);

      if (isCompileFailure && results.length === 0) {
        return {
          status: "COMPILE_ERROR",
          passed: 0,
          total: request.tests.length,
          executionTimeMs: Date.now() - started,
          memoryKb: null,
          compileError: outcome.stderr
            .replaceAll(`${COMPILE_MARKER}\n`, "")
            .slice(0, 4000),
          results: [],
        };
      }

      const visible = test.isSample
        ? {
            input: test.input,
            ...(test.expected !== null ? { expected: test.expected } : {}),
            actual: outcome.stdout.slice(0, 4000),
          }
        : {};

      // 137 is SIGKILL: either the in-container `timeout` fired or the
      // cgroup OOM killer did; the marker or the runtime's message says which.
      const killed = outcome.code === 137 || outcome.signal === "SIGKILL";
      const oom =
        outcome.stderr.includes(OOM_MARKER) ||
        /out of memory|OutOfMemoryError|bad_alloc/i.test(outcome.stderr);
      outcome.stderr = outcome.stderr.replaceAll(`${OOM_MARKER}\n`, "");

      results.push({
        testCaseId: test.id,
        isSample: test.isSample,
        runtimeMs: outcome.durationMs,
        ...visible,
        // 153 is 128 + SIGXFSZ: the fsize ulimit fired on a file.
        outcome:
          outcome.outputLimited ||
          outcome.code === 153 ||
          (outcome.code !== 0 && FILE_TOO_LARGE.test(outcome.stderr))
            ? "OUTPUT_LIMIT"
            : killed
              ? oom
                ? "MEMORY_LIMIT"
                : "TIMEOUT"
              : outcome.code !== 0
                ? "RUNTIME_ERROR"
                : judgeOutput(outcome.stdout, test.expected),
        ...(outcome.code !== 0 ? { stderr: outcome.stderr.slice(0, 2000) } : {}),
      });

      if (!test.isSample && results[results.length - 1]!.outcome !== "PASSED") {
        break;
      }
    }

    return summarise(request, results, Date.now() - started);
  }
}

type RunOutcome = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  outputLimited: boolean;
  durationMs: number;
};

function run(
  command: string,
  args: string[],
  stdin: string,
  timeoutMs: number,
  containerName?: string
): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"] as const,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let outputLimited = false;

    // Killing the `docker run` client does not stop the container, so a
    // named one is force-removed too.
    let removal: Promise<void> = Promise.resolve();
    const stop = () => {
      child.kill("SIGKILL");
      if (containerName) removal = removeContainer(containerName);
    };
    const timer = setTimeout(stop, timeoutMs);
    // stdout is a pipe out of the container, which the fsize ulimit does
    // not cover, so the output ceiling is enforced here as well.
    const MAX_CAPTURE = EXECUTION_LIMITS.maxCaptureBytes;
    let captured = 0;
    const onData = (stream: "stdout" | "stderr") => (c: Buffer) => {
      captured += c.length;
      if (captured > MAX_CAPTURE) {
        if (!outputLimited) {
          outputLimited = true;
          stop();
        }
        return;
      }
      if (stream === "stdout") stdout += c.toString("utf8");
      else stderr += c.toString("utf8");
    };
    child.stdout.on("data", onData("stdout"));
    child.stderr.on("data", onData("stderr"));

    const finish = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Wait for a forced removal, so nothing outlives the request.
      void removal.then(() =>
        resolve({
          stdout,
          stderr,
          code,
          signal,
          outputLimited,
          durationMs: Date.now() - started,
        })
      );
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

function removeContainer(name: string): Promise<void> {
  return new Promise((resolve) => {
    const rm = spawn("docker", ["rm", "--force", name], { stdio: "ignore" });
    rm.on("error", () => resolve());
    rm.on("close", () => resolve());
  });
}
