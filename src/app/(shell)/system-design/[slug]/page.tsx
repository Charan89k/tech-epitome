import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Scale, Target, TrendingUp } from "lucide-react";

import { ArchitectureDiagram } from "@/components/diagram/architecture-diagram";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { DesignWorkspace } from "@/components/system-design/design-workspace";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { canAccess, FEATURES, lockStateFor } from "@/lib/auth/access";
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

  const lock = lockStateFor(user, problem.access);
  if (lock.locked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Lock className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold">This exercise is part of Pro</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {lock.reason === "signin"
            ? "Sign in to check whether your plan includes it."
            : "Upgrade to unlock the full set of design exercises."}
        </p>
        <Button asChild className="mt-6">
          <Link href={lock.reason === "signin" ? "/login" : "/pricing"}>
            {lock.reason === "signin" ? "Sign in" : "See plans"}
          </Link>
        </Button>
      </div>
    );
  }

  const tutorAllowed = canAccess(user, FEATURES.AI_TUTOR);
  const scaleRows = Object.entries(problem.scaleEstimate);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.submission?.submittedAt && (
            <span className="text-success text-xs">Submitted</span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {problem.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{problem.tagline}</p>

        <div className="mt-3">
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
            access={!user ? "signin" : tutorAllowed ? "allowed" : "upgrade"}
          />
        </div>
      </header>

      {/* Two columns on desktop, stacked on a phone. The brief has to stay
          readable next to the workspace, and neither may overflow. */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="functional">
            <h2 id="functional" className="text-sm font-semibold">
              Functional requirements
            </h2>
            <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
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
            <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
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
                <TrendingUp className="size-3.5" aria-hidden="true" />
                Scale assumptions
              </h2>
              <p className="text-muted-foreground/70 mt-1 text-xs">
                Worked estimates for this brief, not measurements of any real
                system. Disagree with them out loud — that is the exercise.
              </p>
              <dl className="border-border mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border text-sm">
                {scaleRows.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[9rem_1fr] gap-2 px-3 py-2">
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
              <ul className="border-border mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
                {problem.apiDesign.map((entry) => (
                  <li key={`${entry.method}-${entry.path}`} className="px-3 py-2">
                    <p className="font-mono text-xs break-words">
                      <span className="text-ember-300">{entry.method}</span>{" "}
                      {entry.path}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {entry.purpose}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="discuss">
            <h2 id="discuss" className="flex items-center gap-1.5 text-sm font-semibold">
              <Target className="size-3.5" aria-hidden="true" />
              Decisions you should be able to defend
            </h2>
            <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
              {problem.discussionAreas.map((item) => (
                <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Workspace */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Your design</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Add components, connect them, and note why each one is there.
          </p>

          <div className="mt-3">
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
              <div className="border-border rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Sign in to draw and save a design.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reference — withheld by the service until submission. */}
      {problem.reference && (
        <>
          <Separator className="my-8" />
          <section aria-labelledby="reference" className="min-w-0">
            <h2 id="reference" className="text-lg font-semibold tracking-tight">
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
              <Scale className="size-3.5" aria-hidden="true" />
              Trade-offs behind it
            </h3>
            <div className="mt-2 space-y-3">
              {problem.reference.tradeoffs.map((t) => (
                <div key={t.decision} className="border-border rounded-lg border p-3">
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
                <ol className="mt-2 space-y-2">
                  {problem.reference.scalingNotes.map((note) => (
                    <li
                      key={note.stage}
                      className="border-border rounded-lg border p-3 text-sm"
                    >
                      <p className="font-medium">{note.stage}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {note.problem} → {note.response}
                      </p>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {problem.followUps.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">Follow-up questions</h3>
                <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
                  {problem.followUps.map((q) => (
                    <li key={q} className="text-muted-foreground text-sm leading-relaxed">
                      {q}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
