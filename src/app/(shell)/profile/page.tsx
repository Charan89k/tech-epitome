import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Flame,
  ListChecks,
  Lock,
  Shapes,
  Trophy,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatTile } from "@/components/common/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/panel";
import { describeEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth/session";
import { listAchievements } from "@/services/achievements";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getProgressSummary } from "@/services/progress";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

function formatStudyTime(seconds: number): string {
  if (seconds < 60) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  // Sequential rather than concurrent. Four fan-out reads on one page
  // render is four connections from a pool sized for the whole process,
  // and the local development database serves exactly one. None of these
  // is slow enough for the parallelism to be worth the contention.
  const summary = await getProgressSummary(user.id);
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { username: true, bio: true, targetRole: true, createdAt: true },
  });
  const recentActivity = await prisma.activityEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, createdAt: true },
  });
  const achievements = await listAchievements(user.id);

  const totalSolved = summary.problemsSolved;
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;
  const breakdown = [
    { label: "Easy", value: summary.easySolved, className: "bg-difficulty-easy" },
    {
      label: "Medium",
      value: summary.mediumSolved,
      className: "bg-difficulty-medium",
    },
    { label: "Hard", value: summary.hardSolved, className: "bg-difficulty-hard" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Profile" />

      <section
        aria-label="Account"
        className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
      >
        <Avatar className="size-16 ring-2 ring-ember-500/30">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-ember-500/12 text-lg font-semibold text-ember-300">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="tracking-headline truncate text-xl font-bold">
              {user.name ?? "Unnamed"}
            </h2>
            {user.role === "ADMIN" && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
                Admin
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          {profile?.targetRole && (
            <p className="mt-1 text-xs text-muted-foreground">
              Preparing for:{" "}
              <span className="text-foreground">{profile.targetRole}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          {profile?.createdAt && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Joined{" "}
              {profile.createdAt.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/settings">Edit profile</Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Solved" value={summary.problemsSolved} icon={ListChecks} />
        <StatTile
          label="Patterns mastered"
          value={summary.patternsMastered}
          icon={Shapes}
        />
        <StatTile
          label="Current streak"
          value={`${summary.currentStreak}d`}
          icon={Flame}
          hint={`longest ${summary.longestStreak}d`}
          className={
            summary.currentStreak > 0 ? "border-ember-500/30 bg-ember-500/6" : undefined
          }
        />
        <StatTile
          label="Study time"
          value={formatStudyTime(summary.studySeconds)}
          icon={Clock}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel
          title="Achievements"
          action={
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {unlockedCount}/{achievements.length} unlocked
            </span>
          }
          bodyClassName="p-4 sm:p-5"
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const unlocked = achievement.unlockedAt !== null;
              const percent = Math.round(
                (achievement.current / achievement.threshold) * 100
              );

              return (
                <li
                  key={achievement.slug}
                  className={cn(
                    "rounded-lg border p-3",
                    unlocked
                      ? "border-ember-500/30 bg-ember-500/6"
                      : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        unlocked
                          ? "bg-ember-500/15 text-ember-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {unlocked ? (
                        <Trophy className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Lock className="size-3.5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{achievement.name}</p>
                        {unlocked ? (
                          <span className="shrink-0 text-[0.65rem] font-medium text-ember-400">
                            Unlocked
                          </span>
                        ) : (
                          <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground tabular-nums">
                            {achievement.current}/{achievement.threshold}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {achievement.description}
                      </p>
                      {/* Locked ones show the distance rather than hiding: a
                          badge you cannot see is not a goal. */}
                      {!unlocked && (
                        <div
                          className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={achievement.current}
                          aria-valuemin={0}
                          aria-valuemax={achievement.threshold}
                          aria-label={`Progress towards ${achievement.name}`}
                        >
                          <div
                            className="h-full rounded-full bg-ember-500/60"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel
            title="Solved by difficulty"
            action={
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {totalSolved} total
              </span>
            }
          >
            {totalSolved === 0 ? (
              <EmptyState
                title="No problems solved yet"
                description="Difficulty breakdown appears once you have an accepted submission."
                size="sm"
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/problems">Browse problems</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3.5 p-4 sm:px-5">
                {breakdown.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="tabular font-medium">{row.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`${row.className} h-full rounded-full`}
                        style={{
                          width: `${totalSolved ? (row.value / totalSolved) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Recent activity">
            {recentActivity.length === 0 ? (
              <EmptyState
                title="No activity recorded yet"
                description="Lessons, submissions and quizzes show up here as you work."
                size="sm"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentActivity.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-ember-500/70"
                        aria-hidden="true"
                      />
                      <span className="truncate">{describeEvent(event.name)}</span>
                    </span>
                    <time
                      dateTime={event.createdAt.toISOString()}
                      className="shrink-0 text-muted-foreground tabular-nums"
                    >
                      {event.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
