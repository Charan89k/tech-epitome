import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ProgressRing } from "@/components/common/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { lockStateFor } from "@/lib/auth/access";
import { route } from "@/lib/utils";
import { listCourses } from "@/services/curriculum";

export const metadata: Metadata = {
  title: "DSA curriculum",
  description:
    "A structured data structures and algorithms curriculum, ordered by dependency: complexity analysis through advanced dynamic programming.",
  alternates: { canonical: "/learn/dsa" },
};

export default async function DsaRoadmapPage() {
  const user = await getCurrentUser();
  const courses = await listCourses("DSA", user?.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Data Structures & Algorithms"
        description="Ordered by dependency, not by topic popularity. Each chapter states what you should be able to do afterwards, then checks it."
      />

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
                  href={route(`/learn/dsa/${course.slug}`)}
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
