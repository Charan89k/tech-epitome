import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Info,
  ListChecks,
  Route as RouteIcon,
  Target,
} from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { DesignThumb } from "@/components/system-design/design-thumb";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { cn, route } from "@/lib/utils";
import { getPrepTrack, listPrepTrackSlugs, type Provenance } from "@/services/prep";

export async function generateStaticParams() {
  return (await listPrepTrackSlugs()).map((track) => ({ track }));
}

export async function generateMetadata({
  params,
}: PageProps<"/prepare/[track]">): Promise<Metadata> {
  const { track: slug } = await params;
  const track = await getPrepTrack(slug);
  if (!track) return { title: "Track not found" };

  return {
    title: track.name,
    description: track.blurb,
    alternates: { canonical: `/prepare/${track.slug}` },
  };
}

/**
 * Provenance, printed next to the claim rather than hidden in a tooltip.
 *
 * The whole reason this feature is defensible is that it never asserts
 * anything without saying who decided it and how sure they are. Putting
 * that in a hover would defeat the point on a touchscreen.
 */
function Attribution({ provenance }: { provenance: Provenance }) {
  const confidence =
    provenance.confidence >= 70
      ? "high confidence"
      : provenance.confidence >= 50
        ? "moderate confidence"
        : "low confidence";

  return (
    <p className="text-muted-foreground/70 mt-1.5 text-[0.65rem]">
      {provenance.sourceUrl ? (
        <a
          href={provenance.sourceUrl}
          rel="nofollow noopener noreferrer"
          target="_blank"
          className="underline underline-offset-2"
        >
          {provenance.source}
        </a>
      ) : (
        provenance.source
      )}
      {" · "}
      {confidence}
      {" · "}
      <time dateTime={provenance.reportedAt.toISOString()}>
        {provenance.reportedAt.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        })}
      </time>
    </p>
  );
}

export default async function PrepTrackPage({
  params,
}: PageProps<"/prepare/[track]">) {
  const { track: slug } = await params;
  const user = await getCurrentUser();
  const track = await getPrepTrack(slug, user?.id);

  if (!track) notFound();

  const solvedHere = track.problems.filter((p) => p.status === "SOLVED").length;
  const problemPercent = track.problems.length
    ? Math.round((solvedHere / track.problems.length) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/prepare"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        All tracks
      </Link>

      <p className="text-muted-foreground mt-3 text-[0.68rem] font-medium tracking-wider uppercase">
        Preparation track
      </p>
      <h1 className="tracking-headline mt-1 text-2xl font-bold sm:text-3xl">
        {track.name}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
        {track.blurb}
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <div className="border-border bg-card flex gap-3 rounded-xl border p-4">
            <Info
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-xs leading-relaxed">
              This describes a <em>kind</em> of interview loop, not any particular
              employer&rsquo;s. It is Tech Epitome&rsquo;s own editorial judgement
              about common industry practice — not a report of questions anyone has
              been asked. Each recommendation below carries its attribution.
            </p>
          </div>

          {/* --- The loop -------------------------------------------------- */}
          {track.interviewStages.length > 0 && (
            <section
              aria-labelledby="loop"
              className="bg-card border-border rounded-xl border p-4 sm:p-5"
            >
              <h2
                id="loop"
                className="tracking-headline flex items-center gap-2 text-base font-semibold"
              >
                <ListChecks className="text-ember-400 size-4" aria-hidden="true" />
                How this loop usually runs
              </h2>
              <ol className="mt-4">
                {track.interviewStages.map((stage, index) => (
                  <li key={stage.name} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < track.interviewStages.length - 1 && (
                      <span
                        className="bg-border absolute top-7 bottom-0 left-3 w-px"
                        aria-hidden="true"
                      />
                    )}
                    <span className="border-ember-500/50 bg-ember-500/12 text-ember-300 relative flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.65rem] font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-sm font-medium">{stage.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {stage.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* --- Roadmap --------------------------------------------------- */}
          {track.roadmap.length > 0 && (
            <section
              aria-labelledby="roadmap"
              className="bg-card border-border overflow-hidden rounded-xl border"
            >
              <h2
                id="roadmap"
                className="tracking-headline flex items-center gap-2 px-4 pt-4 text-base font-semibold sm:px-5"
              >
                <RouteIcon className="text-ember-400 size-4" aria-hidden="true" />
                A plan
              </h2>
              <ol className="border-border mt-3 divide-y divide-[var(--border)] border-t">
                {track.roadmap.map((step) => (
                  <li key={step.title} className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-sm font-medium">{step.title}</h3>
                      <span className="bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[0.65rem]">
                        {step.weeks}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {step.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* --- Problems -------------------------------------------------- */}
          {track.problems.length > 0 && (
            <section
              aria-labelledby="problems"
              className="bg-card border-border overflow-hidden rounded-xl border"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <h2
                  id="problems"
                  className="tracking-headline min-w-0 flex-1 text-base font-semibold"
                >
                  Problems worth doing for this loop
                </h2>
                {track.progress && (
                  <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36">
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {solvedHere}/{track.problems.length}
                    </span>
                    <div
                      className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-valuenow={problemPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Problems solved"
                    >
                      <div
                        className="bg-ember-500 h-full rounded-full"
                        style={{ width: `${problemPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <ul className="border-border divide-y divide-[var(--border)] border-t">
                {track.problems.map((problem) => (
                  <li
                    key={problem.slug}
                    className="hover:bg-accent/25 flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5"
                  >
                    {problem.status === "SOLVED" ? (
                      <CheckCircle2
                        className="text-success mt-0.5 size-[1.1rem] shrink-0"
                        aria-label="Solved"
                      />
                    ) : (
                      <Circle
                        className="text-muted-foreground/35 mt-0.5 size-[1.1rem] shrink-0"
                        aria-label="Not solved"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={route(`/problems/${problem.slug}`)}
                          className={cn(
                            "hover:text-ember-300 text-sm font-medium transition-colors",
                            problem.status === "SOLVED" ? "text-muted-foreground" : "text-info"
                          )}
                        >
                          {problem.title}
                        </Link>
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {problem.provenance.rationale}
                      </p>
                      <Attribution provenance={problem.provenance} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --- Design exercises ------------------------------------------ */}
          {track.systemDesign.length > 0 && (
            <section
              aria-labelledby="design"
              className="bg-card border-border overflow-hidden rounded-xl border"
            >
              <h2
                id="design"
                className="tracking-headline px-4 py-3.5 text-base font-semibold sm:px-5"
              >
                Design exercises worth doing
              </h2>
              <ul className="border-border divide-y divide-[var(--border)] border-t">
                {track.systemDesign.map((exercise) => (
                  <li
                    key={exercise.slug}
                    className="hover:bg-accent/25 flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5"
                  >
                    {exercise.submitted ? (
                      <CheckCircle2
                        className="text-success mt-0.5 size-[1.1rem] shrink-0"
                        aria-label="Submitted"
                      />
                    ) : (
                      <Circle
                        className="text-muted-foreground/35 mt-0.5 size-[1.1rem] shrink-0"
                        aria-label="Not submitted"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={route(`/system-design/${exercise.slug}`)}
                          className={cn(
                            "hover:text-ember-300 text-sm font-medium transition-colors",
                            exercise.submitted ? "text-muted-foreground" : "text-info"
                          )}
                        >
                          {exercise.title}
                        </Link>
                        <DifficultyBadge difficulty={exercise.difficulty} />
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {exercise.provenance.rationale}
                      </p>
                      <Attribution provenance={exercise.provenance} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* --- Right rail -------------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          {track.progress && track.progress.total > 0 && (
            <div className="bg-card border-border rounded-xl border p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Progress</h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {track.progress.solved} / {track.progress.total}
                </span>
              </div>
              <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  className="bg-ember-500 h-full rounded-full"
                  style={{
                    width: `${Math.round((track.progress.solved / track.progress.total) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                <span className="text-ember-300 font-medium">{track.progress.solved}</span>{" "}
                of {track.progress.total} recommended problems solved.
              </p>
            </div>
          )}

          {track.focusAreas.length > 0 && (
            <section
              aria-labelledby="focus"
              className="bg-card border-border rounded-xl border p-4"
            >
              <h2 id="focus" className="flex items-center gap-1.5 text-sm font-semibold">
                <Target className="text-ember-400 size-3.5" aria-hidden="true" />
                What to weight
              </h2>
              <ul className="marker:text-ember-500/60 mt-2 list-disc space-y-1.5 pl-4">
                {track.focusAreas.map((area) => (
                  <li key={area} className="text-muted-foreground text-xs leading-relaxed">
                    {area}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <DesignThumb kind="stages" className="border-border h-24 w-full border-b" />
            <div className="p-4">
              <p className="text-muted-foreground text-xs leading-relaxed">
                When the reading list stops being the hard part, the loop itself is.
              </p>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link href="/interviews">Run a mock interview</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
