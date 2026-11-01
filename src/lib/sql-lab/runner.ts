"use client";

import type { SqlRows } from "./compare";

export type SqlResult = { fields: string[]; rows: SqlRows; affectedRows: number };

const WORKER_URL = "/trace/sql-worker.js";
/** Includes a first download of about 16 MB. */
const BOOT_TIMEOUT_MS = 120_000;
const RUN_TIMEOUT_MS = 10_000;

export class SqlTimeoutError extends Error {}

/**
 * One in-memory database in a worker. A query that runs too long terminates
 * the worker, the only way to stop it, so the next `start` begins from clean data.
 */
export class SqlEngine {
  private worker: Worker | null = null;
  private nextId = 1;

  async start(schema: string): Promise<void> {
    this.stop();
    this.worker = new Worker(WORKER_URL, { type: "module" });
    await this.send("start", schema, BOOT_TIMEOUT_MS);
  }

  run(sql: string): Promise<SqlResult[]> {
    return this.send("run", sql, RUN_TIMEOUT_MS);
  }

  stop(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  private send(type: string, sql: string, timeoutMs: number): Promise<SqlResult[]> {
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error("The database is not running."));
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      const finish = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
      };
      const timer = setTimeout(() => {
        finish();
        this.stop();
        reject(new SqlTimeoutError());
      }, timeoutMs);
      const onMessage = ({ data }: MessageEvent) => {
        if (data.id !== id) return;
        finish();
        if (data.ok) resolve(data.results);
        else reject(new Error(data.error));
      };
      const onError = () => {
        finish();
        reject(new Error("The database could not start."));
      };
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      worker.postMessage({ id, type, sql });
    });
  }
}
