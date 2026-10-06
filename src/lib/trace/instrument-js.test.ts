import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

import type { ParamType } from "@/lib/code-execution/signature";
import { instrumentJs } from "./instrument-js";
import type { TraceStep, TraceValue } from "./types";

/**
 * The instrumenter and the worker runtime, exercised together.
 *
 * The worker file is loaded into a VM context with a fake `self`, so these
 * tests run the exact code a browser would, rather than a copy of it.
 */

const WORKER_SOURCE = readFileSync(
  resolve(import.meta.dirname, "../../../public/trace/js-worker.js"),
  "utf8"
);

type Result = {
  ok: boolean;
  error?: string;
  line?: number;
  steps: TraceStep[];
  returnValue?: TraceValue;
  stdout: string;
  truncated: boolean;
};

function run(
  source: string,
  functionName: string,
  params: ParamType[],
  args: unknown[],
  limits = { maxSteps: 1500, maxLines: 2_000_000 }
): Result {
  const instrumented = instrumentJs(source);
  if (!instrumented.ok) throw new Error(instrumented.error);

  let posted: { result: Result } | undefined;
  const self: Record<string, unknown> = {
    postMessage: (message: { result: Result }) => {
      posted = message;
    },
  };
  runInNewContext(WORKER_SOURCE, { self });
  (self.onmessage as (event: unknown) => void)({
    data: { id: 1, code: instrumented.code, functionName, params, args, limits },
  });
  if (!posted) throw new Error("worker posted nothing");
  return posted.result;
}

const num = (v: TraceValue | undefined) => (v && v.t === "num" ? v.v : undefined);
const arr = (v: TraceValue | undefined) =>
  v && v.t === "arr"
    ? v.items.map((item) => (item.t === "num" ? item.v : null))
    : undefined;

describe("instrumentJs", () => {
  it("reports a syntax error with its line instead of throwing", () => {
    const result = instrumentJs("function f() {\n  return (;\n}");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.line).toBe(2);
  });

  it("leaves top-level statements untraced and preserves behaviour", () => {
    const result = run(
      `const OFFSET = 10;\nfunction add(a, b) {\n  const s = a + b;\n  return s + OFFSET;\n}`,
      "add",
      ["int", "int"],
      [2, 3]
    );
    expect(result.ok).toBe(true);
    expect(num(result.returnValue)).toBe(15);
    expect(result.steps.map((s) => s.line)).toEqual([3, 4, 4]);
  });

  it("records in-place array writes step by step", () => {
    const source = `function compact(a) {
  let w = 0;
  for (let r = 0; r < a.length; r++) {
    if (a[r] !== 0) {
      [a[w], a[r]] = [a[r], a[w]];
      w++;
    }
  }
  return w;
}`;
    const result = run(source, "compact", ["int[]"], [[0, 1, 0, 3]]);
    expect(result.ok).toBe(true);
    expect(num(result.returnValue)).toBe(2);
    const last = result.steps.at(-1)!;
    expect(last.event).toBe("return");
    expect(arr(last.locals.a)).toEqual([1, 3, 0, 0]);
    // The loop variable is visible inside the loop body.
    expect(result.steps.some((s) => "r" in s.locals)).toBe(true);
  });

  it("never reads a let in its temporal dead zone", () => {
    const source = `function f(x) {
  const before = x * 2;
  let later = before + 1;
  const g = () => later;
  return g();
}`;
    const result = run(source, "f", ["int"], [4]);
    expect(result.ok).toBe(true);
    expect(num(result.returnValue)).toBe(9);
    expect("later" in result.steps[0]!.locals).toBe(false);
  });

  it("wraps unbraced statement slots without changing control flow", () => {
    const source = `function sign(n) {
  if (n > 0) return 1;
  else if (n < 0) return -1;
  else return 0
}`;
    expect(num(run(source, "sign", ["int"], [5]).returnValue)).toBe(1);
    expect(num(run(source, "sign", ["int"], [-5]).returnValue)).toBe(-1);
    expect(num(run(source, "sign", ["int"], [0]).returnValue)).toBe(0);
  });

  it("keeps labeled continue valid", () => {
    const source = `function pairs(n) {
  let count = 0;
  outer: for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (j > i) continue outer;
      count++;
    }
  }
  return count;
}`;
    expect(num(run(source, "pairs", ["int"], [4]).returnValue)).toBe(10);
  });

  it("tracks the call stack through recursion", () => {
    const source = `function climb(n) {
  if (n <= 1) return 1;
  return climb(n - 1) + climb(n - 2);
}`;
    const result = run(source, "climb", ["int"], [4]);
    expect(num(result.returnValue)).toBe(5);
    const deepest = Math.max(...result.steps.map((s) => s.stack.length));
    expect(deepest).toBe(4);
    expect(result.steps[0]!.stack).toEqual([{ func: "climb", line: 2 }]);
  });

  it("serialises Maps, Sets and plain-object counters", () => {
    const source = `function f(s) {
  const counts = {};
  const seen = new Set();
  const last = new Map();
  for (let i = 0; i < s.length; i++) {
    counts[s[i]] = (counts[s[i]] || 0) + 1;
    seen.add(s[i]);
    last.set(s[i], i);
  }
  return seen.size;
}`;
    const result = run(source, "f", ["string"], ["abca"]);
    expect(num(result.returnValue)).toBe(3);
    const final = result.steps.at(-1)!.locals;
    expect(final.counts?.t).toBe("map");
    expect(final.seen?.t).toBe("set");
    expect(final.last?.t).toBe("map");
  });

  it("builds linked lists and records the rewired heap", () => {
    const source = `function reverse(head) {
  let prev = null;
  let node = head;
  while (node !== null) {
    const nxt = node.next;
    node.next = prev;
    prev = node;
    node = nxt;
  }
  return prev;
}`;
    const result = run(source, "reverse", ["list"], [[1, 2, 3]]);
    expect(result.ok).toBe(true);
    const last = result.steps.at(-1)!;
    const prev = last.locals.prev;
    expect(prev?.t).toBe("node");
    // Walk the reversed chain from the heap.
    const values: number[] = [];
    let id = prev?.t === "node" ? prev.id : null;
    while (id !== null) {
      const node = last.heap[id]!;
      values.push(num(node.val)!);
      id = node.next;
    }
    expect(values).toEqual([3, 2, 1]);
  });

  it("stops an infinite loop with a message rather than hanging", () => {
    const result = run(`function spin() {\n  while (true) {}\n}`, "spin", [], [], {
      maxSteps: 50,
      maxLines: 10_000,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/infinite loop/);
  });

  it("caps recorded steps and says so", () => {
    const source = `function sum(n) {\n  let s = 0;\n  for (let i = 0; i < n; i++) s += i;\n  return s;\n}`;
    const result = run(source, "sum", ["int"], [1000], {
      maxSteps: 20,
      maxLines: 2_000_000,
    });
    expect(result.ok).toBe(true);
    expect(num(result.returnValue)).toBe(499500);
    expect(result.steps).toHaveLength(20);
    expect(result.truncated).toBe(true);
  });

  it("reports a missing entry point clearly", () => {
    const result = run(`function other() { return 1; }`, "wanted", [], []);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No function named wanted/);
  });

  it("captures console output", () => {
    const result = run(
      `function f() {\n  console.log("hi", 2);\n  return 1;\n}`,
      "f",
      [],
      []
    );
    expect(result.stdout).toBe("hi 2");
  });
});
