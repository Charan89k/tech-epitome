import { describe, expect, it } from "vitest";

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { normaliseOutput } from "@/lib/code-execution/types";
import { PROBLEMS } from "@/data/problems";
import { formatWireOutput, parseWireInput } from "./wire";

/**
 * The Python tracer, run against every reference solution.
 *
 * The tracer source is extracted from the worker file and executed by the
 * local CPython, which is the same interpreter Pyodide compiles to
 * WebAssembly. Each sample is traced, its return value formatted in the wire
 * format, and compared with the expected output — so a tracer that perturbs
 * the learner's program, or a serialiser that misreads a value, fails here.
 *
 * Skipped when python3 is not installed.
 */

const hasPython = spawnSync("python3", ["--version"]).status === 0;

describe.skipIf(!hasPython)("python trace worker", () => {
  it("traces every reference solution to its expected sample output", () => {
    const worker = readFileSync(
      resolve(import.meta.dirname, "../../../public/trace/python-worker.js"),
      "utf8"
    );
    const start = worker.indexOf("String.raw`") + "String.raw`".length;
    const tracer = worker.slice(start, worker.indexOf("`;", start));

    const requests: string[] = [];
    const cases: {
      slug: string;
      expected: string;
      returns: (typeof PROBLEMS)[number]["signature"]["returns"];
    }[] = [];
    for (const problem of PROBLEMS) {
      const code = problem.solutions.at(-1)!.code.PYTHON!;
      for (const test of problem.tests.filter((t) => t.isSample)) {
        const parsed = parseWireInput(problem.signature, test.input);
        expect(parsed.ok, `${problem.slug} sample parses`).toBe(true);
        if (!parsed.ok) continue;
        requests.push(
          JSON.stringify({
            code,
            functionName: problem.signature.functionName,
            params: problem.signature.params,
            args: parsed.args,
            limits: { maxSteps: 1500, maxLines: 2_000_000 },
          })
        );
        cases.push({
          slug: problem.slug,
          expected: test.expected,
          returns: problem.signature.returns,
        });
      }
    }

    const dir = mkdtempSync(join(tmpdir(), "trace-"));
    try {
      writeFileSync(
        join(dir, "driver.py"),
        `${tracer}\nimport sys as _s\nfor _line in open(_s.argv[1]):\n    print(_run(_line.strip()))\n`
      );
      writeFileSync(join(dir, "requests.jsonl"), requests.join("\n") + "\n");
      const lines = execFileSync(
        "python3",
        [join(dir, "driver.py"), join(dir, "requests.jsonl")],
        {
          maxBuffer: 1 << 30,
        }
      )
        .toString()
        .trim()
        .split("\n");

      expect(lines).toHaveLength(cases.length);
      lines.forEach((line, index) => {
        const result = JSON.parse(line);
        const { slug, expected, returns } = cases[index]!;
        expect(result.ok, `${slug}: ${result.error}`).toBe(true);
        expect(result.steps.length, `${slug} recorded steps`).toBeGreaterThan(0);
        const got = formatWireOutput(returns, result.returnValue, result.returnHeap);
        expect(normaliseOutput(got), slug).toBe(normaliseOutput(expected));
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
