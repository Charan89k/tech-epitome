import type { Metadata } from "next";

import { StatPanel } from "@/components/admin/stat-panel";
import { getAdminOverview } from "@/services/admin";

export const metadata: Metadata = { title: "Overview" };

/** Milli-cents to a readable amount. Integers in, no float accumulation. */
function money(milliCents: number): string {
  return `$${(milliCents / 100_000).toFixed(2)}`;
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <StatPanel
          id="people"
          title="People"
          stats={[
            { label: "Accounts", value: overview.users.total },
            { label: "Admins", value: overview.users.admins },
            { label: "New this week", value: overview.users.newThisWeek },
          ]}
          action={{ href: "/admin/users", label: "Manage users" }}
        />
        <StatPanel
          id="activity"
          title="Activity, last 7 days"
          stats={[
            { label: "Submissions", value: overview.activity.submissions7d },
            { label: "Interviews", value: overview.activity.interviews7d },
            { label: "Tutor messages", value: overview.activity.tutorMessages7d },
          ]}
        />
      </div>

      <StatPanel
        id="content"
        title="Published content"
        stats={[
          { label: "Courses", value: overview.content.courses },
          {
            label: "Chapters",
            value: `${overview.content.publishedChapters}/${overview.content.chapters}`,
          },
          {
            label: "Problems",
            value: `${overview.content.publishedProblems}/${overview.content.problems}`,
          },
          { label: "Design", value: overview.content.systemDesign },
          { label: "LLD", value: overview.content.lld },
          { label: "Behavioural", value: overview.content.behavioral },
          { label: "Prep tracks", value: overview.content.prepTracks },
        ]}
        action={{ href: "/admin/content", label: "Manage content" }}
      />

      <StatPanel
        id="spend"
        title="AI, last 30 days"
        description="Nobody is charged for this — Tech Epitome is free. These figures exist so the cost of running the free AI features is a measured number rather than a guess."
        stats={[
          { label: "Calls", value: overview.ai.calls30d },
          { label: "Cost", value: money(overview.ai.costMilliCents30d) },
          { label: "Failures", value: overview.ai.failures30d },
        ]}
        action={{ href: "/admin/ai", label: "Break down by feature" }}
      />
    </div>
  );
}
