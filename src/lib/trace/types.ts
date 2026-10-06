/**
 * The live-trace contract.
 *
 * A trace is what the learner's own code did, recorded one line at a time in
 * a browser worker: which line ran, and what every variable in scope held
 * just before it ran. The visualizer plays those snapshots back. Nothing is
 * choreographed — if a cell flashes, the learner's code wrote to it.
 *
 * Values are serialised into a small tagged union rather than passed as raw
 * JSON so the renderer can tell a Python list from a dict, a linked-list node
 * from a plain object, and a truncated value from a short one.
 */

export type TraceValue =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "null" }
  /** A list/array. `more` counts elements cut off by the size cap. */
  | { t: "arr"; items: TraceValue[]; more?: number }
  | { t: "map"; entries: [TraceValue, TraceValue][]; more?: number }
  | { t: "set"; items: TraceValue[]; more?: number }
  /** A reference to a linked-list node in the step's `heap`. */
  | { t: "node"; id: number }
  | { t: "obj"; name: string; fields: Record<string, TraceValue> }
  /** Anything the serialiser declines to walk: functions, classes, modules. */
  | { t: "other"; repr: string };

export type HeapNode = { val: TraceValue; next: number | null };

export type TraceFrame = { func: string; line: number };

export type TraceStep = {
  /** 1-based line in the learner's code. */
  line: number;
  event: "line" | "return";
  /** Innermost first is NOT the order: outermost frame first, current last. */
  stack: TraceFrame[];
  /** Variables of the current frame, in first-seen order. */
  locals: Record<string, TraceValue>;
  /** Every linked-list node reachable from `locals`, keyed by stable id. */
  heap: Record<number, HeapNode>;
  /** Present on `return` steps. */
  returnValue?: TraceValue;
};

export type TraceOutcome =
  | {
      ok: true;
      steps: TraceStep[];
      /** The entry point's return value, formatted in the problem's wire format. */
      output: string;
      stdout: string;
      /** True when the step cap was hit; later steps ran but were not recorded. */
      truncated: boolean;
    }
  | {
      ok: false;
      error: string;
      /** 1-based line of the failure in the learner's code, when known. */
      line?: number;
      steps: TraceStep[];
      stdout: string;
      truncated: boolean;
    };

/** Languages the browser can trace. Java and C++ have no in-browser runtime. */
export const TRACEABLE_LANGUAGES = ["PYTHON", "JAVASCRIPT"] as const;
export type TraceableLanguage = (typeof TRACEABLE_LANGUAGES)[number];

export function isTraceable(language: string): language is TraceableLanguage {
  return (TRACEABLE_LANGUAGES as readonly string[]).includes(language);
}

/** Recorded steps are capped so a long loop cannot exhaust the tab's memory. */
export const MAX_RECORDED_STEPS = 1500;
/** Executed lines are capped so an infinite loop ends in a message, not a hang. */
export const MAX_EXECUTED_LINES = 2_000_000;
