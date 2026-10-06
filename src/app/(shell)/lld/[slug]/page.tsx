import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  FileText,
  PenTool,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";

import { ClassDiagramView } from "@/components/class-diagram/class-diagram-view";
import { CodeBlock } from "@/components/learning/code-block";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { LLDWorkspace } from "@/components/lld/lld-workspace";
import { Pane } from "@/components/system-design/pane";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
import { Button } from "@/components/ui/button";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { LLD_QUICK_ACTIONS } from "@/lib/tutor/types";
import { getLLDProblem } from "@/services/lld";

export async function generateMetadata({
  params,
}: PageProps<"/lld/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getLLDProblem(slug);
  if (!problem) return { title: "Exercise not found" };

  return {
    title: problem.title,
    description: problem.tagline,
    alternates: { canonical: `/lld/${problem.slug}` },
  };
}

export default async function LLDExercisePage({
  params,
}: PageProps<"/lld/[slug]">) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const problem = await getLLDProblem(slug, user?.id);

  if (!problem) notFound();

  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);
  const referenceCode = problem.reference?.code ?? {};
  const referenceLanguages = Object.keys(referenceCode);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/lld"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        All low-level design exercises
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
              Low-level design
            </span>
            <span className="text-muted-foreground/40" aria-hidden="true">
              ·
            </span>
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.submission?.submittedAt && (
              <span className="text-success inline-flex items-center gap-1">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Submitted
              </span>
            )}
          </div>
          <h1 className="tracking-headline mt-1.5 text-2xl font-bold sm:text-3xl">
            {problem.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{problem.tagline}</p>
        </div>

        <div className="shrink-0">
          <TutorLauncher
            anchor={{ kind: "LLD", problemSlug: problem.slug }}
            label={{
              contextType: "LLD",
              primary: "Low-Level Design",
              secondary: problem.title,
              chips: [
                problem.difficulty.charAt(0) +
                  problem.difficulty.slice(1).toLowerCase(),
              ],
            }}
            quickActions={LLD_QUICK_ACTIONS}
            enabled={tutorAllowed}
          />
        </div>
      </header>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.4fr)]">
        {/* Brief */}
        <Pane
          label="Brief"
          icon={FileText}
          className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.5rem)]"
          bodyClassName="space-y-6 overflow-y-auto px-4 py-5 sm:px-5"
        >
          <section aria-labelledby="requirements">
            <h2 id="requirements" className="text-sm font-semibold">
              Requirements
            </h2>
            <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
              {problem.requirements.map((item) => (
                <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {problem.constraints.length > 0 && (
            <section aria-labelledby="constraints">
              <h2 id="constraints" className="text-sm font-semibold">
                Assumptions you may make
              </h2>
              <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
                {problem.constraints.map((item) => (
                  <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {problem.entities.length > 0 && (
            <section aria-labelledby="entities">
              <h2 id="entities" className="text-sm font-semibold">
                Things the brief expects to exist
              </h2>
              <p className="text-muted-foreground/70 mt-1 text-xs">
                Candidates, not a design. How they relate is yours to decide.
              </p>
              <dl className="border-border bg-muted/20 mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
                {problem.entities.map((entity) => (
                  <div key={entity.name} className="px-3 py-2">
                    <dt className="font-mono text-xs font-medium">{entity.name}</dt>
                    <dd className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {entity.responsibility}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {problem.objectives.length > 0 && (
            <section aria-labelledby="objectives">
              <h2
                id="objectives"
                className="flex items-center gap-1.5 text-sm font-semibold"
              >
                <Target className="text-ember-400 size-3.5" aria-hidden="true" />
                What this exercise is teaching
              </h2>
              <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
                {problem.objectives.map((item) => (
                  <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {problem.extensions.length > 0 && (
            <section aria-labelledby="extensions">
              <h2 id="extensions" className="text-sm font-semibold">
                Once it works, make it survive these
              </h2>
              <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
                {problem.extensions.map((item) => (
                  <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Pane>

        {/* Workspace */}
        <Pane
          as="h2"
          label="Your design"
          icon={PenTool}
          actions={
            <span className="text-muted-foreground hidden truncate text-[0.68rem] sm:inline">
              Add types, give them responsibilities, and connect them.
            </span>
          }
          bodyClassName="p-4"
        >
          {user ? (
            <LLDWorkspace
              slug={problem.slug}
              initialDiagram={
                problem.submission?.classDiagram ?? { types: [], relationships: [] }
              }
              initialCode={problem.submission?.code ?? ""}
              initialLanguage={problem.submission?.language ?? "JAVA"}
              initialRationale={problem.submission?.rationale ?? ""}
              alreadySubmitted={Boolean(problem.submission?.submittedAt)}
              totalHints={problem.totalHints}
              initialHints={problem.revealedHints}
            />
          ) : (
            <div className="viz-canvas border-border flex flex-col items-center rounded-lg border px-6 py-12 text-center">
              <PenTool className="text-ember-400 size-5" aria-hidden="true" />
              <p className="text-muted-foreground mt-3 text-sm">
                Sign in to design and save.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </Pane>
      </div>

      {/* Reference — withheld by the service until submission. */}
      {problem.reference && (
        <section
          aria-labelledby="reference"
          className="bg-card border-border mt-8 min-w-0 rounded-xl border p-4 sm:p-6"
        >
          <p className="text-ember-300 text-[0.68rem] font-medium tracking-wider uppercase">
            Unlocked by your submission
          </p>
          <h2 id="reference" className="tracking-headline mt-1 text-lg font-semibold">
            One reference design
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            One defensible answer, not the answer. Where yours differs, the
            interesting question is what each version optimises for.
          </p>

          <ClassDiagramView
            diagram={problem.reference.classDiagram}
            caption="A reference class design for this brief"
          />

          {problem.reference.tradeoffs.length > 0 && (
            <>
              <h3 className="mt-6 flex items-center gap-1.5 text-sm font-semibold">
                <Scale className="text-ember-400 size-3.5" aria-hidden="true" />
                Trade-offs behind it
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {problem.reference.tradeoffs.map((t) => (
                  <div key={t.decision} className="border-border bg-background/40 rounded-lg border p-3.5">
                    <p className="text-sm font-medium">{t.decision}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Chose <span className="text-ember-300">{t.chose}</span> over{" "}
                      {t.over}.
                    </p>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {t.because}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {referenceLanguages.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Reference implementation</h3>
              {referenceLanguages.map((lang) => (
                <CodeBlock
                  key={lang}
                  language={lang.toLowerCase()}
                  code={referenceCode[lang]!}
                />
              ))}
            </>
          )}

          {problem.designPatterns.length > 0 && (
            <p className="text-muted-foreground mt-4 flex flex-wrap items-center gap-1.5 text-xs">
              <Sparkles className="text-ember-400 size-3.5" aria-hidden="true" />
              Patterns this reference uses:
              {problem.designPatterns.map((pattern) => (
                <span key={pattern} className="bg-muted/50 rounded-full px-2 py-0.5 text-[0.65rem]">
                  {pattern}
                </span>
              ))}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
