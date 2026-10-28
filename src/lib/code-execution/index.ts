import "server-only";

import { getEnv } from "@/lib/env";
import { DockerExecutionAdapter } from "./docker-adapter";
import { Judge0ExecutionAdapter, parseJudge0LanguageIds } from "./judge0-adapter";
import { LocalExecutionAdapter } from "./local-adapter";
import { WorkerExecutionAdapter } from "./worker-adapter";
import type { CodeExecutionService } from "./types";

export * from "./types";
export * from "./signature";
export * from "./limits";
export * from "./custom-input";

let cached: CodeExecutionService | null = null;

/** Thrown when this deployment may not run learner code. Safe to show users. */
export class ExecutionUnavailableError extends Error {
  constructor(message = "Running code is turned off on this deployment.") {
    super(message);
    this.name = "ExecutionUnavailableError";
  }
}

/** Drivers whose code runs outside the web process, on another host. */
const PRODUCTION_DRIVERS = new Set(["remote", "worker"]);

export type ExecutionStatus = { available: true } | { available: false; reason: string };

/**
 * Whether this deployment runs learner code at all. Production needs an
 * explicit CODE_EXECUTION_ENABLED=true and an isolated driver; nothing here
 * ever runs untrusted code inside the web server.
 */
export function executionStatus(): ExecutionStatus {
  const env = getEnv();
  const production = env.NODE_ENV === "production";
  const enabled =
    env.CODE_EXECUTION_ENABLED === undefined ? !production : env.CODE_EXECUTION_ENABLED === "true";
  if (!enabled) {
    return { available: false, reason: "Running code is turned off on this deployment." };
  }
  if (production && !PRODUCTION_DRIVERS.has(env.CODE_EXECUTION_DRIVER)) {
    return {
      available: false,
      reason: "Running code is unavailable: no isolated execution service is configured.",
    };
  }
  return { available: true };
}

/**
 * Selects the execution adapter for this deployment.
 *
 * Strict rather than helpful: an unsandboxed executor is never silently
 * substituted for a sandboxed one, and in production the web process never
 * runs code or holds a Docker socket. `docker` and `local` are development
 * drivers; production uses `worker` (src/worker on its own host) or `remote`.
 */
export async function getExecutionService(): Promise<CodeExecutionService> {
  if (cached) return cached;

  const status = executionStatus();
  if (!status.available) throw new ExecutionUnavailableError(status.reason);

  const env = getEnv();
  switch (env.CODE_EXECUTION_DRIVER) {
    case "worker":
      cached = new WorkerExecutionAdapter({
        url: env.CODE_EXECUTION_API_URL!,
        token: env.CODE_EXECUTION_API_KEY!,
      });
      return cached;

    case "remote":
      // Judge0, wherever it is hosted. env.ts has already refused a remote
      // driver with no URL, so this never builds a half-configured client.
      cached = new Judge0ExecutionAdapter({
        url: env.CODE_EXECUTION_API_URL!,
        key: env.CODE_EXECUTION_API_KEY,
        languageIds: env.JUDGE0_LANGUAGE_IDS
          ? parseJudge0LanguageIds(env.JUDGE0_LANGUAGE_IDS)
          : undefined,
      });
      return cached;

    case "docker": {
      const docker = new DockerExecutionAdapter();
      if (await docker.isAvailable()) {
        cached = docker;
        return cached;
      }
      console.warn(
        "[code-execution] Docker is unreachable; using the local development " +
          "executor instead. It provides NO isolation - see " +
          "src/lib/code-execution/local-adapter.ts."
      );
      cached = new LocalExecutionAdapter();
      return cached;
    }

    case "local":
    default:
      cached = new LocalExecutionAdapter();
      return cached;
  }
}

/** Test seam: lets a suite install a deterministic executor. */
export function setExecutionService(service: CodeExecutionService | null): void {
  cached = service;
}
