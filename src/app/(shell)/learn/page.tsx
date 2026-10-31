import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleDot, Search } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/problems/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Difficulty, Track } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/session";
import { courseHref, READER_TRACKS, TRACK_LABELS } from "@/lib/tracks";
import { route } from "@/lib/utils";
import {
  listCourses,
  searchCatalogue,
  type CatalogueChapter,
  type CourseSummary,
} from "@/services/curriculum";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Every Tech Epitome course in one place: DSA, system design and low-level design, searchable by chapter.",
  alternates: { canonical: "/learn" },
};

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The catalogue. With no query it lists every course by track, with the
 * learner's progress; with a search or filter it lists matching chapters,
 * paginated. Only published content is reachable from here.
 */
export default async function CataloguePage({ searchParams }: PageProps<"/learn">) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const search = one(params.q)?.trim().slice(0, 100) || undefined;
  const trackParam = one(params.track);
  const track = READER_TRACKS.find((t) => t === trackParam);
  const difficultyParam = one(params.difficulty);
  const difficulty = DIFFICULTIES.find((d) => d === difficultyParam);
  const page = Number.parseInt(one(params.page) ?? "1", 10);
  const filtering = Boolean(search || track || difficulty);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Courses"
        description="Pick a track, or search every chapter. Your progress is saved as you mark chapters complete."
      />

      <form
        role="search"
        action="/learn"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label htmlFor="catalogue-q" className="text-sm font-medium">
            Search chapters
          </label>
          <Input
            id="catalogue-q"
            name="q"
            type="search"
            defaultValue={search}
            maxLength={100}
            placeholder="e.g. binary search, caching"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="catalogue-track" className="text-sm font-medium">
            Track
          </label>
          <NativeSelect
            id="catalogue-track"
            name="track"
            defaultValue={track ?? ""}
            className="mt-1 w-full"
          >
            <option value="">All tracks</option>
            {READER_TRACKS.map((t) => (
              <option key={t} value={t}>
                {TRACK_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="catalogue-difficulty" className="text-sm font-medium">
            Difficulty
          </label>
          <NativeSelect
            id="catalogue-difficulty"
            name="difficulty"
            defaultValue={difficulty ?? ""}
            className="mt-1 w-full"
          >
            <option value="">Any</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit">
          <Search aria-hidden="true" />
          Search
        </Button>
      </form>

      {filtering ? (
        <ChapterResults
          filters={{
            search,
            track,
            difficulty,
            page: Number.isFinite(page) ? page : 1,
          }}
          userId={user?.id}
        />
      ) : (
        <CourseList userId={user?.id} />
      )}
    </div>
  );
}

async function CourseList({ userId }: { userId?: string }) {
  const byTrack = await Promise.all(
    READER_TRACKS.map(async (t) => [t, await listCourses(t, userId)] as const)
  );
  const any = byTrack.some(([, courses]) => courses.length > 0);
  if (!any) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No published courses yet"
        description="Courses appear here once they are published."
      />
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {byTrack
        .filter(([, courses]) => courses.length > 0)
        .map(([t, courses]) => (
          <section key={t} aria-labelledby={`track-${t}`} className="flex flex-col">
            <h2
              id={`track-${t}`}
              className="text-sm font-medium text-subtle-foreground"
            >
              {TRACK_LABELS[t]}
            </h2>
            <ul className="mt-2 grid flex-1 gap-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  const percent =
    course.totalChapters > 0
      ? Math.round((course.completedChapters / course.totalChapters) * 100)
      : 0;
  const action =
    course.completedChapters === 0
      ? "Start course"
      : course.completedChapters < course.totalChapters
        ? "Continue"
        : "Review";
  return (
    <li>
      <Link
        href={route(courseHref(course.track, course.slug))}
        className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors outline-none hover:border-brand-500/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="text-base font-semibold">{course.title}</span>
        {course.subtitle && (
          <span className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
            {course.subtitle}
          </span>
        )}
        <span className="mt-4 text-xs text-subtle-foreground tabular-nums">
          {course.completedChapters} of {course.totalChapters} chapters complete
          {course.estimatedHours > 0 && ` · about ${course.estimatedHours} h`}
        </span>
        <span
          role="progressbar"
          aria-label={`${course.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
        </span>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-300">
          {action}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </Link>
    </li>
  );
}

async function ChapterResults({
  filters,
  userId,
}: {
  filters: { search?: string; track?: Track; difficulty?: Difficulty; page: number };
  userId?: string;
}) {
  const result = await searchCatalogue(filters, userId);
  const baseQuery = new URLSearchParams(
    Object.entries({
      q: filters.search,
      track: filters.track,
      difficulty: filters.difficulty,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString();

  if (result.total === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={Search}
          title="No chapters match"
          description="Try a shorter search, or clear the filters."
          action={
            <Button asChild variant="outline">
              <Link href="/learn">Clear filters</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <section aria-label="Matching chapters" className="mt-8">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {result.total} {result.total === 1 ? "chapter" : "chapters"}
      </p>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
        {result.items.map((chapter) => (
          <ChapterRow key={chapter.id} chapter={chapter} />
        ))}
      </ul>
      <div className="mt-4">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          baseQuery={baseQuery}
          pathname="/learn"
          noun="chapter"
        />
      </div>
    </section>
  );
}

function ChapterRow({ chapter }: { chapter: CatalogueChapter }) {
  return (
    <li className="flex items-start gap-3 p-4">
      {chapter.status === "COMPLETED" ? (
        <CheckCircle2
          aria-label="Completed"
          className="mt-0.5 size-4 shrink-0 text-success"
        />
      ) : chapter.status === "IN_PROGRESS" ? (
        <CircleDot
          aria-label="In progress"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
      ) : (
        <span aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={route(chapter.href)}
          className="font-medium underline-offset-4 hover:underline"
        >
          {chapter.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {TRACK_LABELS[chapter.track]} · {chapter.courseTitle} · {chapter.sectionTitle}{" "}
          · {chapter.readingMinutes} min
        </p>
        {chapter.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {chapter.summary}
          </p>
        )}
      </div>
      <DifficultyBadge difficulty={chapter.difficulty} />
    </li>
  );
}
