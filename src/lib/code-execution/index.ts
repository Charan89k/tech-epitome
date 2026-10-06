import "server-only";

import { getEnv } from "@/lib/env";
import { DockerExecutionAdapter } from "./docker-adapter";
import { Judge0ExecutionAdapter } from "./judge0-adapter";
import { LocalExecutionAdapter } from "./local-adapter";
import type { CodeExecutionService } from "./types";

export * from "./types";
export * from "./signature";

let cached: CodeExecutionService | null = null;

/**
 * Selects the execution adapter for this deployment.
 *
 * Resolution is deliberately strict rather than helpful: an unsandboxed
 * executor must never be silently substituted for a sandboxed one. If
 * `docker` is configured and the daemon is unreachable, the choice in
 * production is to fail loudly, not to quietly fall back to running
 * untrusted code as the server user.
 */
export async function getExecutionService(): Promise<CodeExecutionService> {
  if (cached) return cached;

  const env = getEnv();
  const isProduction = env.NODE_ENV === "production";

  switch (env.CODE_EXECUTION_DRIVER) {
    case "docker": {
      const docker = new DockerExecutionAdapter();
      if (await docker.isAvailable()) {
        cached = docker;
        return cached;
      }
      if (isProduction) {
        throw new Error(
          "CODE_EXECUTION_DRIVER=docker but the Docker daemon is unreachable. " +
            "Refusing to fall back to the unsandboxed local executor in production."
        );
      }
      console.warn(
        "[code-execution] Docker is unreachable; using the local development " +
          "executor instead. It provides NO isolation - see " +
          "src/lib/code-execution/local-adapter.ts."
      );
      cached = new LocalExecutionAdapter();
      return cached;
    }

    case "remote":
      // Judge0, wherever it is hosted. env.ts has already refused a
      // remote driver with no URL, so this never builds a half-configured
      // client.
      cached = new Judge0ExecutionAdapter({
        url: env.CODE_EXECUTION_API_URL!,
        key: env.CODE_EXECUTION_API_KEY,
      });
      return cached;

    case "local":
    default: {
      if (isProduction) {
        throw new Error(
          "CODE_EXECUTION_DRIVER=local is not permitted in production; it runs " +
            "submitted code with no isolation. Use 'docker'."
        );
      }
      cached = new LocalExecutionAdapter();
      return cached;
    }
  }
}

/** Test seam: lets a suite install a deterministic executor. */
export function setExecutionService(service: CodeExecutionService | null): void {
  cached = service;
}
