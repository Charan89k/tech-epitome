import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Target } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { Highlightable } from "@/components/learning/highlightable";
import { NoteEditor } from "@/components/library/note-editor";
import { ContentRenderer, type ContentResources } from "@/components/learning/content-renderer";
import { HintLadder } from "@/components/problems/hint-ladder";
import { ProblemWorkspace } from "@/components/problems/problem-workspace";
import {
  SolutionPanel,
  type SolutionView,
} from "@/components/problems/solution-panel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { labelFor } from "@/lib/tutor/context";
import {
  CODE_QUICK_ACTIONS,
  PROBLEM_QUICK_ACTIONS,
} from "@/lib/tutor/types";
import { loadContextBundle } from "@/services/tutor";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseContent } from "@/lib/validation/content";
import { route } from "@/lib/utils";
import { listHighlightsFor } from "@/services/highlights";
import { getNoteFor, isBookmarked } from "@/services/library";
import { getProblem } from "@/services/problems";
import type { ContentBlock } from "@/types/content";

export async function generateMetadata({
  params,
}: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) return { title: "Problem not found" };

  return {
    title: `${problem.title}`,
    description: problem.learningObjective ?? undefined,
    alternates: { canonical: `/problems/${problem.slug}` },
  };
}

export default async function ProblemPage({
  params,
}: PageProps<"/problems/[slug]">) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const problem = await getProblem(slug, user?.id);

  if (!problem) notFound();

  const statement: ContentBlock[] = parseContent(
    problem.statement,
    `problem:${problem.slug}`
  );

  // Every learner gets the optimal solution — a problem you cannot learn
  // from is worthless. What Pro adds is the full worst-to-best walkthrough:
  // the brute force and the observation that improves on it, which is the
  // part that teaches the reasoning rather than the answer.
  //
  // The gate is applied to the query result, before it is serialised, so the
  // withheld approaches never reach the client at all.
  const canSeeAllApproaches = canAccess(user, FEATURES.SOLUTIONS);
  const solutionRows = await prisma.solution.findMany({
    where: { problem: { slug } },
    orderBy: { order: "asc" },
    select: {
      title: true,
      intuition: true,
      approach: true,
      code: true,
      timeComplexity: true,
      spaceComplexity: true,
      edgeCases: true,
      commonMistakes: true,
    },
  });

  // Solutions are authored worst-to-best, so the last one is the optimal.
  const visibleRows = canSeeAllApproaches ? solutionRows : solutionRows.slice(-1);

  const solutions: SolutionView[] = visibleRows.map((row) => ({
    title: row.title,
    intuition: row.intuition,
    approach: (row.approach as string[]) ?? [],
    code: (row.code as Record<string, string>) ?? {},
    timeComplexity: row.timeComplexity,
    spaceComplexity: row.spaceComplexity,
    edgeCases: row.edgeCases,
    commonMistakes: row.commonMistakes,
  }));

  const withheldApproaches = solutionRows.length - visibleRows.length;

  const emptyResources: ContentResources = {
    quizzes: new Map(),
    problems: new Map(),
    patternNames: new Map(),
    signedIn: Boolean(user),
  };

  const bookmarked = user
    ? await isBookmarked({
        userId: user.id,
        entityType: "PROBLEM",
        entityId: problem.id,
      })
    : false;
  const note = user
    ? await getNoteFor({
        userId: user.id,
        entityType: "PROBLEM",
        entityId: problem.id,
      })
    : null;
  const highlights = user
    ? await listHighlightsFor({
        userId: user.id,
        entityType: "PROBLEM",
        entityId: problem.id,
      })
    : [];

  const description = (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm tabular-nums">
            #{problem.number}
          </span>
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.progress.status === "SOLVED" && (
            <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Solved
            </Badge>
          )}
          <div className="ml-auto">
            <BookmarkButton
              entityType="PROBLEM"
              entityId={problem.id}
              initiallyBookmarked={bookmarked}
              signedIn={Boolean(user)}
            />
          </div>
        </div>

        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {problem.title}
        </h1>

        {problem.patterns.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problem.patterns.map((pattern) => (
              <Link
                key={pattern.slug}
                href={route(`/patterns/${pattern.slug}`)}
                className="border-border text-muted-foreground hover:border-ember-500/40 hover:text-ember-300 rounded-md border px-2 py-0.5 text-xs transition-colors"
              >
                {pattern.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <Highlightable
        entityType="PROBLEM"
        entityId={problem.id}
        initialHighlights={highlights}
        signedIn={Boolean(user)}
      >
        <div className="space-y-4">
          <ContentRenderer blocks={statement} resources={emptyResources} />
        </div>
      </Highlightable>

      <div className="space-y-4">

        <NoteEditor
          entityType="PROBLEM"
          entityId={problem.id}
          initialBody={note?.body ?? ""}
          signedIn={Boolean(user)}
        />
      </div>

      {problem.constraints.length > 0 && (
        <section aria-labelledby="constraints">
          <h2 id="constraints" className="text-sm font-semibold">
            Constraints
          </h2>
          <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
            {problem.constraints.map((constraint) => (
              <li
                key={constraint}
                className="text-muted-foreground font-mono text-xs leading-relaxed"
              >
                {constraint}
              </li>
            ))}
          </ul>
        </section>
      )}

      {problem.sampleTests.length > 0 && (
        <section aria-labelledby="examples">
          <h2 id="examples" className="text-sm font-semibold">
            Examples
          </h2>
          <div className="mt-2 space-y-2">
            {problem.sampleTests.map((test, index) => (
              <div
                key={test.id}
                className="border-border bg-card rounded-lg border p-3"
              >
                <p className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
                  Example {index + 1}
                </p>
                <dl className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <dt className="text-muted-foreground text-xs">Input</dt>
                    <dd className="font-mono text-xs whitespace-pre-wrap">
                      {test.input || "(empty)"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <dt className="text-muted-foreground text-xs">Output</dt>
                    <dd className="text-success font-mono text-xs whitespace-pre-wrap">
                      {test.expected || "(empty)"}
                    </dd>
                  </div>
                </dl>
                {test.explanation && (
                  <p className="text-muted-foreground border-border mt-2 border-t pt-2 text-xs leading-relaxed">
                    {test.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      <HintLadder
        slug={problem.slug}
        totalHints={problem.hintCount}
        initiallyRevealed={problem.progress.hintsRevealed}
        signedIn={Boolean(user)}
      />

      <Separator />

      <SolutionPanel
        slug={problem.slug}
        solutions={solutions}
        alreadyViewed={problem.progress.solutionViewed}
        signedIn={Boolean(user)}
        withheldApproaches={withheldApproaches}
      />

      {(problem.expectedTime || problem.expectedSpace) && (
        <section aria-labelledby="target" className="border-border rounded-lg border p-3">
          <h2
            id="target"
            className="text-muted-foreground flex items-center gap-1.5 text-[0.68rem] font-medium tracking-wider uppercase"
          >
            <Target className="size-3" aria-hidden="true" />
            Target complexity
          </h2>
          <p className="text-ember-300 mt-1.5 font-mono text-xs">
            {problem.expectedTime ?? "—"} time · {problem.expectedSpace ?? "—"} space
          </p>
        </section>
      )}

      {problem.learningObjective && problem.progress.status === "SOLVED" && (
        <section className="border-success/25 bg-success/5 rounded-lg border p-3">
          <h2 className="text-success text-[0.68rem] font-medium tracking-wider uppercase">
            What this problem was teaching
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {problem.learningObjective}
          </p>
        </section>
      )}
    </div>
  );

  // The context header must describe what the model will actually be sent,
  // so it is derived from the same bundle the tutor uses rather than being
  // reassembled from the page's own props. A header that drifts from the
  // prompt is worse than no header: it is a confident lie about what the
  // tutor knows.
  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);
  const bundle = user && tutorAllowed
    ? await loadContextBundle({ kind: "PROBLEM", problemSlug: problem.slug }, user.id)
    : null;

  const tutorLabel = bundle
    ? labelFor(bundle)
    : {
        contextType: "PROBLEM" as const,
        primary: problem.patterns[0]?.name ?? null,
        secondary: problem.title,
        chips: [
          problem.difficulty.charAt(0) +
            problem.difficulty.slice(1).toLowerCase(),
        ],
      };

  return (
    <ProblemWorkspace
      slug={problem.slug}
      starterCode={problem.starterCode}
      defaultLanguage="PYTHON"
      signedIn={Boolean(user)}
      description={description}
      tutor={{
        label: tutorLabel,
        quickActions: [...PROBLEM_QUICK_ACTIONS, ...CODE_QUICK_ACTIONS],
        enabled: tutorAllowed,
      }}
    />
  );
}
