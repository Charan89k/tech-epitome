import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import {
  setExecutionService,
  type CodeExecutionService,
  type ExecutionRequest,
  type ExecutionResult,
} from "@/lib/code-execution";
import { runCustomInput, submitSolution } from "./submissions";

/**
 * Submit deduplication, custom Run input and the execution log, against the
 * real database with a recording fake executor in place of Judge0.
 */

const SLUG = "running-altitude";
const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
let userId = "";
let problemId = "";

const calls: ExecutionRequest[] = [];

const executor: CodeExecutionService = {
  name: "fake",
  isSandboxed: true,
  isAvailable: async () => true,
  async execute(request): Promise<ExecutionResult> {
    calls.push(request);
    return {
      status: "ACCEPTED",
      passed: request.tests.filter((t) => t.expected !== null).length,
      total: request.tests.length,
      executionTimeMs: 12,
      memoryKb: 2048,
      results: request.tests.map((test) => ({
        testCaseId: test.id,
        isSample: test.isSample,
        outcome: test.expected === null ? "COMPLETED" : "PASSED",
        runtimeMs: 1,
        ...(test.isSample ? { input: test.input, actual: "7" } : {}),
      })),
    };
  },
};

beforeAll(async () => {
  setExecutionService(executor);
  const user = await prisma.user.create({
    data: { email: `submissions-${SUFFIX}@techepitome.test`, name: "Sub" },
    select: { id: true },
  });
  userId = user.id;
  problemId = (await prisma.problem.findUniqueOrThrow({ where: { slug: SLUG } })).id;
});

afterEach(() => {
  calls.length = 0;
  vi.restoreAllMocks();
});

afterAll(async () => {
  setExecutionService(null);
  await prisma.user.delete({ where: { id: userId } });
});

describe("duplicate submits", () => {
  it("answers an identical resubmit from the stored result without executing", async () => {
    const code = `def highestAltitude(changes): return 0  # ${SUFFIX}`;

    const first = await submitSolution(userId, SLUG, "PYTHON", code);
    const second = await submitSolution(userId, SLUG, "PYTHON", code);

    expect(calls).toHaveLength(1);
    expect(first!.duplicate).toBeUndefined();
    expect(second).toMatchObject({ duplicate: true, submissionId: first!.submissionId });
    expect(second!.result.status).toBe(first!.result.status);
    expect(second!.result.passed).toBe(first!.result.passed);

    // One recorded submission and one attempt, not two.
    expect(await prisma.submission.count({ where: { userId, problemId } })).toBe(1);
    const progress = await prisma.userProblemProgress.findUniqueOrThrow({
      where: { userId_problemId: { userId, problemId } },
    });
    expect(progress.attempts).toBe(1);
  });

  it("executes again when the code, or the language, is different", async () => {
    await submitSolution(userId, SLUG, "PYTHON", `def highestAltitude(c): return 1 # a${SUFFIX}`);
    await submitSolution(userId, SLUG, "PYTHON", `def highestAltitude(c): return 1 # b${SUFFIX}`);
    expect(calls).toHaveLength(2);
  });

  it("executes again once the window has passed", async () => {
    const code = `def highestAltitude(c): return 2 # window ${SUFFIX}`;
    await submitSolution(userId, SLUG, "PYTHON", code);
    // Age the stored submission past the window instead of sleeping 15s.
    await prisma.submission.updateMany({
      where: { userId, code },
      data: { createdAt: new Date(Date.now() - 60_000) },
    });
    const again = await submitSolution(userId, SLUG, "PYTHON", code);

    expect(calls).toHaveLength(2);
    expect(again!.duplicate).toBeUndefined();
  });
});

describe("custom Run input", () => {
  it("runs one validated case with no expected output, through the harness", async () => {
    const outcome = await runCustomInput(SLUG, "PYTHON", "def highestAltitude(c): return 7", "1 2 3", userId);

    expect(outcome).toMatchObject({ custom: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.tests).toEqual([
      { id: "custom", input: "1 2 3\n", expected: null, isSample: true },
    ]);
    // The learner's function went in spliced into the real harness.
    expect(calls[0]!.program).toContain("def highestAltitude(c): return 7");
    expect(calls[0]!.program).not.toContain("%%USER_CODE%%");
  });

  it("refuses input that does not fit the signature, without executing", async () => {
    const outcome = await runCustomInput(SLUG, "PYTHON", "x", "1 two 3", userId);

    expect(outcome).toEqual({ invalidInput: expect.stringMatching(/Line 1/) });
    expect(calls).toHaveLength(0);
  });

  it("records nothing", async () => {
    const before = await prisma.submission.count({ where: { userId } });
    await runCustomInput(SLUG, "PYTHON", "def highestAltitude(c): return 7", "5", userId);
    expect(await prisma.submission.count({ where: { userId } })).toBe(before);
  });
});

describe("execution log", () => {
  it("writes one structured line with no code or test data", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "info").mockImplementation((line: unknown) => {
      lines.push(String(line));
    });
    const secretCode = `def highestAltitude(c): return 9  # CODE-${SUFFIX}`;

    await runCustomInput(SLUG, "PYTHON", secretCode, "424242", userId);
    await submitSolution(userId, SLUG, "PYTHON", secretCode);

    const entries = lines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((entry) => entry.event === "code_execution");
    expect(entries.map((e) => e.mode)).toEqual(["custom", "submit"]);
    expect(entries[1]).toMatchObject({
      userId,
      problemId,
      language: "PYTHON",
      provider: "fake",
      status: "ACCEPTED",
      failure: "none",
    });

    const hiddenInputs = await prisma.testCase.findMany({
      where: { problemId, isSample: false },
      select: { input: true, expected: true },
    });
    for (const line of lines) {
      expect(line).not.toContain(`CODE-${SUFFIX}`);
      expect(line).not.toContain("424242");
      for (const hidden of hiddenInputs) {
        if (hidden.input.length > 3) expect(line).not.toContain(hidden.input);
      }
    }
  });
});
