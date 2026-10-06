import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  CircleDashed,
  ListChecks,
  X,
} from "lucide-react";

import { CodeBlock } from "@/components/learning/code-block";
import { diagramFor } from "@/components/learning/diagram-for";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { NoteEditor } from "@/components/library/note-editor";
import { getCurrentUser } from "@/lib/auth/session";
import { getNoteFor, isBookmarked } from "@/services/library";
import { LANGUAGE_LABEL } from "@/lib/code-execution/signature";
import { chapterHref } from "@/lib/tracks";
import { cn, route } from "@/lib/utils";
import { getPattern, type PatternDetail } from "@/services/patterns";

export async function generateMetadata({
  params,
}: PageProps<"/patterns/[pattern]">): Promise<Metadata> {
  const { pattern: slug } = await params;
  const pattern = await getPattern(slug);
  if (!pattern) return { title: "Pattern not found" };

  return {
    title: pattern.name,
    description: pattern.tagline,
    alternates: { canonical: `/patterns/${pattern.slug}` },
  };
}

export default async function PatternPage({
  params,
}: PageProps<"/patterns/[pattern]">) {
  const { pattern: slug } = await params;
  const user = await getCurrentUser();
  const pattern = await getPattern(slug, user?.id);

  if (!pattern) notFound();

  const [bookmarked, note] = user
    ? await Promise.all([
        isBookmarked({
          userId: user.id,
          entityType: "PATTERN",
          entityId: pattern.id,
        }),
        getNoteFor({
          userId: user.id,
          entityType: "PATTERN",
          entityId: pattern.id,
        }),
      ])
    : [false, null];

  const templateLanguages = Object.keys(pattern.templateCode);

  const chip =
    "bg-muted/50 border-border text-muted-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patterns">Patterns</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pattern.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="border-border bg-card flex flex-col overflow-hidden rounded-xl border md:flex-row">
        <MiniDiagram
          kind={diagramFor(pattern.slug)}
          className="border-border h-28 shrink-0 border-b md:h-auto md:w-56 md:border-r md:border-b-0"
        />
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="tracking-headline min-w-0 flex-1 text-2xl font-bold sm:text-3xl">
              {pattern.name}
            </h1>
            <BookmarkButton
              entityType="PATTERN"
              entityId={pattern.id}
              initiallyBookmarked={bookmarked}
              signedIn={Boolean(user)}
              variant="outline"
            />
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed text-pretty">
            {pattern.tagline}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={pattern.difficulty} className="mr-1" />
            {pattern.problems.length > 0 && (
              <span className={chip}>
                <ListChecks className="size-3.5" aria-hidden="true" />
                {pattern.problems.length} problem{pattern.problems.length === 1 ? "" : "s"}
              </span>
            )}
            {pattern.chapters.length > 0 && (
              <span className={chip}>
                <BookOpen className="size-3.5" aria-hidden="true" />
                {pattern.chapters.length} chapter{pattern.chapters.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0">
          {/* The most important section on the page, so it comes first. */}
          <section
            aria-labelledby="recognition"
            className="border-ember-500/30 bg-ember-500/6 rounded-xl border p-5 sm:p-6"
          >
            <h2
              id="recognition"
              className="text-ember-400 text-[0.68rem] font-medium tracking-wider uppercase"
            >
              How do I recognise this pattern?
            </h2>

            <ul className="mt-3 space-y-2.5">
              {pattern.recognitionClues.map((clue) => (
                <li key={clue} className="flex gap-3 text-[0.95rem]">
                  <Check className="text-ember-400 mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground leading-relaxed">{clue}</span>
                </li>
              ))}
            </ul>

            {pattern.antiPatterns.length > 0 && (
              <>
                <h3 className="text-muted-foreground border-ember-500/15 mt-5 border-t pt-4 text-[0.68rem] font-medium tracking-wider uppercase">
                  When it is the wrong tool
                </h3>
                <ul className="mt-2.5 space-y-2">
                  {pattern.antiPatterns.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <X
                        className="text-destructive/80 mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="what" className="mt-10">
            <h2 id="what" className="tracking-headline text-lg font-semibold">
              What is it?
            </h2>
            <p className="reading text-foreground/85 mt-2">{pattern.description}</p>
          </section>

          <section aria-labelledby="core" className="mt-10">
            <h2 id="core" className="tracking-headline text-lg font-semibold">
              The core idea
            </h2>
            <div className="border-border bg-card border-l-ember-500 mt-3 rounded-xl border border-l-[3px] p-4 sm:p-5">
              <p className="text-foreground text-[0.95rem] leading-relaxed">{pattern.coreIdea}</p>
            </div>
          </section>

          {templateLanguages.length > 0 && (
            <section aria-labelledby="template" className="mt-10">
              <h2 id="template" className="tracking-headline text-lg font-semibold">
                Template
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                The shape, not a solution. Adapt the condition and the state to the
                problem in front of you.
              </p>
              {templateLanguages.map((language) => (
                <CodeBlock
                  key={language}
                  code={pattern.templateCode[language]!}
                  language={LANGUAGE_LABEL[language as keyof typeof LANGUAGE_LABEL] ?? language}
                />
              ))}
            </section>
          )}

          {pattern.commonMistakes.length > 0 && (
            <section aria-labelledby="mistakes" className="mt-10">
              <h2 id="mistakes" className="tracking-headline text-lg font-semibold">
                Common mistakes
              </h2>
              <ul className="border-border bg-card divide-border mt-3 divide-y rounded-xl border">
                {pattern.commonMistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-3 px-4 py-3 text-sm">
                    <AlertTriangle
                      className="text-warning mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pattern.problems.length > 0 && (
            <PatternProblemsTable
              title={`Problems using ${pattern.name}`}
              problems={pattern.problems}
              signedIn={Boolean(user)}
            />
          )}

          <div className="mt-10">
            <NoteEditor
              entityType="PATTERN"
              entityId={pattern.id}
              initialBody={note?.body ?? ""}
              signedIn={Boolean(user)}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:h-fit">
          {(pattern.timeComplexity || pattern.spaceComplexity) && (
            <section
              aria-labelledby="complexity"
              className="border-border bg-card rounded-xl border p-4"
            >
              <h2 id="complexity" className="text-sm font-semibold">
                Complexity
              </h2>
              <dl className="mt-3 space-y-2">
                <div className="bg-muted/40 rounded-lg p-3">
                  <dt className="text-muted-foreground text-xs">Time</dt>
                  <dd className="text-ember-300 mt-1 font-mono text-[0.8rem] leading-snug break-words">
                    {pattern.timeComplexity ?? "—"}
                  </dd>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <dt className="text-muted-foreground text-xs">Space</dt>
                  <dd className="text-ember-300 mt-1 font-mono text-[0.8rem] leading-snug break-words">
                    {pattern.spaceComplexity ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {pattern.chapters.length > 0 && (
            <section
              aria-labelledby="chapters"
              className="border-border bg-card rounded-xl border p-4"
            >
              <h2 id="chapters" className="text-sm font-semibold">
                Where this is taught
              </h2>
              <ul className="mt-2 -mx-2 space-y-0.5">
                {pattern.chapters.map((chapter) => (
                  <li key={chapter.slug}>
                    <Link
                      href={route(
                        chapterHref(
                          chapter.track,
                          chapter.courseSlug,
                          chapter.sectionSlug,
                          chapter.slug
                        )
                      )}
                      className="text-muted-foreground hover:bg-accent/40 hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors"
                    >
                      <BookOpen className="text-ember-400/80 size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{chapter.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** The pattern's linked problems, laid out like the problems catalogue. */
function PatternProblemsTable({
  title,
  problems,
  signedIn,
}: {
  title: string;
  problems: PatternDetail["problems"];
  signedIn: boolean;
}) {
  const solved = problems.filter((p) => p.status === "SOLVED").length;
  const percent = problems.length ? Math.round((solved / problems.length) * 100) : 0;

  return (
    <section
      aria-labelledby="pattern-problems"
      className="border-border bg-card mt-10 overflow-hidden rounded-xl border"
    >
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <h2
          id="pattern-problems"
          className="tracking-headline min-w-0 flex-1 truncate text-base font-semibold sm:text-lg"
        >
          {title}
        </h2>
        {signedIn && (
          <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36">
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {solved}/{problems.length}
            </span>
            <div
              className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${title} progress`}
            >
              <div className="bg-ember-500 h-full rounded-full" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="border-border overflow-x-auto border-t">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="text-muted-foreground border-border border-b text-left text-xs">
              <th scope="col" className="w-14 px-4 py-2.5 font-medium sm:px-5">
                Status
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Problem
              </th>
              <th scope="col" className="w-24 px-2 py-2.5 font-medium">
                Difficulty
              </th>
              <th scope="col" className="w-24 px-4 py-2.5 font-medium sm:px-5">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {problems.map((problem) => (
              <tr key={problem.slug} className="hover:bg-accent/25 transition-colors">
                <td className="px-4 py-3 sm:px-5">
                  {problem.status === "SOLVED" ? (
                    <CheckCircle2 className="text-success size-[1.1rem]" aria-label="Solved" />
                  ) : problem.status === "ATTEMPTED" ? (
                    <CircleDashed className="text-warning size-[1.1rem]" aria-label="Attempted" />
                  ) : (
                    <Circle className="text-muted-foreground/35 size-[1.1rem]" aria-label="Not started" />
                  )}
                </td>
                <td className="px-2 py-3">
                  <Link
                    href={route(`/problems/${problem.slug}`)}
                    className={cn(
                      "hover:text-ember-300 font-medium transition-colors",
                      problem.status === "SOLVED" ? "text-muted-foreground" : "text-info"
                    )}
                  >
                    {problem.title}
                  </Link>
                  <span className="text-muted-foreground/60 ml-2 font-mono text-[0.68rem] tabular-nums">
                    #{problem.number}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>
                <td className="text-muted-foreground px-4 py-3 text-xs sm:px-5">
                  {problem.isPrimary ? (
                    <span className="text-ember-300">Primary</span>
                  ) : (
                    "Related"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
