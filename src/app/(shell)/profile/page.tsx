import type { Metadata } from "next";
import { CalendarDays, Clock, Flame, ListChecks, Shapes } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatTile } from "@/components/common/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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

  const [summary, profile, recentActivity] = await Promise.all([
    getProgressSummary(user.id),
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { username: true, bio: true, targetRole: true, createdAt: true },
    }),
    prisma.activityEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const totalSolved = summary.problemsSolved;
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
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Profile" />

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="text-base font-medium">
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {user.name ?? "Unnamed"}
              </h2>
              {user.isPro && (
                <Badge className="bg-ember-500/15 text-ember-400 border-ember-500/30 border">
                  Pro
                </Badge>
              )}
              {user.role === "ADMIN" && <Badge variant="outline">Admin</Badge>}
            </div>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
            {profile?.targetRole && (
              <p className="text-muted-foreground mt-1 text-xs">
                Preparing for: {profile.targetRole}
              </p>
            )}
          </div>

          {profile?.createdAt && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Joined{" "}
              {profile.createdAt.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        />
        <StatTile
          label="Study time"
          value={formatStudyTime(summary.studySeconds)}
          icon={Clock}
        />
      </div>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Solved by difficulty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalSolved === 0 ? (
            <EmptyState
              title="No problems solved yet"
              description="Difficulty breakdown appears once you have an accepted submission."
              size="sm"
            />
          ) : (
            breakdown.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="tabular font-medium">{row.value}</span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`${row.className} h-full rounded-full`}
                    style={{
                      width: `${totalSolved ? (row.value / totalSolved) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No activity recorded yet"
              description="Lessons, submissions and quizzes show up here as you work."
              size="sm"
            />
          ) : (
            <ul className="divide-border divide-y">
              {recentActivity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 px-6 py-2.5 text-xs"
                >
                  <span className="font-mono">{event.name}</span>
                  <time
                    dateTime={event.createdAt.toISOString()}
                    className="text-muted-foreground shrink-0"
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
        </CardContent>
      </Card>
    </div>
  );
}
