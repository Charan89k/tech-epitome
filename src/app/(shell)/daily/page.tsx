import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Flame } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { executionStatus } from "@/lib/code-execution";
import { route } from "@/lib/utils";
import { getDailyChallenge, getDailyProgress } from "@/services/daily";

export const metadata: Metadata = {
  title: "Daily Challenge",
  description: "One coding problem a day, the same for every learner.",
  alternates: { canonical: "/daily" },
};

export default async function DailyPage() {
  const [challenge, user] = await Promise.all([getDailyChallenge(), getCurrentUser()]);
  const progress = user ? await getDailyProgress(user.id) : null;
  const execution = executionStatus();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Daily challenge"
        title="Today's problem"
        description="One problem a day, the same for everyone. It changes at midnight UTC."
      />
      {!challenge ? (
        <EmptyState
          icon={CalendarCheck}
          title="No problems are published yet"
          description="The daily challenge starts once the catalogue has problems in it."
        />
      ) : (
        <section
          aria-labelledby="daily-problem"
          className="mt-6 rounded-lg border border-border bg-card p-5"
        >
          <p className="font-mono text-xs text-subtle-foreground">
            {challenge.date.toISOString().slice(0, 10)} · #{challenge.problem.number}
          </p>
          <h2 id="daily-problem" className="mt-2 text-xl font-semibold">
            {challenge.problem.title}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <DifficultyBadge difficulty={challenge.problem.difficulty} />
            {progress?.solvedToday && <Badge variant="success">Solved today</Badge>}
          </div>
          <Button asChild className="mt-5">
            <Link href={route(`/problems/${challenge.problem.slug}`)}>
              Open the problem
            </Link>
          </Button>
          {!execution.available && (
            <p className="mt-3 text-sm text-muted-foreground">
              {execution.reason} You can still read it, write code and use the
              visualizer, but a solve cannot be recorded until submissions are on.
            </p>
          )}
        </section>
      )}
      {progress && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="size-4 text-warning" aria-hidden="true" />
          Daily streak:{" "}
          <span className="font-mono text-foreground">
            {progress.streak} day{progress.streak === 1 ? "" : "s"}
          </span>
        </p>
      )}
    </div>
  );
}
