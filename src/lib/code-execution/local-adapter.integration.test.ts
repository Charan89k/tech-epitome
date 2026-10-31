import { describe, expect, it } from "vitest";

import { LocalExecutionAdapter } from "./local-adapter";
import type { ExecutionRequest } from "./types";

/**
 * The development adapter's output ceiling, with real processes.
 *
 * RLIMIT_FSIZE does not apply to a pipe, so a print loop is stopped by the
 * capture cap instead; a large *file* is stopped by RLIMIT_FSIZE (SIGXFSZ).
 * Both must come back as an output-limit verdict, quickly, rather than as a
 * timeout after the loop has filled memory.
 *
 * This adapter is not a sandbox and these are not security tests — those
 * run against Judge0 (security/hostile). Every program here is bounded.
 */

const adapter = new LocalExecutionAdapter();

function python(program: string, expected: string | null = null): ExecutionRequest {
  return {
    language: "PYTHON",
    program,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tests: [{ id: "t", input: "", expected, isSample: true }],
  };
}

describe("LocalExecutionAdapter output limits", () => {
  it("stops a print loop at the output ceiling", async () => {
    const started = Date.now();
    const result = await adapter.execute(python('while True:\n    print("A" * 100)'));

    expect(result.status).toBe("OUTPUT_LIMIT_EXCEEDED");
    expect(result.results[0]!.outcome).toBe("OUTPUT_LIMIT");
    // Killed by the cap, not left to run into the wall-clock deadline.
    expect(Date.now() - started).toBeLessThan(3500);
  });

  it("stops a program writing an oversized file", async () => {
    const result = await adapter.execute(
      python(
        "import tempfile\nwith tempfile.TemporaryFile() as f:\n    f.write(b'A' * (2 * 1024 * 1024))\n"
      )
    );
    expect(result.status).toBe("OUTPUT_LIMIT_EXCEEDED");
  });

  it("reports a custom input as completed output", async () => {
    const result = await adapter.execute(python("print(6 * 7)"));
    expect(result.status).toBe("ACCEPTED");
    expect(result.results[0]).toMatchObject({ outcome: "COMPLETED", actual: "42\n" });
    expect(result.results[0]).not.toHaveProperty("expected");
  });

  it("still judges a normal case", async () => {
    const result = await adapter.execute(python("print(1)", "2"));
    expect(result.status).toBe("WRONG_ANSWER");
  });
});
