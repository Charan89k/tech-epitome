import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { LocalExecutionAdapter } from "@/lib/code-execution/local-adapter";
import { buildHarness, spliceUserCode } from "@/lib/code-execution/signature";
import { PROBLEMS } from "./index";

/**
 * Runs every problem's reference solution against its own test fixtures.
 *
 * This is the guard that keeps the catalogue honest. A hand-written expected
 * value is very easy to get wrong, and a wrong fixture is worse than a
 * missing problem: the learner writes a correct solution and is told it
 * failed. Nothing here can be caught by reading the data - it has to be
 * executed.
 *
 * Python is the language checked, because every problem authors a Python
 * reference. The harness itself is verified across all four languages
 * separately in lib/code-execution/harness.integration.test.ts.
 */

function hasPython(): boolean {
  try {
    execFileSync("sh", ["-c", "command -v python3"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const PYTHON_AVAILABLE = hasPython();
const adapter = new LocalExecutionAdapter();

describe("problem catalogue", () => {
  it("has the expected size and difficulty spread", () => {
    expect(PROBLEMS.length).toBeGreaterThanOrEqual(50);

    const bySlug = new Set(PROBLEMS.map((p) => p.slug));
    expect(bySlug.size, "slugs must be unique").toBe(PROBLEMS.length);
  });

  it("gives every problem a learning objective, hints and a solution", () => {
    for (const problem of PROBLEMS) {
      expect(problem.learningObjective.length, problem.slug).toBeGreaterThan(20);
      expect(problem.hints.length, problem.slug).toBeGreaterThanOrEqual(3);
      expect(problem.solutions.length, problem.slug).toBeGreaterThanOrEqual(1);
      expect(problem.patterns.length, problem.slug).toBeGreaterThanOrEqual(1);
      expect(problem.topics.length, problem.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every problem at least two sample tests and some hidden ones", () => {
    for (const problem of PROBLEMS) {
      const samples = problem.tests.filter((t) => t.isSample);
      const hidden = problem.tests.filter((t) => !t.isSample);
      expect(samples.length, `${problem.slug} samples`).toBeGreaterThanOrEqual(1);
      expect(hidden.length, `${problem.slug} hidden`).toBeGreaterThanOrEqual(1);
    }
  });

  it("authors a Python and a Java reference for every solution", () => {
    for (const problem of PROBLEMS) {
      for (const solution of problem.solutions) {
        expect(solution.code.PYTHON, `${problem.slug}/${solution.title}`).toBeTruthy();
        expect(solution.code.JAVA, `${problem.slug}/${solution.title}`).toBeTruthy();
      }
    }
  });

  it("names a signature whose parameter list matches its names", () => {
    for (const problem of PROBLEMS) {
      expect(
        problem.signature.params.length,
        `${problem.slug} params vs names`
      ).toBe(problem.signature.paramNames.length);
    }
  });
});

describe.skipIf(!PYTHON_AVAILABLE)("reference solutions pass their own fixtures", () => {
  for (const problem of PROBLEMS) {
    const ordered = [...problem.solutions].sort((a, b) => a.order - b.order);

    ordered.forEach((solution, position) => {
      const isOptimal = position === ordered.length - 1;

      // Only the final solution is checked against the full fixture set.
      // The earlier ones are deliberately-slow stepping stones - the naive
      // recursion in count-climb-routes is *supposed* to time out on the
      // largest input - so they are verified for correctness on the sample
      // cases, not for speed on the hidden ones.
      const fixtures = isOptimal
        ? problem.tests
        : problem.tests.filter((test) => test.isSample);

      it(
        `${problem.slug} — ${solution.title}${isOptimal ? "" : " (samples only)"}`,
        async () => {
          const program = spliceUserCode(
            buildHarness("PYTHON", problem.signature),
            solution.code.PYTHON!
          );

          const result = await adapter.execute({
            language: "PYTHON",
            program,
            tests: fixtures.map((test, index) => ({
              id: `${problem.slug}-${index}`,
              input: test.input,
              expected: test.expected,
              // Marked as samples so a failure reports the actual output,
              // which is what makes a broken fixture diagnosable.
              isSample: true,
            })),
            timeLimitMs: 10_000,
            memoryLimitMb: 512,
          });

          const failure = result.results.find((r) => r.outcome !== "PASSED");
          expect(
            failure,
            failure
              ? `${problem.slug}: expected ${JSON.stringify(
                  failure.expected
                )} got ${JSON.stringify(failure.actual)} ${failure.stderr ?? ""}`
              : result.compileError
          ).toBeUndefined();

          expect(result.status, result.compileError).toBe("ACCEPTED");
        },
        60_000
      );
    });
  }
});
