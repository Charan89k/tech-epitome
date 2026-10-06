/*
 * Live-trace worker for Python, on Pyodide (CPython compiled to WebAssembly).
 *
 * The learner's code is compiled under the filename "<solution>" and run
 * with sys.settrace, which reports every line before it executes. Frames
 * from any other file — the tracer itself, the standard library — are
 * ignored, so the trace contains only lines the learner wrote.
 *
 * Pyodide is a ~10 MB download, so the worker is started once and reused;
 * the runner only ever terminates it to stop a runaway run.
 *
 * Served with its own Content-Security-Policy (see src/proxy.ts) that allows
 * WebAssembly and the Pyodide CDN, and nothing else on the network.
 */
"use strict";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/`;

importScripts(`${PYODIDE_BASE}pyodide.js`);

const TRACER = String.raw`
import sys, io, json, math, traceback, types
from typing import *
import collections
from collections import deque, defaultdict, Counter, OrderedDict
import heapq, bisect, itertools, functools

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class _TraceLimit(Exception):
    pass

_CAP = 200

def _run(raw):
    req = json.loads(raw)
    limits = req["limits"]
    max_steps, max_lines = limits["maxSteps"], limits["maxLines"]
    steps = []
    state = {"executed": 0, "truncated": False}
    ids = {}
    keep = []

    def node_id(obj):
        key = id(obj)
        if key not in ids:
            ids[key] = len(ids) + 1
            keep.append(obj)  # pin it, so a recycled id() can never alias
        return ids[key]

    def is_node(v):
        return isinstance(v, ListNode) or (
            hasattr(v, "val") and hasattr(v, "next") and not isinstance(v, type)
        )

    def ser(v, heap, depth=0):
        if v is None:
            return {"t": "null"}
        if isinstance(v, bool):
            return {"t": "bool", "v": v}
        if isinstance(v, int):
            if abs(v) > 2**53:
                return {"t": "other", "repr": str(v)}
            return {"t": "num", "v": v}
        if isinstance(v, float):
            if math.isfinite(v):
                return {"t": "num", "v": v}
            return {"t": "other", "repr": repr(v)}
        if isinstance(v, str):
            return {"t": "str", "v": v if len(v) <= 400 else v[:400] + "…"}
        if isinstance(v, (types.FunctionType, types.BuiltinFunctionType, types.ModuleType, type, types.MethodType)):
            return None
        if is_node(v):
            node, guard = v, 0
            while node is not None and is_node(node) and guard < 300:
                nid = node_id(node)
                if nid in heap:
                    break
                heap[nid] = {"val": {"t": "null"}, "next": None}
                heap[nid]["val"] = ser(getattr(node, "val", None), heap, depth + 1) or {"t": "null"}
                nxt = getattr(node, "next", None)
                heap[nid]["next"] = node_id(nxt) if nxt is not None and is_node(nxt) else None
                node, guard = nxt, guard + 1
            return {"t": "node", "id": node_id(v)}
        if depth > 3:
            return {"t": "other", "repr": "…"}
        if isinstance(v, (list, tuple, deque)):
            items = [ser(x, heap, depth + 1) or {"t": "null"} for x in itertools.islice(v, _CAP)]
            out = {"t": "arr", "items": items}
            if len(v) > _CAP:
                out["more"] = len(v) - _CAP
            return out
        if isinstance(v, dict):
            entries = [
                [ser(k, heap, depth + 1) or {"t": "null"}, ser(x, heap, depth + 1) or {"t": "null"}]
                for k, x in itertools.islice(v.items(), _CAP)
            ]
            out = {"t": "map", "entries": entries}
            if len(v) > _CAP:
                out["more"] = len(v) - _CAP
            return out
        if isinstance(v, (set, frozenset)):
            try:
                ordered = sorted(v)
            except TypeError:
                ordered = list(v)
            out = {"t": "set", "items": [ser(x, heap, depth + 1) or {"t": "null"} for x in ordered[:_CAP]]}
            if len(v) > _CAP:
                out["more"] = len(v) - _CAP
            return out
        fields = {}
        for k, x in list(getattr(v, "__dict__", {}).items())[:12]:
            s = ser(x, heap, depth + 1)
            if s is not None:
                fields[k] = s
        return {"t": "obj", "name": type(v).__name__, "fields": fields}

    def user_stack(frame):
        out = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == "<solution>" and not f.f_code.co_name.startswith("<"):
                out.append({"func": f.f_code.co_name, "line": f.f_lineno})
            f = f.f_back
        out.reverse()
        return out

    def snapshot(frame, event, ret=None):
        heap, local_vars = {}, {}
        for name, value in list(frame.f_locals.items()):
            if name.startswith("__"):
                continue
            s = ser(value, heap)
            if s is not None:
                local_vars[name] = s
        step = {"line": frame.f_lineno, "event": event, "stack": user_stack(frame), "locals": local_vars, "heap": heap}
        if event == "return":
            step["returnValue"] = ser(ret, heap) or {"t": "null"}
        return step

    def local_trace(frame, event, arg):
        if event == "line":
            state["executed"] += 1
            if state["executed"] > max_lines:
                raise _TraceLimit(f"Stopped after {max_lines:,} executed lines — is there an infinite loop?")
            if frame.f_code.co_name.startswith("<"):
                return local_trace
            if len(steps) < max_steps:
                steps.append(snapshot(frame, "line"))
            else:
                state["truncated"] = True
        elif event == "return" and not frame.f_code.co_name.startswith("<"):
            if len(steps) < max_steps:
                steps.append(snapshot(frame, "return", arg))
            else:
                state["truncated"] = True
        return local_trace

    def global_trace(frame, event, arg):
        if frame.f_code.co_filename != "<solution>":
            return None
        return local_trace

    stdout = io.StringIO()
    real_stdout = sys.stdout

    def fail(message, line=None):
        return json.dumps({
            "ok": False, "error": message, "line": line, "steps": steps,
            "stdout": stdout.getvalue()[:20000], "truncated": state["truncated"],
        })

    namespace = {"__name__": "__solution__", "ListNode": ListNode}
    for name in ("List", "Optional", "Dict", "Set", "Tuple", "deque", "defaultdict", "Counter",
                 "OrderedDict", "heapq", "bisect", "math", "itertools", "functools", "collections"):
        namespace[name] = globals()[name]

    try:
        compiled = compile(req["code"], "<solution>", "exec")
    except SyntaxError as e:
        return fail(f"SyntaxError: {e.msg}", e.lineno)

    sys.stdout = stdout
    try:
        exec(compiled, namespace)
    except BaseException as e:
        sys.stdout = real_stdout
        return fail(f"{type(e).__name__}: {e}", _error_line(e))

    fn = namespace.get(req["functionName"])
    if not callable(fn):
        sys.stdout = real_stdout
        return fail(f"No function named {req['functionName']} was found. Keep the starter's function name.")

    args = []
    for kind, value in zip(req["params"], req["args"]):
        if kind == "list":
            head = None
            for x in reversed(value):
                head = ListNode(x, head)
            args.append(head)
        else:
            args.append(value)

    sys.settrace(global_trace)
    try:
        result = fn(*args)
    except BaseException as e:
        sys.settrace(None)
        sys.stdout = real_stdout
        return fail(f"{type(e).__name__}: {e}", _error_line(e))
    finally:
        sys.settrace(None)
        sys.stdout = real_stdout

    heap = {}
    return json.dumps({
        "ok": True, "steps": steps, "returnValue": ser(result, heap) or {"t": "null"},
        "returnHeap": heap, "stdout": stdout.getvalue()[:20000], "truncated": state["truncated"],
    })

def _error_line(e):
    line = None
    for frame, lineno in traceback.walk_tb(e.__traceback__):
        if frame.f_code.co_filename == "<solution>":
            line = lineno
    return line
`;

const ready = (async () => {
  const pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
  pyodide.runPython(TRACER);
  return pyodide;
})();

ready.then(
  () => self.postMessage({ type: "ready" }),
  (error) => self.postMessage({ type: "load-error", error: String(error) })
);

self.onmessage = async (event) => {
  const { id, code, functionName, params, args, limits } = event.data;
  let pyodide;
  try {
    pyodide = await ready;
  } catch (error) {
    self.postMessage({
      id,
      result: { ok: false, error: `Could not load Python: ${error}`, steps: [], stdout: "", truncated: false },
    });
    return;
  }
  const run = pyodide.globals.get("_run");
  try {
    const raw = run(JSON.stringify({ code, functionName, params, args, limits }));
    self.postMessage({ id, result: JSON.parse(raw) });
  } catch (error) {
    self.postMessage({
      id,
      result: { ok: false, error: String(error), steps: [], stdout: "", truncated: false },
    });
  } finally {
    run.destroy();
  }
};
