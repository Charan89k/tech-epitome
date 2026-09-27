import "server-only";

import { createConnection, type Socket } from "node:net";

import type { RedisLike } from "@/lib/rate-limit";

/**
 * A minimal RESP client, implementing exactly the three commands the
 * rate limiter needs.
 *
 * Why not `ioredis`? Because `RedisLike` is deliberately a structural
 * interface: the point of the rate limiter's design is that a deployment
 * brings its own client and Tech Epitome bundles none. Shipping a
 * dependency here would undo that.
 *
 * So this exists for one reason — **so the adapter can be tested against
 * a real Redis server** rather than only against a fake. It speaks
 * enough of RESP to issue `INCR`, `PEXPIRE` and `PTTL` and to parse the
 * integer and error replies they return. It is not a general-purpose
 * client, it does not pipeline, reconnect or cluster, and nothing in the
 * application uses it.
 *
 * A production deployment should pass `ioredis` or `node-redis` to
 * `createRedisRateLimitStore` instead; both satisfy `RedisLike`.
 */

export class RedisUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisUnavailableError";
  }
}

type Pending = {
  resolve: (value: number | string | null) => void;
  reject: (error: Error) => void;
};

export class MinimalRedisClient implements RedisLike {
  private socket: Socket | null = null;
  private buffer = "";
  private readonly pending: Pending[] = [];
  private closed = false;

  constructor(
    private readonly host: string,
    private readonly port: number
  ) {}

  async connect(timeoutMs = 3_000): Promise<void> {
    if (this.socket) return;

    await new Promise<void>((resolve, reject) => {
      const socket = createConnection({ host: this.host, port: this.port });
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new RedisUnavailableError("Timed out connecting to Redis."));
      }, timeoutMs);

      socket.once("connect", () => {
        clearTimeout(timer);
        socket.setNoDelay(true);
        this.socket = socket;
        socket.on("data", (chunk) => this.onData(chunk.toString("utf8")));
        socket.on("error", (error) => this.failAll(error));
        socket.on("close", () => {
          this.closed = true;
          this.failAll(new RedisUnavailableError("The Redis connection closed."));
        });
        resolve();
      });

      socket.once("error", (error) => {
        clearTimeout(timer);
        reject(new RedisUnavailableError(`Could not reach Redis: ${error.message}`));
      });
    });
  }

  private failAll(error: Error) {
    while (this.pending.length > 0) this.pending.shift()!.reject(error);
  }

  /**
   * Parses replies out of the stream.
   *
   * Only the three types these commands produce: `:integer`, `+simple`
   * and `-error`. Anything else is a protocol surprise and is surfaced
   * rather than guessed at.
   */
  private onData(chunk: string) {
    this.buffer += chunk;

    for (;;) {
      const end = this.buffer.indexOf("\r\n");
      if (end === -1) return;

      const line = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);

      const waiter = this.pending.shift();
      if (!waiter) continue;

      const type = line[0];
      const rest = line.slice(1);

      if (type === ":") waiter.resolve(Number.parseInt(rest, 10));
      else if (type === "+") waiter.resolve(rest);
      else if (type === "-") waiter.reject(new Error(rest));
      else waiter.reject(new Error(`Unexpected Redis reply: ${line}`));
    }
  }

  private command(...args: string[]): Promise<number | string | null> {
    if (!this.socket || this.closed) {
      return Promise.reject(new RedisUnavailableError("Not connected to Redis."));
    }

    // RESP arrays, so an argument containing a space or a newline is
    // length-prefixed rather than interpreted.
    const payload =
      `*${args.length}\r\n` +
      args
        .map((arg) => `$${Buffer.byteLength(arg, "utf8")}\r\n${arg}\r\n`)
        .join("");

    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject });
      this.socket!.write(payload, "utf8", (error) => {
        if (error) reject(error);
      });
    });
  }

  async incr(key: string): Promise<number> {
    return (await this.command("INCR", key)) as number;
  }

  async pexpire(key: string, ms: number): Promise<unknown> {
    return this.command("PEXPIRE", key, String(Math.trunc(ms)));
  }

  async pttl(key: string): Promise<number> {
    return (await this.command("PTTL", key)) as number;
  }

  /** Test helper: not part of `RedisLike`. */
  async flushall(): Promise<void> {
    await this.command("FLUSHALL");
  }

  async quit(): Promise<void> {
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = null;
    this.closed = true;
    await new Promise<void>((resolve) => {
      socket.end(() => resolve());
      socket.unref();
    });
  }
}
