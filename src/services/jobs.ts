import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * Scheduled-job bookkeeping: every run is recorded, and only one run of a
 * job can be in progress at a time. The guard is the partial unique index
 * on RUNNING rows, so two schedulers firing together cannot both do the
 * work; the loser gets "already-running" and does nothing.
 *
 * A run that never finished (the process died) blocks its job until it is
 * older than STALE_AFTER_MS, then it is marked STALE and the next run goes.
 * Summaries are counts; errors are a class name and a short message.
 */

const STALE_AFTER_MS = 30 * 60_000;

export type JobOutcome<T> =
  | { status: "succeeded"; runId: string; summary: T }
  | { status: "failed"; runId: string; error: string }
  | { status: "already-running" };

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 300);
  return "Unknown error";
}

export async function runJob<T extends Prisma.InputJsonValue>(
  job: string,
  work: () => Promise<T>,
  now = new Date()
): Promise<JobOutcome<T>> {
  await prisma.jobRun.updateMany({
    where: {
      job,
      status: "RUNNING",
      startedAt: { lt: new Date(now.getTime() - STALE_AFTER_MS) },
    },
    data: { status: "STALE", finishedAt: now },
  });

  let runId: string;
  try {
    ({ id: runId } = await prisma.jobRun.create({
      data: { job, status: "RUNNING", startedAt: now },
      select: { id: true },
    }));
  } catch {
    return { status: "already-running" };
  }

  try {
    const summary = await work();
    await prisma.jobRun.update({
      where: { id: runId },
      data: { status: "SUCCEEDED", finishedAt: new Date(), summary },
    });
    return { status: "succeeded", runId, summary };
  } catch (error) {
    const message = describe(error);
    console.error(`[jobs] ${job} failed`, message);
    await prisma.jobRun.update({
      where: { id: runId },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    return { status: "failed", runId, error: message };
  }
}

export async function listJobRuns(limit = 50) {
  return prisma.jobRun.findMany({
    orderBy: { startedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
}
