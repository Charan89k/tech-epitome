import type { Metadata } from "next";
import Link from "next/link";
import { Shapes } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { cn, route } from "@/lib/utils";
import { listPatterns } from "@/services/patterns";
import { PATTERN_MASTERY_THRESHOLD } from "@/services/progress";

export const metadata: Metadata = {
  title: "Algorithm patterns",
  description:
    "The recurring shapes behind coding interview problems, each with the clues that identify it and the look-alikes that do not.",
  alternates: { canonical: "/patterns" },
};

export default async function PatternsPage() {
  const user = await getCurrentUser();
  const patterns = await listPatterns(user?.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Algorithm patterns"
        description="Anyone can look up how a sliding window works. The skill an interview tests is reading an unfamiliar problem and knowing which tool it is asking for — so every pattern here leads with its recognition clues."
      />

      {patterns.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed">
          <EmptyState
            icon={Shapes}
            title="No patterns published yet"
            description="If you are running this locally, seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {patterns.map((pattern) => {
            const mastered =
              pattern.mastery !== null &&
              pattern.mastery >= PATTERN_MASTERY_THRESHOLD;

            return (
              <li key={pattern.id}>
                <Link
                  href={route(`/patterns/${pattern.slug}`)}
                  className="border-border bg-card hover:border-ember-500/35 flex h-full flex-col rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm font-medium">{pattern.name}</h2>
                    <DifficultyBadge difficulty={pattern.difficulty} />
                  </div>

                  <p className="text-muted-foreground mt-1.5 flex-1 text-xs leading-relaxed">
                    {pattern.tagline}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-[0.68rem] tabular-nums">
                      {pattern.problemCount} problem
                      {pattern.problemCount === 1 ? "" : "s"}
                    </span>

                    {pattern.mastery === null ? (
                      <span className="text-muted-foreground/60 text-[0.68rem]">
                        Not practised
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-[0.68rem] tabular-nums",
                          mastered ? "text-success" : "text-warning"
                        )}
                      >
                        {mastered ? "Mastered" : `${pattern.mastery}% mastery`}
                      </span>
                    )}
                  </div>

                  {pattern.mastery !== null && (
                    <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          mastered ? "bg-success" : "bg-warning"
                        )}
                        style={{ width: `${Math.max(3, pattern.mastery)}%` }}
                      />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
