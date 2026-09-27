import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ProgressRing } from "@/components/common/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { lockStateFor } from "@/lib/auth/access";
import { READER_TRACKS, trackForSegment } from "@/lib/tracks";
import { route } from "@/lib/utils";
import { listCourses } from "@/services/curriculum";

/**
 * Per-track copy.
 *
 * The page itself is track-agnostic — `listCourses` has taken a `Track`
 * since Phase 1 — so the only thing that differs is what the track is
 * called and why it is ordered the way it is.
 */
const TRACK_COPY: Record<
  string,
  { heading: string; description: string; metaTitle: string; metaDescription: string }
> = {
  DSA: {
    heading: "Data Structures & Algorithms",
    description:
      "Ordered by dependency, not by topic popularity. Each chapter states what you should be able to do afterwards, then checks it.",
    metaTitle: "DSA curriculum",
    metaDescription:
      "A structured data structures and algorithms curriculum, ordered by dependency: complexity analysis through advanced dynamic programming.",
  },
  SYSTEM_DESIGN: {
    heading: "System Design",
    description:
      "Vocabulary first, then components, then arrangements. Every diagram is data you can also read as text.",
    metaTitle: "System design curriculum",
    metaDescription:
      "Reason about large systems: scale, latency, replication, partitioning, consistency and the trade-offs between them.",
  },
  LLD: {
    heading: "Low-Level Design",
    description:
      "Designing the objects inside a service: responsibilities, relationships, and the patterns worth knowing by name.",
    metaTitle: "Low-level design curriculum",
    metaDescription:
      "Object-oriented design, SOLID and the design patterns that actually come up, with their costs stated.",
  },
};

export async function generateMetadata({
  params,
}: PageProps<"/learn/[track]">): Promise<Metadata> {
  const { track: segment } = await params;
  const track = trackForSegment(segment);
  if (!track || !READER_TRACKS.includes(track)) return { title: "Not found" };

  const copy = TRACK_COPY[track]!;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `/learn/${segment}` },
  };
}

export default async function TrackRoadmapPage({
  params,
}: PageProps<"/learn/[track]">) {
  const { track: segment } = await params;
  const track = trackForSegment(segment);
  // An unknown or non-reader track 404s rather than rendering an empty
  // roadmap, so /learn/nonsense is not a valid-looking page.
  if (!track || !READER_TRACKS.includes(track)) notFound();

  const copy = TRACK_COPY[track]!;
  const user = await getCurrentUser();
  const courses = await listCourses(track, user?.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title={copy.heading} description={copy.description} />

      {courses.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed">
          <EmptyState
            icon={BookOpen}
            title="No published courses yet"
            description="Courses appear here once they are published. If you are running this locally, seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {courses.map((course) => {
            const lock = lockStateFor(user, course.access);
            const percent =
              course.totalChapters > 0
                ? Math.round(
                    (course.completedChapters / course.totalChapters) * 100
                  )
                : 0;

            return (
              <li key={course.id}>
                <Link
                  href={route(`/learn/${segment}/${course.slug}`)}
                  className="border-border bg-card hover:border-ember-500/35 group flex items-center gap-5 rounded-lg border p-5 transition-colors"
                >
                  <ProgressRing
                    value={percent}
                    size={52}
                    strokeWidth={4}
                    label={`${course.completedChapters} of ${course.totalChapters} chapters complete`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-medium">
                        {course.title}
                      </h2>
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

                    {course.subtitle && (
                      <p className="text-muted-foreground mt-0.5 truncate text-sm">
                        {course.subtitle}
                      </p>
                    )}

                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="tabular">
                        {course.completedChapters}/{course.totalChapters} chapters
                      </span>
                      {course.estimatedHours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          ~{course.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-500 size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!user && courses.length > 0 && (
        <div className="border-border bg-card mt-8 flex flex-col items-start gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Create an account to track progress, save notes and get revision
            scheduled for you.
          </p>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
