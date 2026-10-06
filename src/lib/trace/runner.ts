"use client";

import type { Signature } from "@/lib/code-execution/signature";
import { instrumentJs } from "./instrument-js";
import {
  MAX_EXECUTED_LINES,
  MAX_RECORDED_STEPS,
  type HeapNode,
  type TraceOutcome,
  type TraceStep,
  type TraceValue,
  type TraceableLanguage,
} from "./types";
import { formatWireOutput, type WireValue } from "./wire";

/**
 * Runs learner code in a browser worker and returns its trace.
 *
 * One worker per language, created lazily and kept: Pyodide takes seconds to
 * boot, and paying that on every run would make the visual feel broken. A
 * run that exceeds its wall-clock budget terminates the worker — the only
 * way to stop synchronous code — and the next run starts a fresh one.
 */

const WORKER_URL: Record<TraceableLanguage, string> = {
  PYTHON: "/trace/python-worker.js",
  JAVASCRIPT: "/trace/js-worker.js",
};

/** Budget for the run itself, excluding Pyodide's first download. */
const RUN_TIMEOUT_MS = 10_000;
const BOOT_TIMEOUT_MS = 60_000;

type WorkerResult = {
  ok: boolean;
  error?: string;
  line?: number;
  steps: TraceStep[];
  returnValue?: TraceValue;
  returnHeap?: Record<number, HeapNode>;
  stdout: string;
  truncated: boolean;
};

type Slot = { worker: Worker; ready: Promise<void> };

const slots: Partial<Record<TraceableLanguage, Slot>> = {};
let nextRequestId = 1;

function slotFor(language: TraceableLanguage): Slot {
  const existing = slots[language];
  if (existing) return existing;

  const worker = new Worker(WORKER_URL[language]);
  const ready =
    language === "PYTHON"
      ? new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () =>
              reject(
                new Error(
                  "Python took too long to load. Check your connection and try again."
                )
              ),
            BOOT_TIMEOUT_MS
          );
          const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "ready") {
              clearTimeout(timer);
              worker.removeEventListener("message", onMessage);
              resolve();
            } else if (event.data?.type === "load-error") {
              clearTimeout(timer);
              worker.removeEventListener("message", onMessage);
              reject(new Error(`Python failed to load: ${event.data.error}`));
            }
          };
          worker.addEventListener("message", onMessage);
          worker.addEventListener("error", () => {
            clearTimeout(timer);
            reject(new Error("The Python runtime could not start in this browser."));
          });
        })
      : Promise.resolve();

  const slot = { worker, ready };
  slots[language] = slot;
  // A failed boot must not poison every later attempt.
  ready.catch(() => discard(language));
  return slot;
}

function discard(language: TraceableLanguage) {
  slots[language]?.worker.terminate();
  delete slots[language];
}

/** Starts Pyodide's download early, e.g. when a problem page opens. */
export function warmTraceRuntime(language: TraceableLanguage): void {
  if (typeof Worker === "undefined") return;
  slotFor(language);
}

export function isTraceRuntimeLoaded(language: TraceableLanguage): boolean {
  return Boolean(slots[language]);
}

export async function traceRun(options: {
  language: TraceableLanguage;
  code: string;
  signature: Signature;
  args: WireValue[];
}): Promise<TraceOutcome> {
  const { language, signature, args } = options;

  let code = options.code;
  if (language === "JAVASCRIPT") {
    const instrumented = instrumentJs(code);
    if (!instrumented.ok) {
      return {
        ok: false,
        error: instrumented.error,
        line: instrumented.line,
        steps: [],
        stdout: "",
        truncated: false,
      };
    }
    code = instrumented.code;
  }

  const slot = slotFor(language);
  try {
    await slot.ready;
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
      steps: [],
      stdout: "",
      truncated: false,
    };
  }

  const id = nextRequestId++;
  const result = await new Promise<WorkerResult>((resolve) => {
    const timer = setTimeout(() => {
      slot.worker.removeEventListener("message", onMessage);
      discard(language);
      resolve({
        ok: false,
        error: `Stopped after ${RUN_TIMEOUT_MS / 1000}s — is there an infinite loop?`,
        steps: [],
        stdout: "",
        truncated: false,
      });
    }, RUN_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.id !== id) return;
      clearTimeout(timer);
      slot.worker.removeEventListener("message", onMessage);
      resolve(event.data.result as WorkerResult);
    };
    slot.worker.addEventListener("message", onMessage);
    slot.worker.postMessage({
      id,
      code,
      functionName: signature.functionName,
      params: signature.params,
      args,
      limits: { maxSteps: MAX_RECORDED_STEPS, maxLines: MAX_EXECUTED_LINES },
    });
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? "The run failed.",
      line: result.line ?? undefined,
      steps: result.steps ?? [],
      stdout: result.stdout ?? "",
      truncated: result.truncated,
    };
  }

  return {
    ok: true,
    steps: result.steps,
    output: formatWireOutput(
      signature.returns,
      result.returnValue,
      result.returnHeap ?? {}
    ),
    stdout: result.stdout,
    truncated: result.truncated,
  };
}
