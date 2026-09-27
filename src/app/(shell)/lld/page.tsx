import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, CheckCircle2, Lock, PenLine } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lockStateFor } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import { listLLDProblems } from "@/services/lld";

export const metadata: Metadata = {
  title: "Design exercises — LLD",
  description:
    "Design the classes for a realistic brief, submit your design, then compare it against a reference and its trade-offs.",
  alternates: { canonical: "/lld" },
};

export default async function LLDIndexPage() {
  const user = await getCurrentUser();
  const problems = await listLLDProblems(user?.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Low-Level Design Exercises"
        description="Read the brief, decide what each class is the only thing that knows, and say what you traded away. The reference appears after you submit — not before."
      />

      {problems.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed">
          <EmptyState
            icon={Boxes}
            title="No exercises published yet"
            description="Design exercises appear here once published. Running locally? Seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {problems.map((problem) => {
            const lock = lockStateFor(user, problem.access);

            return (
              <li key={problem.slug}>
                <Link
                  href={route(`/lld/${problem.slug}`)}
                  className="border-border bg-card hover:border-ember-500/35 group flex items-start gap-4 rounded-lg border p-4 transition-colors sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-medium">{problem.title}</h2>
                      <DifficultyBadge difficulty={problem.difficulty} />

                      {problem.status === "COMPLETED" && (
                        <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Submitted
                        </Badge>
                      )}
                      {problem.status === "IN_PROGRESS" && (
                        <Badge variant="secondary" className="gap-1">
                          <PenLine className="size-3" aria-hidden="true" />
                          Draft
                        </Badge>
                      )}
                      {lock.locked && (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground h-5 gap-1 px-1.5 text-[0.65rem]"
                        >
                          <Lock className="size-2.5" aria-hidden="true" />
                          Pro
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {problem.tagline}
                    </p>

                    {problem.designPatterns.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {problem.designPatterns.map((pattern) => (
                          <span
                            key={pattern}
                            className="border-border text-muted-foreground rounded-md border px-1.5 py-0.5 text-[0.65rem]"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-500 mt-1 size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!user && problems.length > 0 && (
        <div className="border-border bg-card mt-8 flex flex-col items-start gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Sign in to save your designs and unlock the reference solutions.
          </p>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
