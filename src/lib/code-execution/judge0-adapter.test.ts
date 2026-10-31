import { describe, expect, it, vi } from "vitest";

import { Judge0ExecutionAdapter, parseJudge0LanguageIds } from "./judge0-adapter";
import type { ExecutionRequest } from "./types";

/**
 * The Judge0 adapter against a fake server.
 *
 * The fake implements the two endpoints the adapter uses — batch create and
 * batch poll — and answers with whatever per-test results a case needs, so
 * status mapping, the hidden-test rules and the auth headers are checked
 * without a network.
 */

type Fake = { status: number; stdout?: string; stderr?: string; compile?: string };

function server(
  results: Fake[],
  options: { pendingPolls?: number; createStatus?: number } = {}
) {
  let polls = 0;
  const calls: { url: string; init?: RequestInit }[] = [];
  const b64 = (v?: string) =>
    v === undefined ? null : Buffer.from(v).toString("base64");
  const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (
      String(url).includes("/submissions/batch?base64_encoded=true") &&
      init?.method === "POST"
    ) {
      if (options.createStatus)
        return new Response("", { status: options.createStatus });
      const body = JSON.parse(String(init.body)) as { submissions: unknown[] };
      return Response.json(body.submissions.map((_, i) => ({ token: `t${i}` })));
    }
    polls++;
    const pending = polls <= (options.pendingPolls ?? 0);
    return Response.json({
      submissions: results.map((r) => ({
        stdout: b64(r.stdout),
        stderr: b64(r.stderr),
        compile_output: b64(r.compile),
        message: null,
        time: "0.05",
        memory: 9000,
        status: { id: pending ? 2 : r.status, description: "" },
      })),
    });
  });
  return { fetcher: fetcher as unknown as typeof fetch, calls };
}

function request(tests: { expected: string; isSample: boolean }[]): ExecutionRequest {
  return {
    language: "PYTHON",
    program: "print(1)",
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tests: tests.map((t, i) => ({ id: `c${i}`, input: `in${i}`, ...t })),
  };
}

describe("Judge0ExecutionAdapter", () => {
  it("accepts when every test's output matches", async () => {
    const { fetcher } = server([
      { status: 3, stdout: "4\n" },
      { status: 4, stdout: "9" },
    ]);
    const adapter = new Judge0ExecutionAdapter({
      url: "https://judge.test",
      fetch: fetcher,
    });
    const result = await adapter.execute(
      request([
        { expected: "4", isSample: true },
        { expected: "9", isSample: false },
      ])
    );
    expect(result.status).toBe("ACCEPTED");
    expect(result.passed).toBe(2);
    expect(result.memoryKb).toBe(9000);
    // Sample cases carry their I/O back; hidden ones never do.
    expect(result.results[0]!.input).toBe("in0");
    expect(result.results[1]!.input).toBeUndefined();
  });

  it("compares output itself rather than trusting Judge0's verdict", async () => {
    const { fetcher } = server([{ status: 3, stdout: "5" }]);
    const adapter = new Judge0ExecutionAdapter({
      url: "https://judge.test",
      fetch: fetcher,
    });
    const result = await adapter.execute(request([{ expected: "4", isSample: true }]));
    expect(result.status).toBe("WRONG_ANSWER");
  });

  it("maps time limits, runtime errors and compile errors", async () => {
    const tle = server([{ status: 5 }]);
    expect(
      (
        await new Judge0ExecutionAdapter({
          url: "https://j.test",
          fetch: tle.fetcher,
        }).execute(request([{ expected: "1", isSample: true }]))
      ).status
    ).toBe("TIME_LIMIT_EXCEEDED");

    const crash = server([{ status: 11, stderr: "ZeroDivisionError" }]);
    const crashed = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: crash.fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(crashed.status).toBe("RUNTIME_ERROR");
    expect(crashed.results[0]!.stderr).toContain("ZeroDivisionError");

    const compile = server([
      { status: 6, compile: "Main.java:3: error: ';' expected" },
    ]);
    const compiled = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: compile.fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(compiled.status).toBe("COMPILE_ERROR");
    expect(compiled.compileError).toContain("';' expected");
  });

  it("stops reporting at the first failing hidden test", async () => {
    const { fetcher } = server([
      { status: 3, stdout: "1" },
      { status: 3, stdout: "wrong" },
      { status: 3, stdout: "3" },
    ]);
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(
      request([
        { expected: "1", isSample: true },
        { expected: "2", isSample: false },
        { expected: "3", isSample: false },
      ])
    );
    expect(result.status).toBe("WRONG_ANSWER");
    expect(result.results).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it("keeps polling while the batch is still running", async () => {
    const { fetcher, calls } = server([{ status: 3, stdout: "1" }], {
      pendingPolls: 2,
    });
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(result.status).toBe("ACCEPTED");
    expect(calls.filter((c) => c.init?.method !== "POST")).toHaveLength(3);
  });

  it("reports a rate limit as a retryable message, not a crash", async () => {
    const { fetcher } = server([], { createStatus: 429 });
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(result.status).toBe("INTERNAL_ERROR");
    expect(result.compileError).toMatch(/busy/);
  });

  it("sends RapidAPI headers for RapidAPI and an auth token otherwise", async () => {
    const rapid = server([{ status: 3, stdout: "1" }]);
    await new Judge0ExecutionAdapter({
      url: "https://judge0-ce.p.rapidapi.com",
      key: "rk",
      fetch: rapid.fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    const rapidHeaders = rapid.calls[0]!.init!.headers as Record<string, string>;
    expect(rapidHeaders["x-rapidapi-key"]).toBe("rk");
    expect(rapidHeaders["x-rapidapi-host"]).toBe("judge0-ce.p.rapidapi.com");

    const own = server([{ status: 3, stdout: "1" }]);
    await new Judge0ExecutionAdapter({
      url: "https://judge.example",
      key: "tok",
      fetch: own.fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(
      (own.calls[0]!.init!.headers as Record<string, string>)["x-auth-token"]
    ).toBe("tok");
  });

  it("refuses a language it has no runtime for", async () => {
    const { fetcher } = server([]);
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute({
      ...request([{ expected: "1", isSample: true }]),
      language: "GO",
    });
    expect(result.status).toBe("INTERNAL_ERROR");
  });

  it("maps Judge0's file-size signal to an output-limit verdict", async () => {
    // Status 8 is Runtime Error (SIGXFSZ): on Judge0 stdout is a file, so a
    // print loop trips max_file_size rather than filling memory.
    const { fetcher } = server([{ status: 8, stdout: "AAAA" }]);
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));

    expect(result.status).toBe("OUTPUT_LIMIT_EXCEEDED");
    expect(result.results[0]!.outcome).toBe("OUTPUT_LIMIT");
  });

  it("treats a Python print loop that hit the file-size limit as output-limited", async () => {
    // CPython ignores SIGXFSZ, so on Judge0 it exits with NZEC (11) and EFBIG.
    const { fetcher } = server([
      { status: 11, stderr: "OSError: [Errno 27] File too large" },
    ]);
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(request([{ expected: "1", isSample: true }]));
    expect(result.status).toBe("OUTPUT_LIMIT_EXCEEDED");
  });

  it("reports a custom input as output, never as a verdict", async () => {
    const { fetcher } = server([{ status: 3, stdout: "42\n" }]);
    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute({
      ...request([]),
      tests: [{ id: "custom", input: "1 2", expected: null, isSample: true }],
    });

    expect(result.status).toBe("ACCEPTED");
    expect(result.passed).toBe(0);
    expect(result.results[0]).toMatchObject({ outcome: "COMPLETED", actual: "42\n" });
    expect(result.results[0]).not.toHaveProperty("expected");
  });

  it("clamps every limit and refuses networking, whatever the request asks", async () => {
    const { fetcher, calls } = server([{ status: 3, stdout: "1" }]);
    await new Judge0ExecutionAdapter({ url: "https://j.test", fetch: fetcher }).execute({
      ...request([{ expected: "1", isSample: true }]),
      timeLimitMs: 600_000,
      memoryLimitMb: 64_000,
    });

    const body = JSON.parse(String(calls[0]!.init!.body)) as {
      submissions: Record<string, unknown>[];
    };
    expect(body.submissions[0]).toMatchObject({
      cpu_time_limit: 5,
      wall_time_limit: 10,
      memory_limit: 256 * 1024,
      stack_limit: 64_000,
      max_file_size: 1024,
      max_processes_and_or_threads: 60,
      enable_network: false,
    });
  });

  it("uses configured language ids instead of the public server's", async () => {
    const { fetcher, calls } = server([{ status: 3, stdout: "1" }]);
    await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
      languageIds: { PYTHON: 71 },
    }).execute(request([{ expected: "1", isSample: true }]));

    const body = JSON.parse(String(calls[0]!.init!.body)) as {
      submissions: { language_id: number }[];
    };
    expect(body.submissions[0]!.language_id).toBe(71);
  });

  it("splits large suites into batches of at most 20", async () => {
    const posted: number[] = [];
    const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        const { submissions } = JSON.parse(String(init.body)) as { submissions: unknown[] };
        const offset = posted.reduce((sum, n) => sum + n, 0);
        posted.push(submissions.length);
        return Response.json(submissions.map((_, i) => ({ token: `t${offset + i}` })));
      }
      const tokens = new URL(String(url)).searchParams.get("tokens")!.split(",");
      return Response.json({
        submissions: tokens.map(() => ({
          stdout: Buffer.from("1").toString("base64"),
          stderr: null,
          compile_output: null,
          message: null,
          time: "0.01",
          memory: 1000,
          status: { id: 3, description: "" },
        })),
      });
    }) as unknown as typeof fetch;

    const result = await new Judge0ExecutionAdapter({
      url: "https://j.test",
      fetch: fetcher,
    }).execute(
      request(Array.from({ length: 25 }, () => ({ expected: "1", isSample: false })))
    );

    expect(posted).toEqual([20, 5]);
    expect(result.status).toBe("ACCEPTED");
    expect(result.passed).toBe(25);
  });
});

describe("parseJudge0LanguageIds", () => {
  it("reads LANGUAGE:id pairs", () => {
    expect(parseJudge0LanguageIds("PYTHON:71, JAVASCRIPT:63,JAVA:62,CPP:54")).toEqual({
      PYTHON: 71,
      JAVASCRIPT: 63,
      JAVA: 62,
      CPP: 54,
    });
  });

  it("refuses anything it cannot read exactly", () => {
    // A wrong id would run learner code under a different language.
    expect(() => parseJudge0LanguageIds("PYTHON=71")).toThrow(/LANGUAGE:id/);
    expect(() => parseJudge0LanguageIds("RUBY:72")).toThrow(/LANGUAGE:id/);
    expect(() => parseJudge0LanguageIds("PYTHON:seventy")).toThrow(/LANGUAGE:id/);
  });
});
