import type { Metadata } from "next";
import Link from "next/link";
import { Shapes } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { diagramFor } from "@/components/learning/diagram-for";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
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

  const signedIn = Boolean(user);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="max-w-3xl">
        <p className="text-ember-400 text-[0.68rem] font-medium tracking-wider uppercase">
          Practice
        </p>
        <h1 className="tracking-headline mt-2 text-2xl font-bold sm:text-3xl">
          Algorithm patterns
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty sm:text-base">
          Anyone can look up how a sliding window works. The skill an interview
          tests is reading an unfamiliar problem and knowing which tool it is
          asking for — so every pattern here leads with its recognition clues.
        </p>
        {patterns.length > 0 && (
          <p className="text-muted-foreground mt-4 text-xs tabular-nums">
            {patterns.length} patterns
          </p>
        )}
      </header>

      {patterns.length === 0 ? (
        <div className="border-border bg-card mt-8 rounded-xl border">
          <EmptyState
            icon={Shapes}
            title="No patterns published yet"
            description="If you are running this locally, seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern, index) => {
            const mastered =
              pattern.mastery !== null &&
              pattern.mastery >= PATTERN_MASTERY_THRESHOLD;
            const solvedPercent = pattern.problemCount
              ? Math.round((pattern.solved / pattern.problemCount) * 100)
              : 0;

            return (
              <li key={pattern.id}>
                <Link
                  href={route(`/patterns/${pattern.slug}`)}
                  className="border-border bg-card hover:border-ember-500/40 group flex h-full overflow-hidden rounded-xl border transition-colors sm:flex-col"
                >
                  <MiniDiagram
                    kind={diagramFor(pattern.slug, index)}
                    className="border-border w-24 shrink-0 border-r sm:h-28 sm:w-full sm:border-r-0 sm:border-b"
                  />
                  <div className="flex min-w-0 flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="group-hover:text-ember-200 text-base font-semibold transition-colors">
                        {pattern.name}
                      </h2>
                      <DifficultyBadge difficulty={pattern.difficulty} className="mt-1 shrink-0" />
                    </div>

                    <p className="text-muted-foreground mt-1 line-clamp-2 flex-1 text-xs leading-relaxed">
                      {pattern.tagline}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {signedIn
                          ? `${pattern.solved}/${pattern.problemCount} solved`
                          : `${pattern.problemCount} problem${pattern.problemCount === 1 ? "" : "s"}`}
                      </span>

                      {pattern.mastery === null ? (
                        <span className="text-muted-foreground/60">Not practised</span>
                      ) : (
                        <span
                          className={cn(
                            "tabular-nums",
                            mastered ? "text-success" : "text-warning"
                          )}
                        >
                          {mastered ? "Mastered" : `${pattern.mastery}% mastery`}
                        </span>
                      )}
                    </div>

                    {signedIn && (
                      <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-ember-500 h-full rounded-full"
                          style={{ width: `${solvedPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
