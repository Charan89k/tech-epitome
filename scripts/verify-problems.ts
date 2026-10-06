/**
 * Verifies problems before they are published.
 *
 *   npx tsx scripts/verify-problems.ts                 every problem
 *   npx tsx scripts/verify-problems.ts --file greedy   problems from src/data/problems/greedy.ts
 *   npx tsx scripts/verify-problems.ts slug-a slug-b   just those
 *
 * Run with `--conditions=react-server` (the npm script does) so the
 * executor's `server-only` guard allows a Node script to import it.
 *
 * For each problem it checks, and refuses to pass unless all hold:
 *
 *   1. Authoring rules: unique slug, a real learning objective, 3-4 hints,
 *      samples and hidden tests, known patterns, Python AND Java solutions.
 *   2. Every reference solution, in every language it is written in, passes
 *      every test through the real harness (the local subprocess executor).
 *   3. Every sample traces cleanly in the live visualizer's Python tracer
 *      and stays small enough to draw.
 *
 * A wrong expected value is worse than a missing problem — a learner with a
 * correct answer is told it failed — so nothing here is advisory.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PATTERNS } from "../src/data/patterns";
import { PROBLEMS, type ProblemSeed } from "../src/data/problems";
import { LocalExecutionAdapter } from "../src/lib/code-execution/local-adapter";
import { buildHarness, spliceUserCode } from "../src/lib/code-execution/signature";
import { normaliseOutput } from "../src/lib/code-execution/types";
import { formatWireOutput, parseWireInput } from "../src/lib/trace/wire";

const args = process.argv.slice(2);
let selected: ProblemSeed[] = PROBLEMS;
if (args[0] === "--file") {
  const source = readFileSync(join("src/data/problems", `${args[1]}.ts`), "utf8");
  const slugs = new Set([...source.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((m) => m[1]));
  selected = PROBLEMS.filter((p) => slugs.has(p.slug));
  if (selected.length === 0) {
    console.error(`No problems found in src/data/problems/${args[1]}.ts (is it exported from index.ts?)`);
    process.exit(1);
  }
} else if (args.length > 0) {
  selected = PROBLEMS.filter((p) => args.includes(p.slug));
}

const patternSlugs = new Set(PATTERNS.map((p) => p.slug));
const errors: string[] = [];
const fail = (slug: string, message: string) => errors.push(`${slug}: ${message}`);

// ---- 1. Authoring rules ---------------------------------------------------
const seen = new Map<string, number>();
for (const p of PROBLEMS) seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
for (const p of selected) {
  if ((seen.get(p.slug) ?? 0) > 1) fail(p.slug, "duplicate slug");
  if (p.learningObjective.length < 30) fail(p.slug, "learningObjective too short");
  if (p.hints.length < 3 || p.hints.length > 4) fail(p.slug, `needs 3-4 hints, has ${p.hints.length}`);
  const samples = p.tests.filter((t) => t.isSample);
  const hidden = p.tests.filter((t) => !t.isSample);
  if (samples.length < 2) fail(p.slug, "needs at least 2 sample tests");
  if (hidden.length < 4) fail(p.slug, "needs at least 4 hidden tests");
  for (const slug of p.patterns) if (!patternSlugs.has(slug)) fail(p.slug, `unknown pattern ${slug}`);
  if (p.topics.length === 0) fail(p.slug, "needs a topic");
  if (p.statement.length === 0) fail(p.slug, "empty statement");
  const best = p.solutions.at(-1);
  if (!best?.code.PYTHON || !best.code.JAVA) fail(p.slug, "final solution needs PYTHON and JAVA");
  for (const test of p.tests) {
    const parsed = parseWireInput(p.signature, test.input);
    if (!parsed.ok) fail(p.slug, `test input does not parse: ${parsed.error} — ${JSON.stringify(test.input).slice(0, 60)}`);
  }
}

// ---- 2. Reference solutions through the real harness ----------------------
const adapter = new LocalExecutionAdapter();
const LANGS = ["PYTHON", "JAVA", "JAVASCRIPT", "CPP"] as const;

async function runSolutions() {
  for (const p of selected) {
    for (const [i, solution] of p.solutions.entries()) {
      for (const language of LANGS) {
        const code = solution.code[language];
        if (!code) continue;
        const result = await adapter.execute({
          language,
          program: spliceUserCode(buildHarness(language, p.signature), code),
          // Solutions are authored worst to best, and the brute force is
          // often meant to be too slow for the large hidden cases — that is
          // the lesson. Earlier approaches must be correct on the samples;
          // the final one must pass everything.
          tests: (i === p.solutions.length - 1 ? p.tests : p.tests.filter((t) => t.isSample)).map(
            (t, k) => ({ id: String(k), input: t.input, expected: t.expected, isSample: true })
          ),
          timeLimitMs: 10_000,
          memoryLimitMb: 512,
        });
        if (result.status !== "ACCEPTED") {
          const bad = result.results.find((r) => r.outcome !== "PASSED");
          fail(
            p.slug,
            `solution ${i + 1} (${solution.title}) ${language}: ${result.status}` +
              (result.compileError ? ` — ${result.compileError.slice(0, 300)}` : "") +
              (bad
                ? ` — input ${JSON.stringify(bad.input).slice(0, 80)} expected ${JSON.stringify(bad.expected).slice(0, 60)} got ${JSON.stringify(bad.actual).slice(0, 60)} ${bad.stderr?.slice(0, 200) ?? ""}`
                : "")
          );
        }
      }
    }
  }
}

// ---- 3. Samples through the visualizer's tracer ---------------------------
function traceSamples() {
  const worker = readFileSync("public/trace/python-worker.js", "utf8");
  const start = worker.indexOf("String.raw`") + "String.raw`".length;
  const tracer = worker.slice(start, worker.indexOf("`;", start));
  const requests: string[] = [];
  const meta: { slug: string; expected: string; returns: ProblemSeed["signature"]["returns"] }[] = [];
  for (const p of selected) {
    const code = p.solutions.at(-1)?.code.PYTHON;
    if (!code) continue;
    for (const t of p.tests.filter((x) => x.isSample)) {
      const parsed = parseWireInput(p.signature, t.input);
      if (!parsed.ok) continue;
      requests.push(
        JSON.stringify({
          code,
          functionName: p.signature.functionName,
          params: p.signature.params,
          args: parsed.args,
          limits: { maxSteps: 1500, maxLines: 2_000_000 },
        })
      );
      meta.push({ slug: p.slug, expected: t.expected, returns: p.signature.returns });
    }
  }
  if (requests.length === 0) return;
  const dir = mkdtempSync(join(tmpdir(), "verify-"));
  try {
    writeFileSync(join(dir, "d.py"), `${tracer}\nimport sys as _s\nfor _l in open(_s.argv[1]):\n    print(_run(_l.strip()))\n`);
    writeFileSync(join(dir, "r.jsonl"), requests.join("\n") + "\n");
    const lines = execFileSync("python3", [join(dir, "d.py"), join(dir, "r.jsonl")], { maxBuffer: 1 << 30 })
      .toString()
      .trim()
      .split("\n");
    lines.forEach((line, k) => {
      const r = JSON.parse(line);
      const m = meta[k]!;
      if (!r.ok) return fail(m.slug, `sample does not trace: ${r.error}`);
      if (r.truncated) fail(m.slug, "sample trace exceeds 1500 steps — use a smaller sample so the visual stays watchable");
      const got = formatWireOutput(m.returns, r.returnValue, r.returnHeap);
      if (normaliseOutput(got) !== normaliseOutput(m.expected)) {
        fail(m.slug, `traced output ${JSON.stringify(got)} != expected ${JSON.stringify(m.expected)}`);
      }
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  await runSolutions();
  traceSamples();

  if (errors.length) {
    console.error(`\n${errors.length} problem(s) found:\n  ${errors.join("\n  ")}`);
    process.exit(1);
  }
  console.log(
    `OK — ${selected.length} problem(s) verified: rules, every solution in every language, and visual traces.`
  );
}

void main();
