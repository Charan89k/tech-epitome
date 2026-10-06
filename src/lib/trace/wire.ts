import type { ParamType, ReturnType, Signature } from "@/lib/code-execution/signature";
import type { HeapNode, TraceStep, TraceValue } from "./types";

/**
 * The test wire format, read and written in TypeScript.
 *
 * The server harnesses parse it in each target language; the browser needs
 * the same parse to hand a sample's arguments to a traced run, and to draw
 * the input before anything has run. The format is defined in
 * `code-execution/signature.ts` and is mirrored here exactly.
 */

/** A parsed argument. Linked lists arrive as their values, in order. */
export type WireValue = number | string | number[] | string[] | number[][];

export type ParsedInput =
  { ok: true; args: WireValue[] } | { ok: false; error: string };

export function parseWireInput(signature: Signature, input: string): ParsedInput {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  let cursor = 0;
  const next = () => (cursor < lines.length ? lines[cursor++]! : "");

  const ints = (raw: string): number[] | null => {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    const parts = trimmed.split(/\s+/).map(Number);
    return parts.every(Number.isInteger) ? parts : null;
  };

  const args: WireValue[] = [];
  for (const [index, type] of signature.params.entries()) {
    const name = signature.paramNames[index] ?? `arg${index}`;
    switch (type) {
      case "int": {
        const value = Number(next().trim());
        if (!Number.isInteger(value))
          return { ok: false, error: `${name} must be an integer.` };
        args.push(value);
        break;
      }
      case "string":
        args.push(next());
        break;
      case "int[]":
      case "list": {
        const values = ints(next());
        if (!values)
          return { ok: false, error: `${name} must be space-separated integers.` };
        args.push(values);
        break;
      }
      case "string[]": {
        const count = Number(next().trim());
        if (!Number.isInteger(count) || count < 0) {
          return { ok: false, error: `${name} needs a count line first.` };
        }
        args.push(Array.from({ length: count }, next));
        break;
      }
      case "int[][]": {
        const count = Number(next().trim());
        if (!Number.isInteger(count) || count < 0) {
          return { ok: false, error: `${name} needs a row-count line first.` };
        }
        const rows: number[][] = [];
        for (let row = 0; row < count; row++) {
          const values = ints(next());
          if (!values)
            return { ok: false, error: `${name} row ${row + 1} is not integers.` };
          rows.push(values);
        }
        args.push(rows);
        break;
      }
    }
  }
  return { ok: true, args };
}

/**
 * Builds the step shown before anything runs: the problem's input, drawn the
 * same way a traced step is, so the picture in the statement and the first
 * frame of a run are visibly the same object.
 */
export function inputStep(signature: Signature, args: WireValue[]): TraceStep {
  const locals: Record<string, TraceValue> = {};
  const heap: Record<number, HeapNode> = {};
  let nextId = 1;

  signature.params.forEach((type: ParamType, index) => {
    const name = signature.paramNames[index] ?? `arg${index}`;
    const value = args[index];
    if (type === "list") {
      const values = value as number[];
      if (values.length === 0) {
        locals[name] = { t: "null" };
        return;
      }
      const ids = values.map(() => nextId++);
      values.forEach((v, i) => {
        heap[ids[i]!] = { val: { t: "num", v }, next: ids[i + 1] ?? null };
      });
      locals[name] = { t: "node", id: ids[0]! };
      return;
    }
    locals[name] = toTraceValue(value);
  });

  return { line: 0, event: "line", stack: [], locals, heap };
}

function toTraceValue(value: unknown): TraceValue {
  if (typeof value === "number") return { t: "num", v: value };
  if (typeof value === "string") return { t: "str", v: value };
  if (Array.isArray(value)) return { t: "arr", items: value.map(toTraceValue) };
  return { t: "null" };
}

/**
 * Formats a returned value the way the server harness prints it, so a
 * traced run can be compared with a sample's expected output directly.
 */
export function formatWireOutput(
  returns: ReturnType,
  value: TraceValue | undefined,
  heap: Record<number, HeapNode> = {}
): string {
  if (!value) return "";
  switch (returns) {
    case "int":
      return value.t === "num" ? String(Math.trunc(value.v)) : display(value);
    case "double":
      return value.t === "num" ? value.v.toFixed(6) : display(value);
    case "bool":
      return value.t === "bool" ? String(value.v) : display(value);
    case "string":
      return value.t === "str" ? value.v : display(value);
    case "int[]":
      return value.t === "arr" ? value.items.map(display).join(" ") : display(value);
    case "string[]":
      return value.t === "arr"
        ? [String(value.items.length), ...value.items.map(display)].join("\n")
        : display(value);
    case "list":
      return listValues(value, heap).join(" ");
  }
}

/** Walks a linked list from a node reference, stopping at a cycle. */
export function listValues(
  value: TraceValue,
  heap: Record<number, HeapNode>
): string[] {
  const out: string[] = [];
  const seen = new Set<number>();
  let id = value.t === "node" ? value.id : null;
  while (id !== null && !seen.has(id) && heap[id]) {
    seen.add(id);
    out.push(display(heap[id]!.val));
    id = heap[id]!.next;
  }
  return out;
}

/** A compact human rendering of any traced value. */
export function display(value: TraceValue): string {
  switch (value.t) {
    case "num":
      return Number.isInteger(value.v) ? String(value.v) : String(+value.v.toFixed(4));
    case "str":
      return value.v;
    case "bool":
      return String(value.v);
    case "null":
      return "null";
    case "arr":
      return `[${value.items.map(quoted).join(", ")}${value.more ? ", …" : ""}]`;
    case "set":
      return `{${value.items.map(quoted).join(", ")}${value.more ? ", …" : ""}}`;
    case "map":
      return `{${value.entries.map(([k, v]) => `${quoted(k)}: ${quoted(v)}`).join(", ")}${value.more ? ", …" : ""}}`;
    case "node":
      return `node#${value.id}`;
    case "obj":
      return `${value.name}(…)`;
    case "other":
      return value.repr;
  }
}

function quoted(value: TraceValue): string {
  return value.t === "str" ? JSON.stringify(value.v) : display(value);
}
