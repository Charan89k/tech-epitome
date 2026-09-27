import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CircleDot,
  Clock,
  Flame,
  ListChecks,
  Repeat2,
  Shapes,
  Target,
} from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ProgressRing } from "@/components/common/progress-ring";
import { StatTile } from "@/components/common/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import { getDashboardData } from "@/services/dashboard";
import { getProgressSummary } from "@/services/progress";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatStudyTime(seconds: number): string {
  if (seconds < 60) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [data, summary] = await Promise.all([
    getDashboardData(user.id),
    getProgressSummary(user.id),
  ]);

  const firstName = user.name?.split(" ")[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {greeting()}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {data.dueReviewCount > 0
          ? `${data.dueReviewCount} item${data.dueReviewCount === 1 ? "" : "s"} ready for review.`
          : "Here is where you left off."}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* ---- Primary column -------------------------------------------- */}
        <div className="space-y-5 lg:col-span-2">
          <DueForReviewCard count={data.dueReviewCount} />
          <ContinueLearningCard data={data.continueLearning} />
          <TodaysPracticeCard problems={data.recommendedProblems} />
        </div>

        {/* ---- Secondary column ------------------------------------------ */}
        <div className="space-y-5">
          <section aria-labelledby="progress-heading">
            <h2
              id="progress-heading"
              className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase"
            >
              Your progress
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Solved"
                value={summary.problemsSolved}
                icon={ListChecks}
                hint={`${summary.easySolved}E · ${summary.mediumSolved}M · ${summary.hardSolved}H`}
              />
              <StatTile
                label="Patterns"
                value={summary.patternsMastered}
                icon={Shapes}
                hint="mastered"
              />
              <StatTile
                label="Streak"
                value={`${summary.currentStreak}d`}
                icon={Flame}
                hint={`best ${summary.longestStreak}d`}
              />
              <StatTile
                label="Study time"
                value={formatStudyTime(summary.studySeconds)}
                icon={Clock}
                hint={`${summary.chaptersCompleted} chapters`}
              />
            </div>
          </section>

          <QuizPerformanceCard performance={data.quizPerformance} />
          <WeakPatternsCard patterns={data.weakPatterns} />
          <RecentActivityCard submissions={data.recentSubmissions} />
        </div>
      </div>
    </div>
  );
}

/**
 * Due-for-review call to action.
 *
 * Only rendered when something is actually due. A card that permanently
 * says "0 items" is noise, and worse, it trains people to ignore the one
 * place that tells them there is work waiting.
 *
 * The count comes from the same scheduler query the review queue uses, so
 * it cannot disagree with what the session then serves.
 */
function DueForReviewCard({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link
      href="/review"
      className="border-ember-500/30 bg-ember-500/6 hover:border-ember-500/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
    >
      <div className="bg-ember-500/12 text-ember-400 rounded-lg p-2.5">
        <Repeat2 className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Due for review</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          <span className="tabular">{count}</span> item{count === 1 ? "" : "s"}{" "}
          ready to recall. A few minutes now is worth an hour of re-reading
          later.
        </p>
      </div>
      <ArrowRight
        className="text-ember-500 size-4 shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}

function ContinueLearningCard({
  data,
}: {
  data: Awaited<ReturnType<typeof getDashboardData>>["continueLearning"];
}) {
  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Continue learning</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpenCheck}
            title="No published curriculum yet"
            description="Once a course is published it will appear here with your position in it."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Continue learning</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <ProgressRing
          value={data.percent}
          size={72}
          label={`${data.percent}% through ${data.chapterTitle}`}
        />

        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground truncate text-xs">
            {data.courseTitle} · {data.sectionTitle}
          </p>
          <p className="mt-0.5 truncate text-base font-medium">
            {data.chapterTitle}
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={route(data.href)}>
              {data.percent > 0 ? "Continue" : "Start"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TodaysPracticeCard({
  problems,
}: {
  problems: Awaited<ReturnType<typeof getDashboardData>>["recommendedProblems"];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Today&rsquo;s practice</CardTitle>
        <Button asChild variant="ghost" size="sm" className="-mr-2 h-7 text-xs">
          <Link href="/problems">
            All problems
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {problems.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nothing to recommend yet"
            description="Recommendations come from what you have attempted. Solve a problem and this fills in."
            size="sm"
          />
        ) : (
          <ul className="divide-border divide-y">
            {problems.map((problem) => (
              <li key={problem.id}>
                <Link
                  href={route(`/problems/${problem.slug}`)}
                  className="hover:bg-accent/40 flex items-center gap-3 px-6 py-3 transition-colors"
                >
                  <span className="text-muted-foreground w-8 shrink-0 font-mono text-xs tabular-nums">
                    {problem.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {problem.title}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {problem.reason}
                    </span>
                  </span>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QuizPerformanceCard({
  performance,
}: {
  performance: Awaited<ReturnType<typeof getDashboardData>>["quizPerformance"];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quiz performance</CardTitle>
      </CardHeader>
      <CardContent>
        {!performance ? (
          <EmptyState
            icon={BrainCircuit}
            title="No quiz attempts yet"
            description="Chapters end with a short quiz. Your average shows up here once you take one."
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-xs">Average score</span>
              <span className="tabular text-lg font-semibold">
                {performance.averagePercent}%
              </span>
            </div>
            <div
              className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
              role="img"
              aria-label={`Average quiz score ${performance.averagePercent} percent`}
            >
              <div
                className="bg-ember-500 h-full rounded-full"
                style={{ width: `${Math.max(2, performance.averagePercent)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs tabular-nums">
              {performance.passed} passed of {performance.attempts} attempt
              {performance.attempts === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeakPatternsCard({
  patterns,
}: {
  patterns: Awaited<ReturnType<typeof getDashboardData>>["weakPatterns"];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Needs work</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {patterns.length === 0 ? (
          <EmptyState
            icon={Shapes}
            title="No weak patterns"
            description="This is measured from your attempts, so it stays empty until you have practised."
            size="sm"
          />
        ) : (
          <ul className="divide-border divide-y">
            {patterns.map((pattern) => (
              <li key={pattern.id}>
                <Link
                  href={route(`/patterns/${pattern.slug}`)}
                  className="hover:bg-accent/40 block px-6 py-3 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {pattern.name}
                    </span>
                    <span className="text-muted-foreground tabular shrink-0 text-xs">
                      {pattern.solved}/{pattern.attempts}
                    </span>
                  </div>
                  <div
                    className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full"
                    role="img"
                    aria-label={`Mastery ${pattern.score} out of 100`}
                  >
                    <div
                      className="bg-difficulty-hard h-full rounded-full"
                      style={{ width: `${Math.max(3, pattern.score)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({
  submissions,
}: {
  submissions: Awaited<ReturnType<typeof getDashboardData>>["recentSubmissions"];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent submissions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {submissions.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title="No submissions yet"
            size="sm"
          />
        ) : (
          <ul className="divide-border divide-y">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={route(`/problems/${submission.problemSlug}`)}
                  className="hover:bg-accent/40 flex items-center gap-2 px-6 py-2.5 transition-colors"
                >
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {submission.problemTitle}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      submission.status === "ACCEPTED"
                        ? "text-success border-success/30 bg-success/10 h-5 px-1.5 text-[0.65rem]"
                        : "text-muted-foreground h-5 px-1.5 text-[0.65rem]"
                    }
                  >
                    {submission.status === "ACCEPTED" ? "Passed" : "Failed"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
