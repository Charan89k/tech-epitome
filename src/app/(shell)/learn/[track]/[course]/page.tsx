import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, CircleDot, Clock, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
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
import { lockStateFor } from "@/lib/auth/access";
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-4">
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

      <PageHeader
        title={course.title}
        description={course.description}
        actions={
          nextChapter ? (
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
          ) : null
        }
      />

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="tabular">
          {course.completedChapters}/{course.totalChapters} chapters
        </span>
        {course.estimatedHours > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />~{course.estimatedHours}h
          </span>
        )}
      </div>

      {course.sections.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed">
          <EmptyState
            title="No published sections in this course yet"
            description="Sections appear here once they are published."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {course.sections.map((section, index) => (
            <section key={section.id} aria-labelledby={`section-${section.slug}`}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2
                  id={`section-${section.slug}`}
                  className="flex items-baseline gap-2.5 text-sm font-semibold"
                >
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={route(`/learn/${segment}/${course.slug}/${section.slug}`)}
                    className="hover:text-ember-400 transition-colors"
                  >
                    {section.title}
                  </Link>
                </h2>
                <span className="text-muted-foreground tabular shrink-0 text-xs">
                  {section.completedChapters}/{section.totalChapters}
                </span>
              </div>

              {section.summary && (
                <p className="text-muted-foreground mb-3 max-w-2xl pl-8 text-xs leading-relaxed">
                  {section.summary}
                </p>
              )}

              <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                {section.chapters.map((chapter) => {
                  const lock = lockStateFor(user, chapter.access);

                  return (
                    <li key={chapter.id}>
                      <Link
                        href={route(
                          `/learn/${segment}/${course.slug}/${section.slug}/${chapter.slug}`
                        )}
                        className="hover:bg-accent/40 group flex items-center gap-3 px-4 py-3 transition-colors"
                      >
                        <ChapterStatusIcon status={chapter.status} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                chapter.status === "COMPLETED"
                                  ? "text-muted-foreground"
                                  : "text-foreground font-medium"
                              )}
                            >
                              {chapter.title}
                            </span>
                            {lock.locked && (
                              <Lock
                                className="text-muted-foreground/60 size-3 shrink-0"
                                aria-label="Pro"
                              />
                            )}
                          </div>
                          {chapter.summary && (
                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                              {chapter.summary}
                            </p>
                          )}
                        </div>

                        <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                          {chapter.problemCount > 0 && (
                            <span className="tabular hidden sm:inline">
                              {chapter.problemCount} problem
                              {chapter.problemCount === 1 ? "" : "s"}
                            </span>
                          )}
                          <span className="tabular">{chapter.readingMinutes}m</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
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
