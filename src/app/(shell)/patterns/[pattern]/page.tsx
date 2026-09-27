import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BookOpen, Check, X } from "lucide-react";

import { CodeBlock } from "@/components/learning/code-block";
import { ProblemListBlock } from "@/components/learning/problem-list-block";
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
import { route } from "@/lib/utils";
import { getPattern } from "@/services/patterns";

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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-4">
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

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {pattern.name}
          </h1>
          <DifficultyBadge difficulty={pattern.difficulty} />
          <div className="ml-auto">
            <BookmarkButton
              entityType="PATTERN"
              entityId={pattern.id}
              initiallyBookmarked={bookmarked}
              signedIn={Boolean(user)}
              variant="outline"
            />
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-base leading-relaxed text-pretty">
          {pattern.tagline}
        </p>
      </header>

      {/* The most important section on the page, so it comes first. */}
      <section
        aria-labelledby="recognition"
        className="border-ember-500/30 bg-ember-500/6 mt-7 rounded-lg border p-5"
      >
        <h2
          id="recognition"
          className="text-ember-400 font-mono text-[0.7rem] tracking-wider uppercase"
        >
          How do I recognise this pattern?
        </h2>

        <ul className="mt-3 space-y-2">
          {pattern.recognitionClues.map((clue) => (
            <li key={clue} className="flex gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-foreground leading-relaxed">{clue}</span>
            </li>
          ))}
        </ul>

        {pattern.antiPatterns.length > 0 && (
          <>
            <h3 className="text-muted-foreground mt-5 text-xs font-medium tracking-wider uppercase">
              When it is the wrong tool
            </h3>
            <ul className="mt-2 space-y-2">
              {pattern.antiPatterns.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm">
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

      <section aria-labelledby="what" className="mt-8">
        <h2 id="what" className="text-lg font-semibold tracking-tight">
          What is it?
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          {pattern.description}
        </p>
      </section>

      <section aria-labelledby="core" className="mt-8">
        <h2 id="core" className="text-lg font-semibold tracking-tight">
          The core idea
        </h2>
        <div className="border-border bg-card surface-edge mt-2 rounded-lg border p-4">
          <p className="text-foreground text-sm leading-relaxed">{pattern.coreIdea}</p>
        </div>
      </section>

      {templateLanguages.length > 0 && (
        <section aria-labelledby="template" className="mt-8">
          <h2 id="template" className="text-lg font-semibold tracking-tight">
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

      {(pattern.timeComplexity || pattern.spaceComplexity) && (
        <section aria-labelledby="complexity" className="mt-8">
          <h2 id="complexity" className="text-lg font-semibold tracking-tight">
            Complexity
          </h2>
          <dl className="border-border bg-card mt-2 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
            <div className="p-4">
              <dt className="text-muted-foreground text-xs">Time</dt>
              <dd className="text-ember-300 mt-1 font-mono text-sm">
                {pattern.timeComplexity ?? "—"}
              </dd>
            </div>
            <div className="border-border p-4 sm:border-l">
              <dt className="text-muted-foreground text-xs">Space</dt>
              <dd className="text-ember-300 mt-1 font-mono text-sm">
                {pattern.spaceComplexity ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {pattern.commonMistakes.length > 0 && (
        <section aria-labelledby="mistakes" className="mt-8">
          <h2 id="mistakes" className="text-lg font-semibold tracking-tight">
            Common mistakes
          </h2>
          <ul className="mt-3 space-y-2">
            {pattern.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2.5 text-sm">
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

      {pattern.chapters.length > 0 && (
        <section aria-labelledby="chapters" className="mt-8">
          <h2 id="chapters" className="text-lg font-semibold tracking-tight">
            Where this is taught
          </h2>
          <ul className="border-border mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
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
                  className="hover:bg-accent/40 flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                >
                  <BookOpen
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{chapter.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pattern.problems.length > 0 && (
        <ProblemListBlock
          problems={pattern.problems}
          title={`Problems using ${pattern.name}`}
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
  );
}
