import { createHash, timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import type { ExecutionRequest, ExecutionResult } from "@/lib/code-execution/types";
import { WORKER_LIMITS, workerJobSchema } from "@/lib/code-execution/worker-protocol";

/**
 * The execution worker: a small HTTP service that runs on its own host and
 * is the only thing allowed to talk to Docker. The web app sends it a job
 * and gets a result; it holds no database URL, no auth secret and no user
 * data, so code that escaped a container would find nothing worth taking.
 *
 * Deny by default: every request needs the shared bearer token, a body
 * within WORKER_LIMITS and a job that passes workerJobSchema. Jobs run
 * first-in first-out with a fixed concurrency; when the queue is full the
 * worker answers 503 instead of accepting unbounded work. Per-learner
 * fairness is enforced upstream (one execution slot per learner, plus rate
 * limits), so this queue only ever sees a bounded number of jobs per user.
 *
 * Logs record outcome, language, size and timing. Never code, input or output.
 */

export type WorkerOptions = {
  token: string;
  concurrency: number;
  queueLimit: number;
  execute: (job: ExecutionRequest) => Promise<ExecutionResult>;
  log?: (line: Record<string, unknown>) => void;
};

function sameSecret(given: string, expected: string): boolean {
  // Hash first so the comparison is constant-time whatever the lengths.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function send(res: ServerResponse, status: number, body: unknown, headers = {}): void {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

/** Reads the body, refusing anything over the limit without buffering it. */
function readBody(req: IncomingMessage, limit: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > limit) return resolve(null);
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function createWorker(options: WorkerOptions): Server {
  if (options.token.length < 32) {
    throw new Error("The worker token must be at least 32 characters.");
  }
  const log = options.log ?? ((line) => console.info(JSON.stringify(line)));
  let active = 0;
  const waiting: (() => void)[] = [];

  async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= options.concurrency) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    active += 1;
    try {
      return await fn();
    } finally {
      active -= 1;
      waiting.shift()?.();
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === "GET" && req.url === "/healthz") {
      return send(res, 200, { ok: true, active, queued: waiting.length });
    }
    if (req.method !== "POST" || req.url !== "/v1/execute") {
      return send(res, 404, { error: "not_found" });
    }

    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || !sameSecret(token, options.token)) {
      log({ event: "rejected", reason: "unauthorized" });
      return send(res, 401, { error: "unauthorized" });
    }

    const raw = await readBody(req, WORKER_LIMITS.maxBodyBytes);
    if (raw === null) return send(res, 413, { error: "too_large" });

    let parsed;
    try {
      parsed = workerJobSchema.safeParse(JSON.parse(raw));
    } catch {
      return send(res, 400, { error: "invalid" });
    }
    if (!parsed.success) return send(res, 400, { error: "invalid" });

    if (active >= options.concurrency && waiting.length >= options.queueLimit) {
      log({ event: "rejected", reason: "busy" });
      return send(res, 503, { error: "busy" }, { "retry-after": "5" });
    }

    const job = parsed.data;
    const started = Date.now();
    const result = await withSlot(() => options.execute(job));
    log({
      event: "executed",
      language: job.language,
      tests: job.tests.length,
      programBytes: Buffer.byteLength(job.program),
      status: result.status,
      ms: Date.now() - started,
    });
    return send(res, 200, result);
  }

  return createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, { error: "internal" });
      else res.end();
    });
  });
}
