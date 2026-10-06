import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ListChecks, SlidersHorizontal } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/problems/pagination";
import { PatternGroupTable } from "@/components/problems/pattern-group";
import { RandomPick } from "@/components/problems/random-pick";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { ProblemRow } from "@/components/problems/problem-row";
import { ProblemSearch } from "@/components/problems/problem-search";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import {
  getProblemFilterOptions,
  listProblems,
  listProblemsByPattern,
  type PatternGroup,
  type ProblemFilters as Filters,
} from "@/services/problems";
import type { Difficulty, ProblemStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Problems",
  description:
    "Original coding problems organised by pattern and difficulty, with progressive hints and multi-approach solutions.",
  alternates: { canonical: "/problems" },
};

const DIFFICULTIES = new Set<Difficulty>(["EASY", "MEDIUM", "HARD"]);
const STATUSES = new Set<ProblemStatus>(["NOT_STARTED", "ATTEMPTED", "SOLVED"]);

/** Normalises a repeatable query param into a validated array. */
function multi<T extends string>(
  value: string | string[] | undefined,
  allowed: Set<string>
): T[] | undefined {
  const raw = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const filtered = raw.filter((v) => allowed.has(v)) as T[];
  return filtered.length ? filtered : undefined;
}

function strings(value: string | string[] | undefined): string[] | undefined {
  const raw = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const cleaned = raw.filter((v) => v.length > 0 && v.length < 120);
  return cleaned.length ? cleaned : undefined;
}

export default async function ProblemsPage({
  searchParams,
}: PageProps<"/problems">) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);

  const filters: Filters = {
    search: Array.isArray(params.q) ? params.q[0] : params.q,
    difficulty: multi<Difficulty>(params.difficulty, DIFFICULTIES),
    status: multi<ProblemStatus>(params.status, STATUSES),
    patternSlugs: strings(params.pattern),
    topicSlugs: strings(params.topic),
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };

  const [result, options] = await Promise.all([
    listProblems(filters, user?.id),
    getProblemFilterOptions(),
  ]);

  const difficultyOptions = options.difficulty.map((d) => ({
    value: d.value,
    label: d.value.charAt(0) + d.value.slice(1).toLowerCase(),
    count: d.count,
  }));
  const patternOptions = options.patterns.map((p) => ({
    value: p.slug,
    label: p.name,
    count: p.count,
  }));
  const topicOptions = options.topics.map((t) => ({
    value: t.slug,
    label: t.name,
    count: t.count,
  }));

  // Rebuild the query string without `page`, for pagination links.
  const baseParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      baseParams.append(key, v);
    }
  }

  const filtersNode = (
    <Suspense fallback={<FilterSkeleton />}>
      <ProblemFilters
        difficulty={difficultyOptions}
        patterns={patternOptions}
        topics={topicOptions}
        showStatus={Boolean(user)}
      />
    </Suspense>
  );

  // With no search or filter the page is the catalogue by pattern; any
  // narrowing switches to the flat, paginated result list.
  const narrowed = Boolean(
    filters.search?.trim() ||
      filters.difficulty ||
      filters.status ||
      filters.patternSlugs ||
      filters.topicSlugs
  );
  const groups = narrowed ? [] : await listProblemsByPattern(user?.id);
  const everything = groups.flatMap((group) => group.problems);
  const activeFilterCount =
    (filters.difficulty?.length ?? 0) +
    (filters.status?.length ?? 0) +
    (filters.patternSlugs?.length ?? 0) +
    (filters.topicSlugs?.length ?? 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          href="/learn/dsa"
          title="DSA Course"
          description="Learn each structure and pattern in order, with stepped visuals."
          diagram="pointers"
        />
        <FeatureCard
          href="/visualize"
          title="Live Visuals"
          description="Every problem draws its data and replays your code on it, line by line."
          diagram="list"
          badge="New"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 space-y-3">
          <PageHeader
            title="Problems"
            description="Practise by pattern. Open any problem to see its input drawn, then watch your own code move through it."
          />

          <div className="bg-card border-border flex items-center gap-2 rounded-xl border p-2">
            <div className="flex-1">
              <Suspense fallback={<Skeleton className="h-9 w-full" />}>
                <ProblemSearch
                  initialValue={
                    (Array.isArray(params.q) ? params.q[0] : params.q) ?? ""
                  }
                />
              </Suspense>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-ember-500 text-primary-foreground rounded-full px-1.5 text-[0.65rem] font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{filtersNode}</div>
              </SheetContent>
            </Sheet>

            {narrowed && (
              <Button asChild variant="ghost">
                <Link href="/problems">Clear</Link>
              </Button>
            )}
          </div>

          {!narrowed && (
            <RandomPick
              problems={everything.map((p) => ({ slug: p.slug, status: p.status }))}
              signedIn={Boolean(user)}
            />
          )}
        </div>

        <ProgressCard groups={groups} narrowed={narrowed} signedIn={Boolean(user)} />
      </div>

      <div className="mt-6">
        {narrowed ? (
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            {result.items.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No problems match"
                description="Try removing a filter or clearing the search."
              />
            ) : (
              <>
                <ul className="divide-border divide-y">
                  {result.items.map((problem) => (
                    <li key={problem.id}>
                      <ProblemRow problem={problem} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  total={result.total}
                  baseQuery={baseParams.toString()}
                  pathname="/problems"
                />
              </>
            )}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-card border-border rounded-xl border">
            <EmptyState
              icon={ListChecks}
              title="No problems yet"
              description="No problems are published yet. If you are running this locally, seed the database with npm run db:seed."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <PatternGroupTable
                key={group.pattern?.slug ?? "other"}
                group={group}
                defaultOpen={index < 3}
                signedIn={Boolean(user)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  title,
  description,
  diagram,
  badge,
}: {
  href: "/learn/dsa" | "/visualize";
  title: string;
  description: string;
  diagram: "pointers" | "list";
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border-border hover:border-ember-500/40 flex overflow-hidden rounded-xl border transition-colors"
    >
      <MiniDiagram kind={diagram} className="h-24 w-36 shrink-0 border-r sm:w-40" />
      <div className="relative min-w-0 flex-1 p-4">
        {badge && (
          <span className="bg-ember-500/15 text-ember-300 absolute top-3 right-3 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold">
            {badge}
          </span>
        )}
        <h2 className="group-hover:text-ember-200 font-semibold transition-colors">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">{description}</p>
      </div>
    </Link>
  );
}

function ProgressCard({
  groups,
  narrowed,
  signedIn,
}: {
  groups: PatternGroup[];
  narrowed: boolean;
  signedIn: boolean;
}) {
  const all = groups.flatMap((group) => group.problems);
  const rows = (["EASY", "MEDIUM", "HARD"] as const).map((level) => {
    const items = all.filter((p) => p.difficulty === level);
    const solved = items.filter((p) => p.status === "SOLVED").length;
    return { level, solved, total: items.length };
  });
  const solved = all.filter((p) => p.status === "SOLVED").length;

  if (narrowed) return null;

  return (
    <aside aria-label="Progress" className="bg-card border-border h-fit rounded-xl border p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Progress</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {solved} / {all.length} solved
        </span>
      </div>
      <div className="mt-4 space-y-3.5">
        {rows.map((row) => {
          const percent = row.total ? Math.round((row.solved / row.total) * 100) : 0;
          return (
            <div key={row.level}>
              <div className="flex justify-between text-xs">
                <DifficultyBadge difficulty={row.level} />
                <span className="text-muted-foreground tabular-nums">
                  {row.solved}/{row.total} ({percent}%)
                </span>
              </div>
              <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    row.level === "EASY"
                      ? "bg-difficulty-easy"
                      : row.level === "MEDIUM"
                        ? "bg-difficulty-medium"
                        : "bg-difficulty-hard"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {!signedIn && (
        <p className="text-muted-foreground border-border mt-4 border-t pt-3 text-xs">
          <Link href="/signup" className="text-ember-300 hover:underline">
            Create a free account
          </Link>{" "}
          to track what you solve.
        </p>
      )}
    </aside>
  );
}

function FilterSkeleton() {
  return (
    <div className="space-y-6">
      {[3, 6, 5].map((rows, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
