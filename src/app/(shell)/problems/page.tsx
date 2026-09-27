import type { Metadata } from "next";
import { Suspense } from "react";
import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/problems/pagination";
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
import {
  getProblemFilterOptions,
  listProblems,
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Problems"
        description="Every problem is tagged with the pattern it teaches. Filter by pattern when you are drilling one, by difficulty when you are pacing yourself."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[13rem_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">{filtersNode}</aside>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Suspense fallback={<Skeleton className="h-9 w-full" />}>
                <ProblemSearch
                  initialValue={
                    (Array.isArray(params.q) ? params.q[0] : params.q) ?? ""
                  }
                />
              </Suspense>
            </div>

            {/* Mobile filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{filtersNode}</div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="border-border mt-4 overflow-hidden rounded-lg border">
            {result.items.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No problems match"
                description={
                  result.total === 0
                    ? "No problems are published yet. If you are running this locally, seed the database with npm run db:seed."
                    : "Try removing a filter or clearing the search."
                }
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
        </div>
      </div>
    </div>
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
