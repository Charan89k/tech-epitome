import { z } from "zod";

import { EXECUTION_LIMITS } from "./limits";

/**
 * The wire contract between the web app and the execution worker
 * (src/worker). Both sides validate with these schemas; the worker never
 * trusts the web app to have done it.
 */

export const WORKER_LANGUAGES = ["PYTHON", "JAVASCRIPT", "JAVA", "CPP"] as const;

/** Upper bounds on one job. Generous for real problems, small for abuse. */
export const WORKER_LIMITS = {
  maxBodyBytes: 4 * 1024 * 1024,
  maxProgramChars: 300_000,
  maxTests: 100,
  maxCaseChars: 64 * 1024,
  maxTimeLimitMs: EXECUTION_LIMITS.maxCpuSeconds * 1000,
  maxMemoryMb: EXECUTION_LIMITS.maxMemoryMb,
} as const;

export const workerJobSchema = z.object({
  language: z.enum(WORKER_LANGUAGES),
  program: z.string().min(1).max(WORKER_LIMITS.maxProgramChars),
  tests: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        input: z.string().max(WORKER_LIMITS.maxCaseChars),
        expected: z.string().max(WORKER_LIMITS.maxCaseChars).nullable(),
        isSample: z.boolean(),
      })
    )
    .min(1)
    .max(WORKER_LIMITS.maxTests),
  timeLimitMs: z.number().int().min(100).max(WORKER_LIMITS.maxTimeLimitMs),
  memoryLimitMb: z.number().int().min(16).max(WORKER_LIMITS.maxMemoryMb),
});

export type WorkerJob = z.infer<typeof workerJobSchema>;

const testOutcome = z.enum([
  "PASSED",
  "WRONG_ANSWER",
  "COMPLETED",
  "TIMEOUT",
  "RUNTIME_ERROR",
  "MEMORY_LIMIT",
  "OUTPUT_LIMIT",
]);

/** What the web app accepts back. Anything else is treated as a failure. */
export const workerResultSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "WRONG_ANSWER",
    "TIME_LIMIT_EXCEEDED",
    "MEMORY_LIMIT_EXCEEDED",
    "OUTPUT_LIMIT_EXCEEDED",
    "RUNTIME_ERROR",
    "COMPILE_ERROR",
    "INTERNAL_ERROR",
  ]),
  passed: z.number().int().min(0),
  total: z.number().int().min(0),
  executionTimeMs: z.number().min(0),
  memoryKb: z.number().nullable(),
  compileError: z.string().max(8000).optional(),
  results: z
    .array(
      z.object({
        testCaseId: z.string().max(64),
        isSample: z.boolean(),
        outcome: testOutcome,
        runtimeMs: z.number().min(0),
        input: z.string().max(WORKER_LIMITS.maxCaseChars).optional(),
        expected: z.string().max(WORKER_LIMITS.maxCaseChars).optional(),
        actual: z.string().max(8000).optional(),
        stderr: z.string().max(4000).optional(),
      })
    )
    .max(WORKER_LIMITS.maxTests),
});
