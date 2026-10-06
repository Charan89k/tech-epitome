import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, List } from "lucide-react";

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
import { BookmarkButton } from "@/components/library/bookmark-button";
import { Highlightable } from "@/components/learning/highlightable";
import { NoteEditor } from "@/components/library/note-editor";
import { canAccess, FEATURES } from "@/lib/auth/access";
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
import { listHighlightsFor } from "@/services/highlights";
import { getNoteFor, isBookmarked } from "@/services/library";
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

  // Content is validated on read. A malformed row degrades this one chapter
  // rather than taking the page down.
  const blocks: ContentBlock[] = parseContent(
    chapter.content,
    `chapter:${chapter.slug}`
  );

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
  // a chapter body for a panel that will only ask them to sign in.
  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);

  // Two small per-user reads, only when there is a user. Both are keyed on
  // the chapter id, so nothing here can surface another learner's rows.
  // Sequential: three small per-user reads, and the local development
  // database serves one connection.
  const bookmarked = user
    ? await isBookmarked({
        userId: user.id,
        entityType: "CHAPTER",
        entityId: chapter.id,
      })
    : false;
  const note = user
    ? await getNoteFor({
        userId: user.id,
        entityType: "CHAPTER",
        entityId: chapter.id,
      })
    : null;
  const highlights = user
    ? await listHighlightsFor({
        userId: user.id,
        entityType: "CHAPTER",
        entityId: chapter.id,
      })
    : [];
  const tutorBundle =
    user && tutorAllowed
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
      enabled={tutorAllowed}
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
      {/* Left: curriculum navigation, a floating panel beside the rail */}
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 py-3 pl-3 xl:block">
        <div className="bg-card/60 border-border h-full overflow-hidden rounded-xl border">
          {nav}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile controls */}
        <div className="border-border bg-background/85 sticky top-14 z-20 flex items-center gap-2 border-b px-4 py-2 backdrop-blur-md xl:hidden">
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
                <Button variant="ghost" size="sm" className="h-8 lg:hidden">
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

          <span className="text-muted-foreground ml-auto truncate text-xs">
            {courseDetail.title}
          </span>
        </div>

        <div className="flex">
          {/* Centre: the lesson */}
          {/* Not a `main`: the shell already provides the landmark, and
              nesting them is invalid. */}
          <div className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 lg:px-10">
            <article className="mx-auto max-w-[44rem]">
              <ChapterHeader
                sectionTitle={chapter.section.title}
                title={chapter.title}
                summary={chapter.summary}
                difficulty={chapter.difficulty}
                readingMinutes={chapter.readingMinutes}
                percent={chapter.progress.percent}
                objectives={chapter.objectives}
                actions={
                  // Rendered once, not once per breakpoint: two launchers
                  // would mean two independent open states and two
                  // identical buttons in the accessibility tree.
                  <>
                    <BookmarkButton
                      entityType="CHAPTER"
                      entityId={chapter.id}
                      initiallyBookmarked={bookmarked}
                      signedIn={Boolean(user)}
                    />
                    {tutor}
                  </>
                }
              />

              {/* The reader is still server-rendered; Highlightable
                  only adds a selection listener and some marks on top
                  of the DOM that is already there. */}
              <Highlightable
                entityType="CHAPTER"
                entityId={chapter.id}
                initialHighlights={highlights}
                signedIn={Boolean(user)}
              >
                <div className={READING_CLASSES}>
                  <ContentRenderer blocks={blocks} resources={resources} />
                </div>
              </Highlightable>

              {footerProblems.length > 0 && (
                <ProblemListBlock
                  problems={footerProblems}
                  title="Practice for this chapter"
                />
              )}

              {/* After the lesson, before the completion prompt: a note
                  is something you write once you have read the thing. */}
              <div className="mt-8">
                <NoteEditor
                  entityType="CHAPTER"
                  entityId={chapter.id}
                  initialBody={note?.body ?? ""}
                  signedIn={Boolean(user)}
                />
              </div>

              <ChapterCompletion
                chapterId={chapter.id}
                keyTakeaways={chapter.keyTakeaways}
                initiallyComplete={chapter.progress.status === "COMPLETED"}
                signedIn={Boolean(user)}
                next={chapter.next}
                hasQuiz={chapter.quizSlugs.length > 0}
                problemCount={chapter.problems.length}
              />

              {/* Previous / next */}
              <nav
                aria-label="Chapter navigation"
                className="mt-8 grid grid-cols-2 gap-3"
              >
                {chapter.previous ? (
                  <Link
                    href={route(chapter.previous.href)}
                    rel="prev"
                    className="border-border bg-card hover:border-ember-500/40 group min-w-0 rounded-xl border p-4 transition-colors"
                  >
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <ChevronLeft className="size-3.5" aria-hidden="true" />
                      Previous
                    </span>
                    <span className="group-hover:text-ember-200 mt-1 block truncate text-sm font-semibold transition-colors">
                      {chapter.previous.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}

                {chapter.next ? (
                  <Link
                    href={route(chapter.next.href)}
                    rel="next"
                    className="border-border bg-card hover:border-ember-500/40 group min-w-0 rounded-xl border p-4 text-right transition-colors"
                  >
                    <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                      Next
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="group-hover:text-ember-200 mt-1 block truncate text-sm font-semibold transition-colors">
                      {chapter.next.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </article>
          </div>

          {/* Right: reading progress and table of contents */}
          {toc.length > 0 && (
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pr-6 lg:block xl:w-64">
              <ChapterToc entries={toc} showProgress />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Long-form reading styles for the lesson body.
 *
 * Applied from here rather than inside ContentRenderer, which also renders
 * problem statements at a denser size. Only direct prose blocks are touched
 * — a paragraph inside a callout or card keeps its own styling.
 */
const READING_CLASSES = [
  "reading mt-10 space-y-5",
  "[&_[data-block-index]>p]:text-foreground/85 [&_[data-block-index]>p]:leading-[1.75]",
  "[&_[data-block-index]>ul>li]:text-foreground/85 [&_[data-block-index]>ol>li]:text-foreground/85",
  "[&_[data-block-index]>h2]:tracking-headline [&_[data-block-index]>h2]:text-2xl [&_[data-block-index]>h2]:font-bold [&_[data-block-index]>h2]:scroll-mt-32",
  "[&_[data-block-index]>h3]:tracking-headline [&_[data-block-index]>h3]:text-lg [&_[data-block-index]>h3]:scroll-mt-32",
].join(" ");
