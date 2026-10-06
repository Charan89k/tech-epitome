import { describe, expect, it } from "vitest";

import { PROBLEMS } from "@/data/problems";
import type { Language } from "@/generated/prisma/enums";
import { Judge0ExecutionAdapter } from "./judge0-adapter";
import { buildHarness, spliceUserCode } from "./signature";

/**
 * Every reference solution, through the real harness, on a real Judge0.
 *
 * This is what production runs, so it is the check that the harnesses, the
 * language ids and the status mapping agree with an actual Judge0 — not a
 * fake of one. It makes a network call per problem and language, so it only
 * runs when asked:
 *
 *     JUDGE0_TEST_URL=https://ce.judge0.com npx vitest run judge0.integration
 *
 * Set JUDGE0_TEST_KEY as well for an instance that needs one.
 */

const URL = process.env.JUDGE0_TEST_URL;

describe.skipIf(!URL)("judge0 against the reference solutions", () => {
  for (const language of ["PYTHON", "JAVA"] as Language[]) {
    it(`accepts every ${language} reference solution`, async () => {
      // Built here, not at collection time: a skipped suite still collects,
      // and an empty URL would throw before the skip took effect.
      const adapter = new Judge0ExecutionAdapter({
        url: URL!,
        key: process.env.JUDGE0_TEST_KEY,
      });
      const failures: string[] = [];
      for (const problem of PROBLEMS) {
        const code = problem.solutions.at(-1)!.code[language];
        if (!code) continue;
        const result = await adapter.execute({
          language,
          program: spliceUserCode(buildHarness(language, problem.signature), code),
          tests: problem.tests.map((test, index) => ({
            id: String(index),
            input: test.input,
            expected: test.expected,
            isSample: Boolean(test.isSample),
          })),
          timeLimitMs: 4000,
          memoryLimitMb: 256,
        });
        if (result.status !== "ACCEPTED") {
          failures.push(
            `${problem.slug}: ${result.status} ${result.compileError ?? ""} ${
              result.results.find((r) => r.outcome !== "PASSED")?.stderr ?? ""
            }`.slice(0, 300)
          );
        }
      }
      expect(failures).toEqual([]);
    }, 900_000);
  }
});
