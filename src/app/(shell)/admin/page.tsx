import type { Metadata } from "next";
import Link from "next/link";

import { StatTile } from "@/components/common/stat-tile";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/services/admin";

export const metadata: Metadata = { title: "Overview" };

/** Milli-cents to a readable amount. Integers in, no float accumulation. */
function money(milliCents: number): string {
  return `$${(milliCents / 100_000).toFixed(2)}`;
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="space-y-8">
      <section aria-labelledby="people">
        <h2 id="people" className="text-sm font-semibold">
          People
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Accounts" value={overview.users.total} />
          <StatTile label="Admins" value={overview.users.admins} />
          <StatTile label="New this week" value={overview.users.newThisWeek} />
        </div>
      </section>

      <section aria-labelledby="content">
        <h2 id="content" className="text-sm font-semibold">
          Published content
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Courses" value={overview.content.courses} />
          <StatTile
            label="Chapters"
            value={`${overview.content.publishedChapters}/${overview.content.chapters}`}
          />
          <StatTile
            label="Problems"
            value={`${overview.content.publishedProblems}/${overview.content.problems}`}
          />
          <StatTile label="Design" value={overview.content.systemDesign} />
          <StatTile label="LLD" value={overview.content.lld} />
          <StatTile label="Behavioural" value={overview.content.behavioral} />
          <StatTile label="Prep tracks" value={overview.content.prepTracks} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/admin/content">Manage content</Link>
        </Button>
      </section>

      <section aria-labelledby="activity">
        <h2 id="activity" className="text-sm font-semibold">
          Activity, last 7 days
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Submissions" value={overview.activity.submissions7d} />
          <StatTile label="Interviews" value={overview.activity.interviews7d} />
          <StatTile label="Tutor messages" value={overview.activity.tutorMessages7d} />
        </div>
      </section>

      <section aria-labelledby="spend">
        <h2 id="spend" className="text-sm font-semibold">
          AI, last 30 days
        </h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Nobody is charged for this — Tech Epitome is free. These figures exist so
          the cost of running the free AI features is a measured number rather
          than a guess.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Calls" value={overview.ai.calls30d} />
          <StatTile label="Cost" value={money(overview.ai.costMilliCents30d)} />
          <StatTile label="Failures" value={overview.ai.failures30d} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/admin/ai">Break down by feature</Link>
        </Button>
      </section>
    </div>
  );
}
