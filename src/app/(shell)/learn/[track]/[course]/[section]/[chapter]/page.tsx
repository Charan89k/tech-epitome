import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, List, Lock } from "lucide-react";

import { ChapterCompletion } from "@/components/learning/chapter-completion";
import { ChapterHeader } from "@/components/learning/chapter-header";
import { ChapterNav } from "@/components/learning/chapter-nav";
import { ChapterToc, type TocEntry } from "@/components/learning/chapter-toc";
import {
  ContentRenderer,
  slugify,
  type ContentResources,
} from "@/components/learning/content-renderer";
import { ProblemListBlock } from "@/components/learning/problem-list-block";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
import { canAccess, FEATURES, lockStateFor } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { labelFor } from "@/lib/tutor/context";
import { CHAPTER_QUICK_ACTIONS } from "@/lib/tutor/types";
import { loadContextBundle } from "@/services/tutor";
import { parseContent } from "@/lib/validation/content";
import { route } from "@/lib/utils";
import {
  getChapter,
  getCourse,
  getLinkedProblems,
  getPatternNames,
  resolveContentResources,
} from "@/services/curriculum";
import { getQuiz, type QuizView } from "@/services/quiz";
import type { ContentBlock } from "@/types/content";

type Params = PageProps<"/learn/[track]/[course]/[section]/[chapter]">;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { track, course, section, chapter: chapterSlug } = await params;
  const chapter = await getChapter(course, section, chapterSlug);
  if (!chapter) return { title: "Chapter not found" };

  return {
    title: chapter.title,
    description: chapter.summary ?? undefined,
    alternates: {
      canonical: `/learn/${track}/${course}/${section}/${chapterSlug}`,
    },
  };
}

export default async function ChapterPage({ params }: Params) {
  const {
    track: trackSegment,
    course: courseSlug,
    section: sectionSlug,
    chapter: chapterSlug,
  } = await params;

  const user = await getCurrentUser();
  const [chapter, courseDetail] = await Promise.all([
    getChapter(courseSlug, sectionSlug, chapterSlug, user?.id),
    getCourse(courseSlug, user?.id),
  ]);

  if (!chapter || !courseDetail) notFound();

  const lock = lockStateFor(user, chapter.access);

  // Content is validated on read. A malformed row degrades this one chapter
  // rather than taking the page down.
  const blocks: ContentBlock[] = lock.locked
    ? []
    : parseContent(chapter.content, `chapter:${chapter.slug}`);

  const referenced = await resolveContentResources(blocks, user?.id);

  // Chapter-attached problems and content-referenced ones are fetched
  // together so the page issues one problem query, not two.
  const allProblemSlugs = [
    ...new Set([
      ...referenced.problemSlugs,
      ...chapter.problems.map((problem) => problem.slug),
    ]),
  ];

  const [quizzes, problems, patternNames] = await Promise.all([
    Promise.all(referenced.quizSlugs.map((slug) => getQuiz(slug, user?.id))),
    getLinkedProblems(allProblemSlugs, user?.id),
    getPatternNames(referenced.patternSlugs),
  ]);

  const resources: ContentResources = {
    quizzes: new Map(
      quizzes
        .filter((quiz): quiz is QuizView => quiz !== null)
        .map((quiz) => [quiz.slug, quiz])
    ),
    problems,
    patternNames,
    signedIn: Boolean(user),
  };

  const toc: TocEntry[] = blocks
    .filter(
      (block): block is Extract<ContentBlock, { type: "heading" }> =>
        block.type === "heading"
    )
    .map((block) => ({
      id: block.id ?? slugify(block.text),
      text: block.text,
      level: block.level,
    }));

  // Practice problems attached to the chapter but not already embedded in
  // the body, so they are not listed twice.
  const embeddedSlugs = new Set(referenced.problemSlugs);
  const footerProblems = chapter.problems
    .filter((problem) => !embeddedSlugs.has(problem.slug))
    .map((problem) => problems.get(problem.slug))
    .filter((problem): problem is NonNullable<typeof problem> => Boolean(problem));

  // Derived from the same bundle the tutor is given, so the header cannot
  // claim context the model did not receive. Skipped entirely when the
  // learner cannot use the tutor — there is no reason to read and flatten
  // a chapter body for a panel that will render a paywall.
  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);
  const tutorBundle =
    user && tutorAllowed && !lock.locked
      ? await loadContextBundle(
          {
            kind: "CHAPTER",
            courseSlug,
            sectionSlug,
            chapterSlug,
          },
          user.id
        )
      : null;

  const tutor = (
    <TutorLauncher
      anchor={{
        kind: "CHAPTER",
        courseSlug,
        sectionSlug,
        chapterSlug,
      }}
      label={
        tutorBundle
          ? labelFor(tutorBundle)
          : {
              contextType: "CHAPTER",
              primary: chapter.patterns[0]?.name ?? chapter.section.title,
              secondary: chapter.title,
              chips: [
                chapter.difficulty.charAt(0) +
                  chapter.difficulty.slice(1).toLowerCase(),
              ],
            }
      }
      quickActions={CHAPTER_QUICK_ACTIONS}
      access={!user ? "signin" : tutorAllowed ? "allowed" : "upgrade"}
    />
  );

  const nav = (
    <ChapterNav
      trackSegment={trackSegment}
      courseSlug={courseSlug}
      courseTitle={courseDetail.title}
      sections={courseDetail.sections}
      currentChapterSlug={chapter.slug}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-[100rem]">
      {/* Left: curriculum navigation */}
      <aside className="border-border sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r xl:block">
        {nav}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile controls */}
        <div className="border-border bg-background/80 sticky top-14 z-20 flex items-center gap-2 border-b px-4 py-2 backdrop-blur-md xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <List className="size-4" />
                Contents
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Course contents</SheetTitle>
              </SheetHeader>
              {nav}
            </SheetContent>
          </Sheet>

          {toc.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  On this page
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>On this page</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                  <ChapterToc entries={toc} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="flex">
          {/* Centre: the lesson */}
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
            <article className="mx-auto max-w-[44rem]">
              <ChapterHeader
                sectionTitle={chapter.section.title}
                title={chapter.title}
                summary={chapter.summary}
                difficulty={chapter.difficulty}
                readingMinutes={chapter.readingMinutes}
                percent={chapter.progress.percent}
                objectives={chapter.objectives}
              />

              {/* Rendered once, not once per breakpoint: two launchers would
                  mean two independent open states and two identical buttons
                  in the accessibility tree. */}
              {!lock.locked && (
                <div className="mt-4 flex justify-end">{tutor}</div>
              )}

              {lock.locked ? (
                <div className="border-border bg-card mt-8 rounded-lg border p-8 text-center">
                  <Lock
                    className="text-muted-foreground mx-auto size-6"
                    aria-hidden="true"
                  />
                  <h2 className="mt-3 text-sm font-semibold">
                    This chapter is part of Pro
                  </h2>
                  <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm">
                    {lock.reason === "signin"
                      ? "Sign in to check whether your plan includes it."
                      : "Upgrade to read this chapter and the rest of the advanced curriculum."}
                  </p>
                  <Button asChild className="mt-5">
                    <Link href={lock.reason === "signin" ? "/login" : "/pricing"}>
                      {lock.reason === "signin" ? "Sign in" : "See plans"}
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-8 space-y-4">
                    <ContentRenderer blocks={blocks} resources={resources} />
                  </div>

                  {footerProblems.length > 0 && (
                    <ProblemListBlock
                      problems={footerProblems}
                      title="Practice for this chapter"
                    />
                  )}

                  <ChapterCompletion
                    chapterId={chapter.id}
                    keyTakeaways={chapter.keyTakeaways}
                    initiallyComplete={chapter.progress.status === "COMPLETED"}
                    signedIn={Boolean(user)}
                    next={chapter.next}
                    hasQuiz={chapter.quizSlugs.length > 0}
                    problemCount={chapter.problems.length}
                  />
                </>
              )}

              {/* Previous / next */}
              <nav
                aria-label="Chapter navigation"
                className="border-border mt-8 flex items-stretch justify-between gap-3 border-t pt-6"
              >
                {chapter.previous ? (
                  <Link
                    href={route(chapter.previous.href)}
                    rel="prev"
                    className="border-border hover:border-ember-500/35 group min-w-0 flex-1 rounded-lg border p-3 transition-colors"
                  >
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <ChevronLeft className="size-3.5" aria-hidden="true" />
                      Previous
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium">
                      {chapter.previous.title}
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}

                {chapter.next ? (
                  <Link
                    href={route(chapter.next.href)}
                    rel="next"
                    className="border-border hover:border-ember-500/35 group min-w-0 flex-1 rounded-lg border p-3 text-right transition-colors"
                  >
                    <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                      Next
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium">
                      {chapter.next.title}
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
              </nav>
            </article>
          </main>

          {/* Right: table of contents */}
          {toc.length > 0 && !lock.locked && (
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pr-6 lg:block xl:w-64">
              <ChapterToc entries={toc} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
