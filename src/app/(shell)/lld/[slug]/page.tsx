import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Scale, Sparkles, Target } from "lucide-react";

import { ClassDiagramView } from "@/components/class-diagram/class-diagram-view";
import { CodeBlock } from "@/components/learning/code-block";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { LLDWorkspace } from "@/components/lld/lld-workspace";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { canAccess, FEATURES, lockStateFor } from "@/lib/auth/access";
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
  const referenceCode = problem.reference?.code ?? {};
  const referenceLanguages = Object.keys(referenceCode);

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
            access={!user ? "signin" : tutorAllowed ? "allowed" : "upgrade"}
          />
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        {/* Brief */}
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="requirements">
            <h2 id="requirements" className="text-sm font-semibold">
              Requirements
            </h2>
            <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
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
              <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
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
              <dl className="border-border mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
                {problem.entities.map((entity) => (
                  <div key={entity.name} className="px-3 py-2">
                    <dt className="text-sm font-medium">{entity.name}</dt>
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
                <Target className="size-3.5" aria-hidden="true" />
                What this exercise is teaching
              </h2>
              <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
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
              <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
                {problem.extensions.map((item) => (
                  <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Workspace */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Your design</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Add types, give them responsibilities, and connect them.
          </p>

          <div className="mt-3">
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
              <div className="border-border rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Sign in to design and save.
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
              <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Patterns this reference uses: {problem.designPatterns.join(", ")}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
