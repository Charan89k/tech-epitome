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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card text-center">
        {nothingTracked ? (
          <>
            <h1 className="sr-only">Review</h1>
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
            <div className="px-6 pt-10">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-ember-500/12 ring-1 ring-ember-500/25">
                <CheckCircle2 className="size-6 text-ember-400" aria-hidden="true" />
              </div>
              <h1 className="tracking-headline mt-4 text-xl font-bold">
                Nothing due right now
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {summary.reviewedToday > 0
                  ? `You have completed ${summary.reviewedToday} review${summary.reviewedToday === 1 ? "" : "s"} today.`
                  : "Everything scheduled has been seen."}{" "}
                Coming back too early is wasted effort — the gap is what does the work.
              </p>

              {nextDue && (
                <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  Next {nextDue.count} item{nextDue.count === 1 ? "" : "s"} due{" "}
                  {describeInterval(Math.max(1, daysBetweenUtc(now, nextDue.dueAt)))}
                </p>
              )}
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-px border-y border-border bg-border text-left">
              <Stat label="Tracked" value={summary.trackedCount} />
              <Stat label="Maturing" value={summary.byStage.REVIEW} />
              <Stat label="Mature" value={summary.byStage.MATURE} />
            </dl>

            <div className="p-5">
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular mt-1 text-xl font-bold">{value}</dd>
    </div>
  );
}
