import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Repeat2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ReviewSession, type SessionCard } from "@/components/review/review-session";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { describeInterval } from "@/lib/review/scheduler";
import { daysBetweenUtc } from "@/lib/dates";
import { getReviewQueue, getReviewSummary } from "@/services/review";

export const metadata: Metadata = {
  title: "Review",
  robots: { index: false, follow: false },
};

/**
 * The review session.
 *
 * Deliberately not another dashboard. When something is due the page is a
 * single card and nothing else; the summary only appears when the queue is
 * empty, which is the one moment the numbers are worth looking at rather
 * than a distraction from the work.
 */
export default async function ReviewPage() {
  const user = await requireUser("/review");
  const now = new Date();

  const [queue, summary] = await Promise.all([
    getReviewQueue(user.id, now),
    getReviewSummary(user.id, now),
  ]);

  if (queue.length > 0) {
    const cards: SessionCard[] = queue.map((card) => ({
      id: card.id,
      entityType: card.entityType,
      stage: card.stage,
      overdueDays: card.overdueDays,
      lapses: card.lapses,
      prompt: card.prompt,
    }));

    return <ReviewSession initialQueue={cards} />;
  }

  // Nothing due. Two very different situations, and they should not look
  // the same: someone who has finished today's reviews has earned a
  // different message from someone who has nothing scheduled at all.
  const nothingTracked = summary.trackedCount === 0;
  const nextDue = summary.upcoming[0];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      {nothingTracked ? (
        <>
          <EmptyState
            icon={Repeat2}
            title="Nothing scheduled for review yet"
            description="Review items are created as you learn: completing a chapter schedules its key ideas, and solving a problem schedules both the problem and the pattern behind it."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="sm">
                  <Link href="/learn/dsa">Start a chapter</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/problems">Solve a problem</Link>
                </Button>
              </div>
            }
          />
        </>
      ) : (
        <>
          <CheckCircle2 className="text-success mx-auto size-7" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Nothing due right now
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {summary.reviewedToday > 0
              ? `You have completed ${summary.reviewedToday} review${summary.reviewedToday === 1 ? "" : "s"} today.`
              : "Everything scheduled has been seen."}{" "}
            Coming back too early is wasted effort — the gap is what does the
            work.
          </p>

          {nextDue && (
            <p className="text-muted-foreground mt-5 flex items-center justify-center gap-2 text-xs">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Next {nextDue.count} item{nextDue.count === 1 ? "" : "s"} due{" "}
              {describeInterval(Math.max(1, daysBetweenUtc(now, nextDue.dueAt)))}
            </p>
          )}

          <dl className="border-border mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border text-left">
            <Stat label="Tracked" value={summary.trackedCount} />
            <Stat label="Maturing" value={summary.byStage.REVIEW} />
            <Stat label="Mature" value={summary.byStage.MATURE} />
          </dl>

          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-4">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="tabular mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
