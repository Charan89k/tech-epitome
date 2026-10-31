import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { route } from "@/lib/utils";
import { contestPhase, listContests } from "@/services/contests";

export const metadata: Metadata = {
  title: "Contests",
  description: "Timed problem sets with live standings.",
  alternates: { canonical: "/contests" },
};

const PHASE = {
  upcoming: { label: "Upcoming", variant: "info" },
  live: { label: "Live", variant: "success" },
  ended: { label: "Ended", variant: "outline" },
} as const;

export default async function ContestsPage() {
  const contests = await listContests();
  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Compete"
        title="Contests"
        description="A set of problems and a clock. Points for each solve; ties go to whoever got there sooner with fewer failed attempts."
      />
      {contests.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No contests are scheduled"
          description="When one is announced it will appear here with its start time and problems."
        />
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {contests.map((c) => {
            const phase = PHASE[contestPhase(c, now)];
            return (
              <li key={c.slug}>
                <Link
                  href={route(`/contests/${c.slug}`)}
                  className="group flex items-center gap-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium group-hover:text-brand-300">
                      {c.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-subtle-foreground">
                      {c.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC ·{" "}
                      {c._count.problems} problems · {c._count.entries} entered
                    </span>
                  </span>
                  <Badge variant={phase.variant}>{phase.label}</Badge>
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
