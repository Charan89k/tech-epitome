import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  FileText,
  PenTool,
  Scale,
  Target,
  TrendingUp,
} from "lucide-react";

import { ArchitectureDiagram } from "@/components/diagram/architecture-diagram";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { DesignWorkspace } from "@/components/system-design/design-workspace";
import { Pane } from "@/components/system-design/pane";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
import { Button } from "@/components/ui/button";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { DESIGN_QUICK_ACTIONS } from "@/lib/tutor/types";
import { getSystemDesignProblem } from "@/services/system-design";

export async function generateMetadata({
  params,
}: PageProps<"/system-design/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getSystemDesignProblem(slug);
  if (!problem) return { title: "Exercise not found" };

  return {
    title: problem.title,
    description: problem.tagline,
    alternates: { canonical: `/system-design/${problem.slug}` },
  };
}

export default async function SystemDesignExercisePage({
  params,
}: PageProps<"/system-design/[slug]">) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const problem = await getSystemDesignProblem(slug, user?.id);

  if (!problem) notFound();

  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);
  const scaleRows = Object.entries(problem.scaleEstimate);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/system-design"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        All design exercises
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
              System design
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
            anchor={{ kind: "SYSTEM_DESIGN", problemSlug: problem.slug }}
            label={{
              contextType: "SYSTEM_DESIGN",
              primary: "System Design",
              secondary: problem.title,
              chips: [
                problem.difficulty.charAt(0) +
                  problem.difficulty.slice(1).toLowerCase(),
              ],
            }}
            quickActions={DESIGN_QUICK_ACTIONS}
            enabled={tutorAllowed}
          />
        </div>
      </header>

      {/* Two panes on desktop, stacked on a phone. The brief stays in view
          (sticky, scrolling on its own) next to the workspace, and neither
          may overflow. */}
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Pane
          label="Brief"
          icon={FileText}
          className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.5rem)]"
          bodyClassName="space-y-6 overflow-y-auto px-4 py-5 sm:px-5"
        >
          <section aria-labelledby="functional">
            <h2 id="functional" className="text-sm font-semibold">
              Functional requirements
            </h2>
            <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
              {problem.functionalRequirements.map((item) => (
                <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="nonfunctional">
            <h2 id="nonfunctional" className="text-sm font-semibold">
              Non-functional requirements
            </h2>
            <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
              {problem.nonFunctionalRequirements.map((item) => (
                <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {scaleRows.length > 0 && (
            <section aria-labelledby="scale">
              <h2 id="scale" className="flex items-center gap-1.5 text-sm font-semibold">
                <TrendingUp className="text-ember-400 size-3.5" aria-hidden="true" />
                Scale assumptions
              </h2>
              <p className="text-muted-foreground/70 mt-1 text-xs">
                Worked estimates for this brief, not measurements of any real
                system. Disagree with them out loud — that is the exercise.
              </p>
              <dl className="border-border bg-muted/20 mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border text-sm">
                {scaleRows.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2 px-3 py-2">
                    <dt className="text-muted-foreground text-xs">{key}</dt>
                    <dd className="min-w-0 font-mono text-xs break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {problem.apiDesign.length > 0 && (
            <section aria-labelledby="api">
              <h2 id="api" className="text-sm font-semibold">
                Suggested API surface
              </h2>
              <ul className="border-border bg-muted/20 mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
                {problem.apiDesign.map((entry) => (
                  <li key={`${entry.method}-${entry.path}`} className="px-3 py-2">
                    <p className="font-mono text-xs break-words">
                      <span className="bg-ember-500/12 text-ember-300 mr-1.5 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold">
                        {entry.method}
                      </span>
                      {entry.path}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {entry.purpose}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="discuss">
            <h2 id="discuss" className="flex items-center gap-1.5 text-sm font-semibold">
              <Target className="text-ember-400 size-3.5" aria-hidden="true" />
              Decisions you should be able to defend
            </h2>
            <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
              {problem.discussionAreas.map((item) => (
                <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </Pane>

        {/* Workspace */}
        <Pane
          as="h2"
          label="Your design"
          icon={PenTool}
          actions={
            <span className="text-muted-foreground hidden truncate text-[0.68rem] sm:inline">
              Add components, connect them, and note why each one is there.
            </span>
          }
          bodyClassName="p-4"
        >
          {user ? (
            <DesignWorkspace
              slug={problem.slug}
              initialDiagram={
                problem.submission?.diagram ?? { nodes: [], edges: [] }
              }
              initialNotes={problem.submission?.notes ?? ""}
              alreadySubmitted={Boolean(problem.submission?.submittedAt)}
            />
          ) : (
            <div className="viz-canvas border-border flex flex-col items-center rounded-lg border px-6 py-12 text-center">
              <PenTool className="text-ember-400 size-5" aria-hidden="true" />
              <p className="text-muted-foreground mt-3 text-sm">
                Sign in to draw and save a design.
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
            One reference architecture
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            One defensible answer, not the answer. Where yours differs, the
            interesting question is what each version optimises for.
          </p>

          <ArchitectureDiagram
            diagram={problem.reference.architecture}
            caption="A reference architecture for this brief"
          />

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

          {problem.reference.scalingNotes.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">How it scales</h3>
              <ol className="border-border mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
                {problem.reference.scalingNotes.map((note, index) => (
                  <li key={note.stage} className="flex gap-3 p-3 text-sm">
                    <span className="text-ember-400/70 font-mono text-xs tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{note.stage}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {note.problem} → {note.response}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {problem.followUps.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Follow-up questions</h3>
              <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1 pl-5">
                {problem.followUps.map((q) => (
                  <li key={q} className="text-muted-foreground text-sm leading-relaxed">
                    {q}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
