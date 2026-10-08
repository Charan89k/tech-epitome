import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Judge0ExecutionAdapter,
  parseJudge0LanguageIds,
  PUBLIC_JUDGE0_LANGUAGE_IDS,
} from "@/lib/code-execution/judge0-adapter";
import { EXECUTION_LIMITS } from "@/lib/code-execution/limits";
import type { ExecutionResult } from "@/lib/code-execution/types";
import { CANARY, HOSTILE_CASES, type HostileCase } from "./cases";

/**
 * The hostile-program suite: runs every case in ./cases.ts against a real
 * Judge0 server and fails loudly if any isolation property does not hold.
 *
 * Skipped unless a target is configured, so it never runs by accident:
 *
 *   HOSTILE_TARGET_URL      Judge0 base URL (required)
 *   HOSTILE_TARGET_KEY      its X-Auth-Token, if any
 *   HOSTILE_LANGUAGE_IDS    "PYTHON:..,JAVASCRIPT:..,JAVA:..,CPP:.." for that
 *                           server (falls back to JUDGE0_LANGUAGE_IDS)
 *   HOSTILE_INCLUDE_HEAVY   "true" to include resource-exhaustion cases
 *                           (fork bomb, memory, CPU, compile bomb, threads)
 *   HOSTILE_SELF_HOSTED     "true" to also check the server's own
 *                           configuration: auth required, forged limits and
 *                           enable_network refused
 *   HOSTILE_HOST_CHECK      optional shell command run after every case to
 *                           check the VM itself, e.g.
 *                           ssh judge0 'uptime && docker compose ps'
 *   HOSTILE_REPORT_DIR      where to write the report (test-results/hostile)
 *
 * A server we do not operate (the public ce.judge0.com, RapidAPI) only ever
 * gets the non-heavy cases, and only with HOSTILE_ALLOW_THIRD_PARTY=true.
 * Exhausting someone else's sandbox on purpose is abuse, not testing.
 *
 *   npm run security:hostile
 */

const URL_ = process.env.HOSTILE_TARGET_URL ?? "";
const KEY = process.env.HOSTILE_TARGET_KEY || undefined;
const host = URL_ ? new URL(URL_).host : "";
const THIRD_PARTY = /(^|\.)judge0\.com$|rapidapi\.com$/.test(host);
const ALLOWED = Boolean(URL_) && (!THIRD_PARTY || process.env.HOSTILE_ALLOW_THIRD_PARTY === "true");
const HEAVY = process.env.HOSTILE_INCLUDE_HEAVY === "true" && !THIRD_PARTY;
const SELF_HOSTED = process.env.HOSTILE_SELF_HOSTED === "true" && !THIRD_PARTY;
const LANGUAGE_IDS = (() => {
  const raw = process.env.HOSTILE_LANGUAGE_IDS || process.env.JUDGE0_LANGUAGE_IDS;
  return raw ? parseJudge0LanguageIds(raw) : PUBLIC_JUDGE0_LANGUAGE_IDS;
})();

type Row = {
  id: string;
  title: string;
  language: string;
  expected: string[];
  actual: string;
  verdictOk: boolean;
  violation: string | null;
  /** The sandbox returned a verdict instead of an executor failure. */
  sandboxSurvived: boolean;
  /** The canary ran correctly straight afterwards. */
  workerHealthy: boolean;
  /** Output of HOSTILE_HOST_CHECK, or "not checked". */
  hostCheck: string;
  durationMs: number;
  evidence: string;
};

const rows: Row[] = [];
const configRows: { check: string; ok: boolean; detail: string }[] = [];

const adapter = new Judge0ExecutionAdapter({ url: URL_ || "http://unset", key: KEY, languageIds: LANGUAGE_IDS });

function run(language: HostileCase["language"], source: string): Promise<ExecutionResult> {
  return adapter.execute({
    language,
    program: source,
    // Ask for more than the ceiling on purpose: the adapter must clamp it.
    timeLimitMs: 60_000,
    memoryLimitMb: 4_096,
    tests: [{ id: "hostile", input: "", expected: null, isSample: true }],
  });
}

async function canary(): Promise<boolean> {
  try {
    const result = await run(CANARY.language, CANARY.source);
    return result.status === "ACCEPTED" && (result.results[0]?.actual ?? "").includes(CANARY.expect);
  } catch {
    return false;
  }
}

function hostCheck(): string {
  const command = process.env.HOSTILE_HOST_CHECK;
  if (!command) return "not checked";
  try {
    return execFileSync("sh", ["-c", command], { timeout: 30_000 }).toString().trim().slice(0, 300);
  } catch (error) {
    return `HOST CHECK FAILED: ${(error as Error).message.slice(0, 200)}`;
  }
}

function headers(withKey: boolean): Record<string, string> {
  return { "content-type": "application/json", ...(withKey && KEY ? { "x-auth-token": KEY } : {}) };
}

describe.skipIf(!ALLOWED)(`hostile programs against ${host || "(no target)"}`, () => {
  beforeAll(async () => {
    expect(await canary(), "the target must run a trivial program before testing").toBe(true);
  }, 120_000);

  afterAll(() => {
    const dir = process.env.HOSTILE_REPORT_DIR ?? join("test-results", "hostile");
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = join(dir, `${host.replace(/[^a-z0-9.-]/gi, "_")}-${stamp}`);
    writeFileSync(`${base}.json`, JSON.stringify({ target: host, heavy: HEAVY, selfHosted: SELF_HOSTED, limits: EXECUTION_LIMITS, rows, configRows }, null, 2));
    const md = [
      `# Hostile-program report: ${host}`,
      "",
      `Run ${new Date().toISOString()}. Heavy cases: ${HEAVY ? "included" : "skipped"}. ` +
        `Server-configuration checks: ${SELF_HOSTED ? "included" : "skipped"}.`,
      "",
      "| Case | Lang | Expected | Actual | Verdict | Isolation | Sandbox survived | Worker healthy | Host |",
      "|---|---|---|---|---|---|---|---|---|",
      ...rows.map(
        (r) =>
          `| ${r.title} | ${r.language} | ${r.expected.join(" / ")} | ${r.actual} | ${r.verdictOk ? "ok" : "**MISMATCH**"} | ${r.violation ? `**VIOLATED: ${r.violation}**` : "held"} | ${r.sandboxSurvived ? "yes" : "**no**"} | ${r.workerHealthy ? "yes" : "**no**"} | ${r.hostCheck.replace(/\|/g, "/").replace(/\n/g, " ")} |`
      ),
      ...(configRows.length
        ? ["", "## Server configuration", "", "| Check | Result | Detail |", "|---|---|---|", ...configRows.map((c) => `| ${c.check} | ${c.ok ? "ok" : "**FAILED**"} | ${c.detail} |`)]
        : []),
      "",
      "## Evidence (stdout excerpts)",
      "",
      ...rows.flatMap((r) => [`### ${r.title}`, "", "```", r.evidence || "(no output)", "```", ""]),
    ].join("\n");
    writeFileSync(`${base}.md`, md);
    console.log(`[hostile] report written to ${base}.md`);
  });

  for (const testCase of HOSTILE_CASES.filter((c) => HEAVY || !c.heavy)) {
    it(
      `${testCase.title} (${testCase.language})`,
      async () => {
        const started = Date.now();
        const result = await run(testCase.language, testCase.source);
        const durationMs = Date.now() - started;
        const first = result.results[0];
        const stdout = first?.actual ?? "";
        const stderr = first?.stderr ?? result.compileError ?? "";

        const violation = testCase.violation({ result, stdout, stderr });
        const verdictOk = testCase.expected.includes(result.status);
        const sandboxSurvived = result.status !== "INTERNAL_ERROR";
        const workerHealthy = await canary();

        rows.push({
          id: testCase.id,
          title: testCase.title,
          language: testCase.language,
          expected: testCase.expected,
          actual: result.status,
          verdictOk,
          violation,
          sandboxSurvived,
          workerHealthy,
          hostCheck: hostCheck(),
          durationMs,
          evidence: `${stdout}${stderr ? `\n--- stderr ---\n${stderr}` : ""}`.slice(0, 2500),
        });

        // Isolation first and loudest: a broken boundary is the failure
        // this suite exists for, whatever verdict came back.
        expect.soft(violation, `ISOLATION VIOLATED (${testCase.id}): ${violation}`).toBeNull();
        expect.soft(sandboxSurvived, `executor failed instead of judging (${testCase.id})`).toBe(true);
        expect.soft(workerHealthy, `worker unhealthy after ${testCase.id}`).toBe(true);
        expect.soft(testCase.expected, `unexpected verdict for ${testCase.id}`).toContain(result.status);
      },
      180_000
    );
  }

  describe.skipIf(!SELF_HOSTED)("server configuration (self-hosted only)", () => {
    const python = LANGUAGE_IDS.PYTHON!;

    async function record(check: string, ok: boolean, detail: string) {
      configRows.push({ check, ok, detail });
      expect.soft(ok, `${check}: ${detail}`).toBe(true);
    }

    it("refuses requests without the auth token", async () => {
      const about = await fetch(`${URL_}/about`, { headers: headers(false) });
      await record("GET /about without token is refused", about.status === 401 || about.status === 403, `HTTP ${about.status}`);

      const create = await fetch(`${URL_}/submissions?base64_encoded=false&wait=false`, {
        method: "POST",
        headers: headers(false),
        body: JSON.stringify({ language_id: python, source_code: "print(1)" }),
      });
      await record("POST /submissions without token is refused", create.status === 401 || create.status === 403, `HTTP ${create.status}`);
    });

    it("refuses a forged request that enables networking", async () => {
      const response = await fetch(`${URL_}/submissions?base64_encoded=false&wait=false`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ language_id: python, source_code: "print(1)", enable_network: true }),
      });
      await record("enable_network=true is refused (ALLOW_ENABLE_NETWORK=false)", response.status === 422, `HTTP ${response.status} ${(await response.text()).slice(0, 160)}`);
    });

    it("refuses forged limits above the server maximums", async () => {
      const forged: [string, Record<string, number>][] = [
        ["cpu_time_limit above MAX_CPU_TIME_LIMIT", { cpu_time_limit: EXECUTION_LIMITS.maxCpuSeconds * 4 }],
        ["wall_time_limit above MAX_WALL_TIME_LIMIT", { wall_time_limit: EXECUTION_LIMITS.maxWallSeconds * 4 }],
        ["memory_limit above MAX_MEMORY_LIMIT", { memory_limit: EXECUTION_LIMITS.maxMemoryMb * 1024 * 8 }],
        ["max_file_size above MAX_MAX_FILE_SIZE", { max_file_size: EXECUTION_LIMITS.maxOutputKb * 16 }],
        ["max_processes above MAX_MAX_PROCESSES_AND_OR_THREADS", { max_processes_and_or_threads: 1000 }],
      ];
      for (const [check, field] of forged) {
        const response = await fetch(`${URL_}/submissions?base64_encoded=false&wait=false`, {
          method: "POST",
          headers: headers(true),
          body: JSON.stringify({ language_id: python, source_code: "print(1)", ...field }),
        });
        await record(`${check} is refused`, response.status === 422, `HTTP ${response.status}`);
      }
    });

    it("refuses a batch larger than the configured maximum", async () => {
      const submissions = Array.from({ length: EXECUTION_LIMITS.maxBatchSize + 1 }, () => ({ language_id: python, source_code: "print(1)" }));
      const response = await fetch(`${URL_}/submissions/batch?base64_encoded=false`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ submissions }),
      });
      await record("batch above MAX_SUBMISSION_BATCH_SIZE is refused", response.status === 422 || response.status === 400, `HTTP ${response.status}`);
    });
  });
});

describe.skipIf(ALLOWED || !URL_)("hostile programs: target refused", () => {
  it("does not run against a third-party server without explicit consent", () => {
    expect(THIRD_PARTY).toBe(true);
  });
});
