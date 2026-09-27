import Link from "next/link";
import { Bookmark, CheckCircle2, Circle, CircleDashed } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import type { ProblemListItem } from "@/services/problems";
import { cn, route } from "@/lib/utils";

/** One row in the problem catalogue. Server-rendered; no client JS. */
export function ProblemRow({ problem }: { problem: ProblemListItem }) {
  return (
    <Link
      href={route(`/problems/${problem.slug}`)}
      className="hover:bg-accent/40 group grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors sm:grid-cols-[1.75rem_2rem_1fr_auto]"
    >
      <StatusIcon status={problem.status} />

      <span className="text-muted-foreground hidden font-mono text-xs tabular-nums sm:block">
        {problem.number}
      </span>

      <span className="col-start-2 row-start-1 min-w-0 sm:col-start-3">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              problem.status === "SOLVED"
                ? "text-muted-foreground"
                : "text-foreground font-medium"
            )}
          >
            {problem.title}
          </span>
          {problem.bookmarked && (
            <Bookmark
              className="text-ember-500 size-3 shrink-0 fill-current"
              aria-label="Bookmarked"
            />
          )}
        </span>

        {problem.patterns.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {problem.patterns.slice(0, 3).map((pattern) => (
              <span
                key={pattern.slug}
                className="text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 text-[0.68rem]"
              >
                {pattern.name}
              </span>
            ))}
          </span>
        )}
      </span>

      <DifficultyBadge
        difficulty={problem.difficulty}
        className="col-start-3 row-start-1 justify-self-end sm:col-start-4"
      />
    </Link>
  );
}

function StatusIcon({ status }: { status: ProblemListItem["status"] }) {
  if (status === "SOLVED") {
    return (
      <CheckCircle2 className="text-success size-4 shrink-0" aria-label="Solved" />
    );
  }
  if (status === "ATTEMPTED") {
    return (
      <CircleDashed
        className="text-warning size-4 shrink-0"
        aria-label="Attempted"
      />
    );
  }
  return (
    <Circle
      className="text-muted-foreground/35 size-4 shrink-0"
      aria-label="Not started"
    />
  );
}
