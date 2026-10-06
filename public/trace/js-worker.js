/*
 * Live-trace worker for JavaScript.
 *
 * Runs a learner's code that `src/lib/trace/instrument-js.ts` has already
 * rewritten to call the hooks below, and posts back a list of snapshots.
 *
 * Served with its own Content-Security-Policy (see src/proxy.ts): eval is
 * allowed here because running the learner's code is the point, and
 * connect-src is limited to the CDN, so code typed into the editor cannot
 * call this site's API with the learner's cookies.
 *
 * Plain JavaScript on purpose: it is loaded as a static file, outside the
 * bundler, so it can carry a different policy from the page that starts it.
 */
"use strict";

function ListNode(val, next) {
  this.val = val === undefined ? 0 : val;
  this.next = next === undefined ? null : next;
}

let LIMITS = { maxSteps: 1500, maxLines: 2000000 };
let steps = [];
let executed = 0;
let truncated = false;
let stack = [];
let nodeIds = new WeakMap();
let nextNodeId = 1;

class TraceLimit extends Error {}

function isNode(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "val" in value &&
    "next" in value
  );
}

function nodeId(node) {
  let id = nodeIds.get(node);
  if (id === undefined) {
    id = nextNodeId++;
    nodeIds.set(node, id);
  }
  return id;
}

const CAP = 200;

function ser(value, heap, depth) {
  if (value === null || value === undefined) return { t: "null" };
  switch (typeof value) {
    case "number":
      return Number.isFinite(value) ? { t: "num", v: value } : { t: "other", repr: String(value) };
    case "bigint":
      return { t: "num", v: Number(value) };
    case "string":
      return { t: "str", v: value.length > 400 ? value.slice(0, 400) + "…" : value };
    case "boolean":
      return { t: "bool", v: value };
    case "function":
    case "symbol":
      return null;
  }
  if (isNode(value)) {
    let node = value;
    let guard = 0;
    while (isNode(node) && guard < 300) {
      const id = nodeId(node);
      if (heap[id]) break;
      heap[id] = { val: { t: "null" }, next: null };
      heap[id].val = ser(node.val, heap, depth + 1) || { t: "null" };
      heap[id].next = isNode(node.next) ? nodeId(node.next) : null;
      node = node.next;
      guard++;
    }
    return { t: "node", id: nodeId(value) };
  }
  if (depth > 3) return { t: "other", repr: "…" };
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    const items = [];
    const n = Math.min(value.length, CAP);
    for (let i = 0; i < n; i++) items.push(ser(value[i], heap, depth + 1) || { t: "null" });
    return value.length > CAP ? { t: "arr", items, more: value.length - CAP } : { t: "arr", items };
  }
  if (value instanceof Map) {
    const entries = [];
    for (const [k, v] of value) {
      if (entries.length >= CAP) break;
      entries.push([ser(k, heap, depth + 1) || { t: "null" }, ser(v, heap, depth + 1) || { t: "null" }]);
    }
    return value.size > CAP ? { t: "map", entries, more: value.size - CAP } : { t: "map", entries };
  }
  if (value instanceof Set) {
    const items = [];
    for (const v of value) {
      if (items.length >= CAP) break;
      items.push(ser(v, heap, depth + 1) || { t: "null" });
    }
    return value.size > CAP ? { t: "set", items, more: value.size - CAP } : { t: "set", items };
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) {
    // A plain object used as a dictionary, which is how most JavaScript
    // solutions count things.
    const keys = Object.keys(value);
    const entries = keys
      .slice(0, CAP)
      .map((k) => [{ t: "str", v: k }, ser(value[k], heap, depth + 1) || { t: "null" }]);
    return keys.length > CAP ? { t: "map", entries, more: keys.length - CAP } : { t: "map", entries };
  }
  const fields = {};
  for (const k of Object.keys(value).slice(0, 12)) {
    const v = ser(value[k], heap, depth + 1);
    if (v) fields[k] = v;
  }
  return { t: "obj", name: (proto && proto.constructor && proto.constructor.name) || "Object", fields };
}

function snapshot(line, event, snap, returnValue) {
  const heap = {};
  const locals = {};
  if (snap) {
    let vars;
    try {
      vars = snap();
    } catch {
      vars = {};
    }
    for (const name of Object.keys(vars)) {
      const v = ser(vars[name], heap, 0);
      if (v) locals[name] = v;
    }
  }
  const step = {
    line,
    event,
    stack: stack.map((f) => ({ func: f.func, line: f.line })),
    locals,
    heap,
  };
  if (event === "return") step.returnValue = ser(returnValue, heap, 0) || { t: "null" };
  return step;
}

function tick() {
  if (++executed > LIMITS.maxLines) {
    throw new TraceLimit(
      `Stopped after ${LIMITS.maxLines.toLocaleString()} executed lines — is there an infinite loop?`
    );
  }
}

function record(step) {
  if (steps.length < LIMITS.maxSteps) steps.push(step);
  else truncated = true;
}

function __tk() {
  tick();
}

function __tl(line, snap) {
  tick();
  if (stack.length) stack[stack.length - 1].line = line;
  if (steps.length < LIMITS.maxSteps) record(snapshot(line, "line", snap));
  else truncated = true;
}

function __tr(line, value, snap) {
  if (stack.length) stack[stack.length - 1].line = line;
  if (steps.length < LIMITS.maxSteps) record(snapshot(line, "return", snap, value));
  else truncated = true;
  return value;
}

function __te(name) {
  stack.push({ func: name, line: 0 });
}

function __tx() {
  stack.pop();
}

function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head);
  return head;
}

self.onmessage = (event) => {
  const { id, code, functionName, params, args, limits } = event.data;
  LIMITS = limits || LIMITS;
  steps = [];
  executed = 0;
  truncated = false;
  stack = [];
  nodeIds = new WeakMap();
  nextNodeId = 1;

  const out = [];
  const print = (...parts) => {
    if (out.length < 500) out.push(parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(" "));
  };
  const fakeConsole = { log: print, info: print, warn: print, error: print, debug: print };

  const lastLine = () => (steps.length ? steps[steps.length - 1].line : undefined);

  let fn;
  try {
    // The hooks and ListNode are passed in as parameters so the learner's
    // code sees them as ordinary bindings; nothing is put on `self`.
    const factory = new Function(
      "__tl",
      "__tr",
      "__te",
      "__tx",
      "__tk",
      "ListNode",
      "console",
      `"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`
    );
    fn = factory(__tl, __tr, __te, __tx, __tk, ListNode, fakeConsole);
  } catch (error) {
    self.postMessage({
      id,
      result: { ok: false, error: `${error.name}: ${error.message}`, steps: [], stdout: out.join("\n"), truncated: false },
    });
    return;
  }

  if (typeof fn !== "function") {
    self.postMessage({
      id,
      result: {
        ok: false,
        error: `No function named ${functionName} was found. Keep the starter's function name.`,
        steps: [],
        stdout: out.join("\n"),
        truncated: false,
      },
    });
    return;
  }

  const callArgs = args.map((arg, i) => (params[i] === "list" ? buildList(arg) : arg));

  try {
    const returned = fn(...callArgs);
    const heap = {};
    const returnValue = ser(returned, heap, 0) || { t: "null" };
    self.postMessage({
      id,
      result: { ok: true, steps, returnValue, returnHeap: heap, stdout: out.join("\n"), truncated },
    });
  } catch (error) {
    const message =
      error instanceof TraceLimit
        ? error.message
        : `${(error && error.name) || "Error"}: ${(error && error.message) || String(error)}`;
    self.postMessage({
      id,
      result: { ok: false, error: message, line: lastLine(), steps, stdout: out.join("\n"), truncated },
    });
  }
};
