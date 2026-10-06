import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDashed,
  Grid3x3,
  Hash,
  Link2,
  List,
  Rows3,
  Type,
  type LucideIcon,
} from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import type { InputShape, PatternGroup } from "@/services/problems";
import { cn, route } from "@/lib/utils";

/**
 * One pattern's problems as a collapsible table, with a progress bar in the
 * header.
 *
 * Native <details> rather than a client component: opening a section needs
 * no JavaScript, works before hydration, and is keyboard- and
 * screen-reader-accessible by default.
 *
 * The "Visual" column says what the live visualizer will draw for the
 * problem — every problem has one — so a learner can pick by the shape of
 * the data as well as by pattern.
 */

const SHAPE_ICON: Record<InputShape, LucideIcon> = {
  array: List,
  string: Type,
  "linked list": Link2,
  grid: Grid3x3,
  words: Rows3,
  number: Hash,
};

export function PatternGroupTable({
  group,
  defaultOpen,
  signedIn,
}: {
  group: PatternGroup;
  defaultOpen: boolean;
  signedIn: boolean;
}) {
  const solved = group.problems.filter((p) => p.status === "SOLVED").length;
  const total = group.problems.length;
  const percent = total ? Math.round((solved / total) * 100) : 0;
  const title = group.pattern?.name ?? "Other";

  return (
    <details
      open={defaultOpen}
      className="group/section overflow-hidden rounded-xl border border-border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/30 sm:px-5 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="size-4 shrink-0 -rotate-90 text-muted-foreground transition-transform group-open/section:rotate-0"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="tracking-headline truncate text-base font-semibold sm:text-lg">
            {title}
          </h2>
          {group.pattern?.tagline && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {group.pattern.tagline}
            </p>
          )}
        </div>
        {group.pattern && (
          <Link
            href={route(`/patterns/${group.pattern.slug}`)}
            className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-ember-300 sm:flex"
          >
            Learn the pattern
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
        {signedIn && (
          <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {solved}/{total}
            </span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${title} progress`}
            >
              <div
                className="h-full rounded-full bg-ember-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </summary>

      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm sm:min-w-[34rem]">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th scope="col" className="w-14 px-4 py-2.5 font-medium sm:px-5">
                Status
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Problem
              </th>
              <th scope="col" className="w-20 px-2 py-2.5 font-medium sm:w-24">
                Difficulty
              </th>
              <th
                scope="col"
                className="hidden w-32 px-2 py-2.5 font-medium sm:table-cell"
              >
                Visual
              </th>
              <th scope="col" className="hidden w-12 px-4 py-2.5 sm:table-cell sm:px-5">
                <span className="sr-only">Saved</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {group.problems.map((problem) => {
              const ShapeIcon = problem.inputShape
                ? SHAPE_ICON[problem.inputShape]
                : null;
              return (
                <tr key={problem.id} className="transition-colors hover:bg-accent/25">
                  <td className="px-4 py-3 sm:px-5">
                    <StatusIcon status={problem.status} />
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={route(`/problems/${problem.slug}`)}
                      className={cn(
                        "font-medium transition-colors hover:text-ember-300",
                        problem.status === "SOLVED"
                          ? "text-muted-foreground"
                          : "text-info"
                      )}
                    >
                      {problem.title}
                    </Link>
                    <span className="ml-2 font-mono text-[0.68rem] text-muted-foreground/60 tabular-nums">
                      #{problem.number}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="hidden px-2 py-3 sm:table-cell">
                    {ShapeIcon && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShapeIcon
                          className="size-3.5 text-ember-400/80"
                          aria-hidden="true"
                        />
                        {problem.inputShape}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell sm:px-5">
                    {problem.bookmarked && (
                      <Bookmark
                        className="size-3.5 fill-current text-ember-500"
                        aria-label="Bookmarked"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function StatusIcon({
  status,
}: {
  status: PatternGroup["problems"][number]["status"];
}) {
  if (status === "SOLVED")
    return <CheckCircle2 className="size-[1.1rem] text-success" aria-label="Solved" />;
  if (status === "ATTEMPTED")
    return (
      <CircleDashed className="size-[1.1rem] text-warning" aria-label="Attempted" />
    );
  return (
    <Circle
      className="size-[1.1rem] text-muted-foreground/35"
      aria-label="Not started"
    />
  );
}
