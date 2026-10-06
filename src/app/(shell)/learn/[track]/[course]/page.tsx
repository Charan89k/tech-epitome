import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Circle, CircleDot, Clock, Layers } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { diagramFor } from "@/components/learning/diagram-for";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth/session";
import { TRACK_LABELS } from "@/lib/tracks";
import { cn, route } from "@/lib/utils";
import { findNextIncompleteChapter, getCourse } from "@/services/curriculum";

export async function generateMetadata({
  params,
}: PageProps<"/learn/[track]/[course]">): Promise<Metadata> {
  const { track: segment, course: slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course not found" };

  return {
    title: course.title,
    description: course.description,
    alternates: { canonical: `/learn/${segment}/${course.slug}` },
  };
}

export default async function CoursePage({
  params,
}: PageProps<"/learn/[track]/[course]">) {
  const { track: segment, course: slug } = await params;
  const user = await getCurrentUser();
  const course = await getCourse(slug, user?.id);

  if (!course) notFound();

  const nextChapter = await findNextIncompleteChapter(
    course.slug,
    user?.id,
    course.track
  );

  const percent = course.totalChapters
    ? Math.round((course.completedChapters / course.totalChapters) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={route(`/learn/${segment}`)}>{TRACK_LABELS[course.track]}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="border-border bg-card flex flex-col overflow-hidden rounded-xl border md:flex-row">
        <MiniDiagram
          kind={diagramFor(course.slug)}
          className="border-border h-32 shrink-0 border-b md:h-auto md:w-60 md:border-r md:border-b-0"
        />
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <h1 className="tracking-headline text-2xl font-bold sm:text-3xl">{course.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed text-pretty">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="bg-muted/50 border-border text-muted-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs">
              <BookOpen className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">
                {course.completedChapters}/{course.totalChapters} chapters
              </span>
            </span>
            {course.sections.length > 0 && (
              <span className="bg-muted/50 border-border text-muted-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs">
                <Layers className="size-3.5" aria-hidden="true" />
                {course.sections.length} sections
              </span>
            )}
            {course.estimatedHours > 0 && (
              <span className="bg-muted/50 border-border text-muted-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs">
                <Clock className="size-3.5" aria-hidden="true" />~{course.estimatedHours}h
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            {nextChapter ? (
              <Button asChild>
                <Link href={route(nextChapter.href)}>
                  {course.completedChapters > 0 ? "Continue" : "Start course"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : course.totalChapters > 0 ? (
              <Badge className="bg-success/15 text-success border-success/30 border">
                Course complete
              </Badge>
            ) : null}
            {nextChapter && (
              <p className="text-muted-foreground min-w-0 truncate text-xs">
                Up next: <span className="text-foreground">{nextChapter.title}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      {course.sections.length === 0 ? (
        <div className="border-border bg-card mt-8 rounded-xl border">
          <EmptyState
            title="No published sections in this course yet"
            description="Sections appear here once they are published."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0 space-y-4">
            {course.sections.map((section, index) => {
              const sectionPercent = section.totalChapters
                ? Math.round((section.completedChapters / section.totalChapters) * 100)
                : 0;
              return (
                <section
                  key={section.id}
                  id={`section-${section.slug}`}
                  aria-labelledby={`section-${section.slug}-title`}
                  className="border-border bg-card scroll-mt-20 overflow-hidden rounded-xl border"
                >
                  <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
                    <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-xs tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2
                        id={`section-${section.slug}-title`}
                        className="tracking-headline text-base font-semibold sm:text-lg"
                      >
                        <Link
                          href={route(`/learn/${segment}/${course.slug}/${section.slug}`)}
                          className="hover:text-ember-300 transition-colors"
                        >
                          {section.title}
                        </Link>
                      </h2>
                      {section.summary && (
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed sm:text-sm">
                          {section.summary}
                        </p>
                      )}
                    </div>
                    <div className="hidden w-32 shrink-0 items-center gap-2 pt-1.5 sm:flex">
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {section.completedChapters}/{section.totalChapters}
                      </span>
                      <div
                        className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-valuenow={sectionPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${section.title} progress`}
                      >
                        <div
                          className="bg-ember-500 h-full rounded-full"
                          style={{ width: `${sectionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <ul className="border-border divide-border divide-y border-t">
                    {section.chapters.map((chapter) => (
                      <li key={chapter.id}>
                        <Link
                          href={route(
                            `/learn/${segment}/${course.slug}/${section.slug}/${chapter.slug}`
                          )}
                          className="hover:bg-accent/30 group flex items-center gap-3 px-4 py-3 transition-colors sm:px-5"
                        >
                          <ChapterStatusIcon status={chapter.status} />

                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "group-hover:text-ember-300 block truncate text-sm font-medium transition-colors",
                                chapter.status === "COMPLETED"
                                  ? "text-muted-foreground"
                                  : "text-info"
                              )}
                            >
                              {chapter.title}
                            </span>
                            {chapter.summary && (
                              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                {chapter.summary}
                              </p>
                            )}
                          </div>

                          <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                            {chapter.problemCount > 0 && (
                              <span className="hidden tabular-nums sm:inline">
                                {chapter.problemCount} problem
                                {chapter.problemCount === 1 ? "" : "s"}
                              </span>
                            )}
                            <span className="flex items-center gap-1 tabular-nums">
                              <Clock className="size-3" aria-hidden="true" />
                              {chapter.readingMinutes}m
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <aside
            aria-label="Course progress"
            className="border-border bg-card sticky top-[4.5rem] hidden h-fit rounded-xl border p-4 lg:block"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Progress</h2>
              <span className="text-muted-foreground text-xs tabular-nums">
                {course.completedChapters} / {course.totalChapters} chapters
              </span>
            </div>
            <div className="bg-muted mt-2.5 h-1.5 overflow-hidden rounded-full">
              <div className="bg-ember-500 h-full rounded-full" style={{ width: `${percent}%` }} />
            </div>

            <ol className="border-border mt-4 space-y-0.5 border-t pt-3">
              {course.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#section-${section.slug}`}
                    className="text-muted-foreground hover:bg-accent/40 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
                  >
                    <span className="text-muted-foreground/70 font-mono text-[0.65rem] tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{section.title}</span>
                    <span className="font-mono text-[0.65rem] tabular-nums">
                      {section.completedChapters}/{section.totalChapters}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}

function ChapterStatusIcon({
  status,
}: {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}) {
  if (status === "COMPLETED") {
    return (
      <CheckCircle2
        className="text-success size-4 shrink-0"
        aria-label="Completed"
      />
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <CircleDot
        className="text-ember-500 size-4 shrink-0"
        aria-label="In progress"
      />
    );
  }
  return (
    <Circle
      className="text-muted-foreground/40 size-4 shrink-0"
      aria-label="Not started"
    />
  );
}
