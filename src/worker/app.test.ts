import { execFileSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import { DockerExecutionAdapter } from "@/lib/code-execution/docker-adapter";
import type { ExecutionRequest, ExecutionResult } from "@/lib/code-execution/types";
import { WorkerExecutionAdapter } from "@/lib/code-execution/worker-adapter";
import { WORKER_LIMITS } from "@/lib/code-execution/worker-protocol";
import { createWorker, type WorkerOptions } from "./app";

/**
 * The worker's front door: who may create a job, what a job may contain,
 * and what happens when it is saturated. The executor is a fake here except
 * in the last block, which goes web adapter -> worker -> real containers.
 */

const TOKEN = "t".repeat(40);
const servers: Server[] = [];

const RESULT: ExecutionResult = {
  status: "ACCEPTED",
  passed: 1,
  total: 1,
  executionTimeMs: 5,
  memoryKb: null,
  results: [{ testCaseId: "a", isSample: true, outcome: "PASSED", runtimeMs: 5 }],
};

const JOB: ExecutionRequest = {
  language: "PYTHON",
  program: "print(1)",
  tests: [{ id: "a", input: "", expected: "1", isSample: true }],
  timeLimitMs: 1000,
  memoryLimitMb: 64,
};

async function start(overrides: Partial<WorkerOptions> = {}) {
  const execute = vi.fn(overrides.execute ?? (async () => RESULT));
  const logs: unknown[] = [];
  const server = createWorker({
    token: TOKEN,
    concurrency: 2,
    queueLimit: 4,
    log: (line) => logs.push(line),
    ...overrides,
    execute,
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, execute, logs };
}

function post(url: string, body: unknown, token: string | null = TOKEN) {
  return fetch(`${url}/v1/execute`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

describe("execution worker", () => {
  it("refuses to start with a short token", () => {
    expect(() =>
      createWorker({
        token: "short",
        concurrency: 1,
        queueLimit: 1,
        execute: async () => RESULT,
      })
    ).toThrow();
  });

  it("rejects jobs without the right token and never runs them", async () => {
    const { url, execute } = await start();
    expect((await post(url, JOB, null)).status).toBe(401);
    expect((await post(url, JOB, "x".repeat(40))).status).toBe(401);
    expect((await post(url, JOB, `${TOKEN}x`)).status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("validates language, shape and size before running anything", async () => {
    const { url, execute } = await start();
    const bad = [
      { ...JOB, language: "GO" },
      { ...JOB, language: "BASH" },
      { ...JOB, tests: [] },
      {
        ...JOB,
        tests: Array.from({ length: WORKER_LIMITS.maxTests + 1 }, () => JOB.tests[0]),
      },
      { ...JOB, timeLimitMs: 60_000 },
      { ...JOB, memoryLimitMb: 8192 },
      { ...JOB, program: "" },
      "{not json",
    ];
    for (const body of bad) {
      expect((await post(url, body)).status).toBe(400);
    }
    const huge = { ...JOB, program: "x".repeat(WORKER_LIMITS.maxBodyBytes + 10) };
    expect((await post(url, huge)).status).toBe(413);
    expect(execute).not.toHaveBeenCalled();
  });

  it("answers 404 for anything but the job endpoint and health", async () => {
    const { url } = await start();
    expect((await fetch(`${url}/v1/jobs`)).status).toBe(404);
    expect((await fetch(`${url}/healthz`)).status).toBe(200);
  });

  it("runs a valid job and logs no code or input", async () => {
    const { url, execute, logs } = await start();
    const res = await post(url, { ...JOB, program: "print('SECRET_CODE')" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESULT);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logs)).not.toContain("SECRET_CODE");
  });

  it("queues up to its limit, then sheds load with 503", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { url, execute } = await start({
      concurrency: 1,
      queueLimit: 1,
      execute: async () => {
        await gate;
        return RESULT;
      },
    });

    const first = post(url, JOB);
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    const second = post(url, JOB);
    await new Promise((r) => setTimeout(r, 50));
    const third = await post(url, JOB);
    expect(third.status).toBe(503);
    expect(third.headers.get("retry-after")).toBe("5");

    release();
    expect((await first).status).toBe(200);
    expect((await second).status).toBe(200);
    expect(execute).toHaveBeenCalledTimes(2);
  });
});

function dockerUp(): boolean {
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

describe.skipIf(!dockerUp())(
  "web adapter -> worker -> containers",
  { timeout: 60_000 },
  () => {
    it("runs a job end to end and refuses a wrong token", async () => {
      const docker = new DockerExecutionAdapter();
      const { url } = await start({ execute: (job) => docker.execute(job) });

      const adapter = new WorkerExecutionAdapter({ url, token: TOKEN });
      expect(await adapter.isAvailable()).toBe(true);
      const result = await adapter.execute({
        ...JOB,
        program: "import sys\nprint(int(sys.stdin.read()) * 2)",
        tests: [{ id: "a", input: "21", expected: "42", isSample: true }],
      });
      expect(result.status).toBe("ACCEPTED");

      const intruder = new WorkerExecutionAdapter({ url, token: "y".repeat(40) });
      await expect(intruder.execute(JOB)).rejects.toThrow(/HTTP 401/);
    });
  }
);
