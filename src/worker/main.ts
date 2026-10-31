import { DockerExecutionAdapter } from "@/lib/code-execution/docker-adapter";
import { createWorker } from "./app";

/**
 * Entry point for the execution worker host:
 *
 *   EXECUTION_WORKER_TOKEN=... npm run worker
 *
 * Refuses to start if application secrets are present in its environment:
 * the worker must not be able to leak what it was never given.
 */

const FORBIDDEN_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "AI_API_KEY",
  "RESEND_API_KEY",
  "SMTP_PASSWORD",
];

const present = FORBIDDEN_ENV.filter((name) => process.env[name]);
if (present.length > 0) {
  console.error(
    `Refusing to start: application secrets in the environment (${present.join(", ")}).`
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const token = process.env.EXECUTION_WORKER_TOKEN ?? "";
  const docker = new DockerExecutionAdapter();
  if (!(await docker.isAvailable())) {
    console.error("Refusing to start: the Docker daemon is unreachable.");
    process.exit(1);
  }

  const server = createWorker({
    token,
    concurrency: Number(process.env.EXECUTION_WORKER_CONCURRENCY ?? 2),
    queueLimit: Number(process.env.EXECUTION_WORKER_QUEUE ?? 16),
    execute: (job) => docker.execute(job),
  });

  const port = Number(process.env.EXECUTION_WORKER_PORT ?? 8090);
  // Loopback by default: expose it through a private network or tunnel, never publicly.
  const host = process.env.EXECUTION_WORKER_HOST ?? "127.0.0.1";
  server.listen(port, host, () => {
    console.info(JSON.stringify({ event: "listening", host, port }));
  });
}

void main();
