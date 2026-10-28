import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Production policy: learner code never runs in the web process, and a
 * deploy does not start running it until an operator switches it on.
 */

const env = vi.hoisted(() => ({ current: {} as Record<string, string | undefined> }));
vi.mock("@/lib/env", () => ({ getEnv: () => env.current }));

import {
  ExecutionUnavailableError,
  executionStatus,
  getExecutionService,
  setExecutionService,
} from "./index";

function configure(values: Record<string, string | undefined>) {
  env.current = { NODE_ENV: "production", ...values };
  setExecutionService(null);
}

describe("execution policy", () => {
  beforeEach(() => configure({}));

  it("is off in production unless explicitly enabled", async () => {
    configure({ CODE_EXECUTION_DRIVER: "worker", CODE_EXECUTION_API_URL: "http://w" });
    expect(executionStatus().available).toBe(false);
    await expect(getExecutionService()).rejects.toBeInstanceOf(
      ExecutionUnavailableError
    );
  });

  it.each(["local", "docker"])(
    "refuses the in-process %s driver in production even when enabled",
    async (driver) => {
      configure({ CODE_EXECUTION_DRIVER: driver, CODE_EXECUTION_ENABLED: "true" });
      expect(executionStatus().available).toBe(false);
      await expect(getExecutionService()).rejects.toBeInstanceOf(
        ExecutionUnavailableError
      );
    }
  );

  it("accepts the isolated worker once enabled", async () => {
    configure({
      CODE_EXECUTION_DRIVER: "worker",
      CODE_EXECUTION_ENABLED: "true",
      CODE_EXECUTION_API_URL: "http://worker.internal:8090",
      CODE_EXECUTION_API_KEY: "k".repeat(40),
    });
    expect(executionStatus()).toEqual({ available: true });
    expect((await getExecutionService()).name).toBe("worker");
  });

  it("can be switched off in development too", () => {
    configure({ NODE_ENV: "development", CODE_EXECUTION_ENABLED: "false" });
    expect(executionStatus().available).toBe(false);
    configure({ NODE_ENV: "development" });
    expect(executionStatus().available).toBe(true);
  });

  it("gives users a message with no configuration details", () => {
    configure({ CODE_EXECUTION_DRIVER: "docker", CODE_EXECUTION_ENABLED: "true" });
    const status = executionStatus();
    expect(status.available).toBe(false);
    if (!status.available) expect(status.reason).not.toMatch(/CODE_EXECUTION|docker/i);
  });
});
