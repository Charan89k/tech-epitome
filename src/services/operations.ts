import "server-only";

import { prisma } from "@/lib/db";

import { MAX_EMAIL_ATTEMPTS } from "./email-notifications";
import { listJobRuns } from "./jobs";

/**
 * Platform operations at a glance, for platform admins only (the /admin
 * layout enforces that). Counts and statuses only: no addresses, names,
 * message bodies or user ids, so the page is safe to show on a shared
 * screen during an incident.
 */
export async function getOperationsOverview(now = new Date()) {
  const week = new Date(now.getTime() - 7 * 86_400_000);
  const day = new Date(now.getTime() - 86_400_000);

  const [runs, deliveries, retryable, unknown, invitations, notifications] =
    await Promise.all([
      listJobRuns(30),
      prisma.emailDelivery.groupBy({
        by: ["kind", "status"],
        where: { createdAt: { gte: week } },
        _count: true,
      }),
      prisma.emailDelivery.count({
        where: {
          status: "rejected",
          retryable: true,
          attempts: { lt: MAX_EMAIL_ATTEMPTS },
        },
      }),
      // A send that started and never recorded an outcome (the process died).
      prisma.emailDelivery.count({
        where: {
          status: "attempted",
          createdAt: { lt: new Date(now.getTime() - 3_600_000) },
        },
      }),
      prisma.institutionInvitation.groupBy({
        by: ["emailStatus"],
        where: { createdAt: { gte: week } },
        _count: true,
      }),
      prisma.notification.count({ where: { createdAt: { gte: day } } }),
    ]);

  const recentFailures = await prisma.emailDelivery.findMany({
    where: { status: { in: ["rejected", "skipped"] }, createdAt: { gte: week } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      kind: true,
      status: true,
      reason: true,
      attempts: true,
      createdAt: true,
    },
  });

  const latest = new Map<string, (typeof runs)[number]>();
  for (const r of runs) if (!latest.has(r.job)) latest.set(r.job, r);

  return {
    jobs: [...latest.values()],
    runs,
    deliveries: deliveries.map((d) => ({
      kind: d.kind,
      status: d.status,
      count: d._count,
    })),
    retryable,
    unknown,
    invitations: invitations.map((i) => ({
      status: i.emailStatus ?? "not sent yet",
      count: i._count,
    })),
    notificationsLastDay: notifications,
    recentFailures,
  };
}
