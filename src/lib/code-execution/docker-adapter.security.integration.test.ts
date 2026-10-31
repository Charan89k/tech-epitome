import { execFileSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DockerExecutionAdapter } from "./docker-adapter";
import type { ExecutionRequest, ExecutionResult } from "./types";

/**
 * Hostile-code tests for the container executor, against a real Docker
 * daemon. Skipped where no daemon is reachable, and the skip is reported,
 * so "passed" never stands in for "not run".
 *
 * Each case is a program a malicious learner could submit. Together they are
 * the evidence for the controls listed in docker-adapter.ts.
 */

function daemonUp(): boolean {
  try {
    execFileSync("docker", ["version", "--format", "{{.Server.Version}}"], {
      stdio: "ignore",
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

const docker = daemonUp();
const adapter = new DockerExecutionAdapter();
const CANARY = "TE_SECRET_CANARY";

function leftoverContainers(): number {
  const out = execFileSync("docker", ["ps", "-aq", "--filter", "name=te-run-"], {
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean).length;
}

async function python(
  program: string,
  options: Partial<ExecutionRequest> & { input?: string; isSample?: boolean } = {}
): Promise<ExecutionResult> {
  return adapter.execute({
    language: "PYTHON",
    program,
    tests: [
      {
        id: "t1",
        input: options.input ?? "",
        expected: null,
        isSample: options.isSample ?? true,
      },
    ],
    timeLimitMs: options.timeLimitMs ?? 2000,
    memoryLimitMb: options.memoryLimitMb ?? 128,
  });
}

const output = (result: ExecutionResult) => result.results[0]?.actual?.trim() ?? "";

describe.skipIf(!docker)(
  "docker executor against hostile code",
  { timeout: 60_000 },
  () => {
    beforeAll(() => {
      process.env[CANARY] = "do-not-leak";
    });

    afterAll(() => {
      delete process.env[CANARY];
    });

    it("runs ordinary code and passes only its own stdin to it", async () => {
      const result = await python("import sys\nprint(sys.stdin.read().upper())", {
        input: "hello",
      });
      expect(result.results[0]?.outcome).toBe("COMPLETED");
      expect(output(result)).toBe("HELLO");
    });

    it("has no network: outbound connections fail", async () => {
      const result = await python(
        [
          "import socket",
          "for host in [('1.1.1.1', 80), ('169.254.169.254', 80), ('172.17.0.1', 5432)]:",
          "    try:",
          "        socket.create_connection(host, timeout=1)",
          "        print('OPEN', host, flush=True)",
          "    except Exception:",
          "        print('blocked', flush=True)",
        ].join("\n"),
        { timeLimitMs: 5000 }
      );
      expect(output(result).split("\n")).toEqual(["blocked", "blocked", "blocked"]);
    });

    it("sees no host files, host environment or application secrets", async () => {
      const result = await python(
        [
          "import os",
          `print(os.environ.get('${CANARY}'), os.environ.get('DATABASE_URL'), os.environ.get('AUTH_SECRET'))`,
          `print(os.path.exists('/src'), os.path.exists(${JSON.stringify(process.cwd())}), os.path.exists('/var/run/docker.sock'))`,
        ].join("\n")
      );
      expect(output(result).split("\n")).toEqual([
        "None None None",
        "False False False",
      ]);
    });

    it("runs as nobody, with no capabilities, under seccomp and no-new-privs", async () => {
      const result = await python(
        [
          "import os",
          "print(os.getuid(), os.getgid())",
          "status = dict(l.split(':\\t', 1) for l in open('/proc/self/status').read().splitlines() if ':\\t' in l)",
          "print(status['CapEff'].strip(), status['Seccomp'].strip(), status['NoNewPrivs'].strip())",
        ].join("\n")
      );
      expect(output(result).split("\n")).toEqual([
        "65534 65534",
        "0000000000000000 2 1",
      ]);
    });

    it("cannot modify the image and has a capped scratch disk", async () => {
      const result = await python(
        [
          "for path in ['/etc/evil', '/usr/evil']:",
          "    try:",
          "        open(path, 'w').write('x'); print('WROTE', path)",
          "    except OSError:",
          "        print('denied')",
          "try:",
          "    with open('/work/big', 'wb') as f:",
          "        for _ in range(200): f.write(b'x' * 1024 * 1024)",
          "    print('FILLED')",
          "except OSError:",
          "    print('capped')",
        ].join("\n")
      );
      // The 1 MB fsize ulimit fires before the 64 MB tmpfs quota does.
      expect(output(result).split("\n").slice(0, 2)).toEqual(["denied", "denied"]);
      expect(output(result)).not.toContain("FILLED");
    });

    it("stops an infinite loop at the time limit and leaves no container", async () => {
      const started = Date.now();
      const result = await python("while True:\n    pass", { timeLimitMs: 1000 });
      expect(result.results[0]?.outcome).toBe("TIMEOUT");
      expect(Date.now() - started).toBeLessThan(15_000);
      expect(leftoverContainers()).toBe(0);
    });

    it("reports memory exhaustion as a memory limit", async () => {
      const result = await python("x = bytearray(1024 * 1024 * 1024)\nprint(len(x))", {
        memoryLimitMb: 64,
      });
      expect(result.results[0]?.outcome).toBe("MEMORY_LIMIT");
      expect(output(result)).not.toBe(String(1024 * 1024 * 1024));
    });

    it("contains a fork bomb within the process cap", async () => {
      const started = Date.now();
      const result = await python(
        "import os\nwhile True:\n    try:\n        os.fork()\n    except OSError:\n        pass",
        { timeLimitMs: 2000 }
      );
      expect(result.results[0]?.outcome).not.toBe("COMPLETED");
      expect(Date.now() - started).toBeLessThan(30_000);
      expect(leftoverContainers()).toBe(0);
    });

    it("cuts off excessive output", async () => {
      const result = await python("while True:\n    print('x' * 1000)");
      expect(result.results[0]?.outcome).toBe("OUTPUT_LIMIT");
      expect((result.results[0]?.actual ?? "").length).toBeLessThanOrEqual(4000);
      expect(leftoverContainers()).toBe(0);
    });

    it("never returns a hidden test's input or output", async () => {
      const result = await python("print(input())", {
        input: "secret-case",
        isSample: false,
      });
      expect(result.results[0]).not.toHaveProperty("input");
      expect(result.results[0]).not.toHaveProperty("actual");
    });

    it("reports a compile error for broken C++ without running anything", async () => {
      const result = await adapter.execute({
        language: "CPP",
        program: "int main() { this is not c++ }",
        tests: [{ id: "t1", input: "", expected: "x", isSample: true }],
        timeLimitMs: 2000,
        memoryLimitMb: 128,
      });
      expect(result.status).toBe("COMPILE_ERROR");
      expect(result.compileError).toMatch(/error/);
    });
  }
);
