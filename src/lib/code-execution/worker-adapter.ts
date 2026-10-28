import "server-only";

import type { CodeExecutionService, ExecutionRequest, ExecutionResult } from "./types";
import { WORKER_LANGUAGES, workerResultSchema } from "./worker-protocol";

/**
 * Sends jobs to the execution worker (src/worker) on its own host. The web
 * app never touches Docker; it holds only the worker URL and token.
 */
export class WorkerExecutionAdapter implements CodeExecutionService {
  readonly name = "worker";
  readonly isSandboxed = true;

  constructor(private readonly config: { url: string; token: string }) {}

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(new URL("/healthz", this.config.url), {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!(WORKER_LANGUAGES as readonly string[]).includes(request.language)) {
      return failure(
        request,
        `${request.language} is not available on this execution service.`
      );
    }

    // Each case can take its time limit plus container start-up.
    const budgetMs = Math.min(
      request.tests.length * (request.timeLimitMs + 15_000),
      300_000
    );
    const res = await fetch(new URL("/v1/execute", this.config.url), {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(budgetMs),
    });

    if (res.status === 503) {
      throw new Error("The execution service is busy. Try again in a few seconds.");
    }
    if (!res.ok) {
      throw new Error(`The execution service refused the job (HTTP ${res.status}).`);
    }

    const parsed = workerResultSchema.safeParse(await res.json());
    if (!parsed.success)
      throw new Error("The execution service sent an invalid result.");
    return parsed.data;
  }
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
