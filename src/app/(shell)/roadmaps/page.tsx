import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDashed,
  Flag,
  MessagesSquare,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import type { Track } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/session";
import { segmentForTrack } from "@/lib/tracks";
import { cn, route } from "@/lib/utils";
import { getCourse, listCourses, type CourseDetail } from "@/services/curriculum";

export const metadata: Metadata = {
  title: "Roadmaps",
  description:
    "Ordered paths through data structures and algorithms, system design and low-level design — what to learn, in what order, and where to practise it.",
  alternates: { canonical: "/roadmaps" },
};

/**
 * Roadmaps: each track as one ordered path.
 *
 * Built entirely from the published curriculum — every stage is a real
 * course section, every count is a real row, every link opens a page that
 * exists. A roadmap that lists topics the product does not teach is a
 * promise it cannot keep, so nothing here is authored separately from the
 * content it points at. For a signed-in learner each stage shows their
 * progress and links to the next chapter they have not finished.
 */

type Practice = { href: string; label: string; description: string };

const ROADMAPS: {
  track: Track;
  anchor: string;
  title: string;
  why: string;
  diagram: "pointers" | "grid" | "stack";
  practice: Practice[];
}[] = [
  {
    track: "DSA",
    anchor: "dsa",
    title: "Data Structures & Algorithms",
    why: "Complexity first, because every later choice is argued in its terms; then the structures; then the patterns that combine them.",
    diagram: "pointers",
    practice: [
      {
        href: "/patterns",
        label: "Learn to recognise the patterns",
        description: "Each pattern opens with the clues that identify it.",
      },
      {
        href: "/problems",
        label: "Solve problems by pattern",
        description: "Every problem draws its input and replays your code on it.",
      },
    ],
  },
  {
    track: "SYSTEM_DESIGN",
    anchor: "system-design",
    title: "System Design",
    why: "Vocabulary first, then the components, then how they are arranged — so a design discussion is a sequence of trade-offs you can name.",
    diagram: "grid",
    practice: [
      {
        href: "/system-design",
        label: "Design a system yourself",
        description: "Draw it, state your trade-offs, then compare with the reference.",
      },
    ],
  },
  {
    track: "LLD",
    anchor: "lld",
    title: "Low-Level Design",
    why: "Responsibilities and relationships before patterns, so a pattern is a named answer to a problem you already recognise.",
    diagram: "stack",
    practice: [
      {
        href: "/lld",
        label: "Design the classes yourself",
        description: "Model a brief, then defend it against the reference design.",
      },
    ],
  },
];

async function loadCourse(track: Track, userId?: string): Promise<CourseDetail | null> {
  const [first] = await listCourses(track, userId);
  return first ? getCourse(first.slug, userId) : null;
}

export default async function RoadmapsPage() {
  const user = await getCurrentUser();
  const courses = await Promise.all(ROADMAPS.map((r) => loadCourse(r.track, user?.id)));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Roadmaps"
        description="What to learn, in what order, and where to practise it. Every stage is a section of a real course, so following a roadmap is following the curriculum."
      />

      <nav aria-label="Roadmaps" className="mt-6 grid gap-3 sm:grid-cols-3">
        {ROADMAPS.map((roadmap, index) => {
          const course = courses[index];
          const total = course?.totalChapters ?? 0;
          const done = course?.completedChapters ?? 0;
          return (
            <a
              key={roadmap.anchor}
              href={`#${roadmap.anchor}`}
              className="group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-ember-500/40"
            >
              <MiniDiagram
                kind={roadmap.diagram}
                className="h-20 w-24 shrink-0 border-r"
              />
              <span className="min-w-0 p-3">
                <span className="block text-sm font-semibold transition-colors group-hover:text-ember-200">
                  {roadmap.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {course
                    ? `${course.sections.length} stages · ${total} chapters`
                    : "Not published yet"}
                  {user && course ? ` · ${done}/${total} done` : ""}
                </span>
              </span>
            </a>
          );
        })}
      </nav>

      <div className="mt-10 space-y-14">
        {ROADMAPS.map((roadmap, index) => {
          const course = courses[index];
          if (!course) return null;
          const segment = segmentForTrack(roadmap.track);
          return (
            <section
              key={roadmap.anchor}
              id={roadmap.anchor}
              aria-labelledby={`${roadmap.anchor}-title`}
              className="scroll-mt-20"
            >
              <h2
                id={`${roadmap.anchor}-title`}
                className="tracking-headline text-xl font-bold sm:text-2xl"
              >
                {roadmap.title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {roadmap.why}
              </p>

              <ol className="relative mt-6 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[1.1rem] before:w-px before:bg-border">
                {course.sections.map((section, stage) => {
                  const next =
                    section.chapters.find((c) => c.status !== "COMPLETED") ??
                    section.chapters[0];
                  const complete =
                    section.totalChapters > 0 &&
                    section.completedChapters === section.totalChapters;
                  const started = section.completedChapters > 0 && !complete;
                  const percent = section.totalChapters
                    ? Math.round(
                        (section.completedChapters / section.totalChapters) * 100
                      )
                    : 0;
                  return (
                    <li key={section.id} className="relative flex gap-4">
                      <span
                        className={cn(
                          "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-xs",
                          complete
                            ? "border-success/50 text-success"
                            : started
                              ? "border-ember-500/60 text-ember-300"
                              : "border-border text-muted-foreground"
                        )}
                        aria-hidden="true"
                      >
                        {complete ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          String(stage + 1).padStart(2, "0")
                        )}
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold">{section.title}</h3>
                            {section.summary && (
                              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                                {section.summary}
                              </p>
                            )}
                          </div>
                          {next && (
                            <Link
                              href={route(
                                `/learn/${segment}/${course.slug}/${section.slug}/${next.slug}`
                              )}
                              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ember-300 hover:text-ember-200"
                            >
                              {complete ? "Revisit" : started ? "Continue" : "Start"}
                              <ArrowRight className="size-3.5" aria-hidden="true" />
                              <span className="sr-only"> {section.title}</span>
                            </Link>
                          )}
                        </div>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {section.chapters.map((chapter) => (
                            <li key={chapter.id}>
                              <Link
                                href={route(
                                  `/learn/${segment}/${course.slug}/${section.slug}/${chapter.slug}`
                                )}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-ember-500/40 hover:text-foreground"
                              >
                                {chapter.status === "COMPLETED" ? (
                                  <CheckCircle2
                                    className="size-3 text-success"
                                    aria-label="Completed"
                                  />
                                ) : chapter.status === "IN_PROGRESS" ? (
                                  <CircleDashed
                                    className="size-3 text-warning"
                                    aria-label="In progress"
                                  />
                                ) : (
                                  <Circle
                                    className="size-3 opacity-50"
                                    aria-label="Not started"
                                  />
                                )}
                                {chapter.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {user && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-ember-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[0.68rem] text-muted-foreground tabular-nums">
                              {section.completedChapters}/{section.totalChapters}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}

                {roadmap.practice.map((step) => (
                  <li key={step.href} className="relative flex gap-4">
                    <span
                      className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-ember-500/40 bg-background text-ember-300"
                      aria-hidden="true"
                    >
                      <Flag className="size-4" />
                    </span>
                    <Link
                      href={route(step.href)}
                      className="group min-w-0 flex-1 rounded-xl border border-ember-500/25 bg-ember-500/5 p-4 transition-colors hover:border-ember-500/50"
                    >
                      <span className="font-semibold transition-colors group-hover:text-ember-200">
                        {step.label}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {step.description}
                      </span>
                    </Link>
                  </li>
                ))}

                <li className="relative flex gap-4">
                  <span
                    className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                    aria-hidden="true"
                  >
                    <MessagesSquare className="size-4" />
                  </span>
                  <Link
                    href="/interviews"
                    className="group min-w-0 flex-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-ember-500/40"
                  >
                    <span className="font-semibold transition-colors group-hover:text-ember-200">
                      Rehearse it in a mock interview
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      An AI interviewer runs the stages, then gives written feedback
                      quoting your answers.
                    </span>
                  </Link>
                </li>
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
