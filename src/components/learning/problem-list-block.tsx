import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, CircleDashed } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import type { Difficulty, ProblemStatus } from "@/generated/prisma/enums";
import { route } from "@/lib/utils";

export type LinkedProblem = {
  slug: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  status: ProblemStatus;
};

/** Practice problems attached to a chapter or embedded in a content block. */
export function ProblemListBlock({
  problems,
  title = "Practice",
}: {
  problems: LinkedProblem[];
  title?: string;
}) {
  if (problems.length === 0) return null;

  return (
    <section className="not-prose border-border bg-card my-6 overflow-hidden rounded-lg border">
      <h3 className="border-border bg-muted/40 border-b px-4 py-2 text-xs font-medium">
        {title}
      </h3>
      <ul className="divide-border divide-y">
        {problems.map((problem) => (
          <li key={problem.slug}>
            <Link
              href={route(`/problems/${problem.slug}`)}
              className="hover:bg-accent/40 group flex items-center gap-3 px-4 py-2.5 transition-colors"
            >
              <StatusDot status={problem.status} />
              <span className="text-muted-foreground w-6 shrink-0 font-mono text-xs tabular-nums">
                {problem.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{problem.title}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              <ArrowUpRight
                className="text-muted-foreground group-hover:text-ember-500 size-3.5 shrink-0 transition-colors"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusDot({ status }: { status: ProblemStatus }) {
  if (status === "SOLVED") {
    return <CheckCircle2 className="text-success size-4 shrink-0" aria-label="Solved" />;
  }
  if (status === "ATTEMPTED") {
    return <CircleDashed className="text-warning size-4 shrink-0" aria-label="Attempted" />;
  }
  return (
    <Circle className="text-muted-foreground/35 size-4 shrink-0" aria-label="Not started" />
  );
}
