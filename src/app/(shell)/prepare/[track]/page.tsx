import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Info,
  ListChecks,
  Route as RouteIcon,
  Target,
} from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 h-8">
        <Link href="/prepare">
          <ChevronLeft className="size-4" />
          All tracks
        </Link>
      </Button>

      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {track.name}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {track.blurb}
      </p>

      {track.progress && track.progress.total > 0 && (
        <p className="text-muted-foreground mt-3 text-xs">
          <span className="text-success font-medium">
            {track.progress.solved}
          </span>{" "}
          of {track.progress.total} recommended problems solved.
        </p>
      )}

      <div className="border-border bg-card mt-5 flex gap-3 rounded-lg border p-3.5">
        <Info
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          This describes a <em>kind</em> of interview loop, not any particular
          employer&rsquo;s. It is CodeForge&rsquo;s own editorial judgement
          about common industry practice — not a report of questions anyone has
          been asked. Each recommendation below carries its attribution.
        </p>
      </div>

      {/* --- The loop ---------------------------------------------------- */}
      {track.interviewStages.length > 0 && (
        <section aria-labelledby="loop" className="mt-8">
          <h2
            id="loop"
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <ListChecks className="size-3.5" aria-hidden="true" />
            How this loop usually runs
          </h2>
          <ol className="mt-3 space-y-2">
            {track.interviewStages.map((stage, index) => (
              <li
                key={stage.name}
                className="border-border bg-card rounded-lg border p-3.5"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-ember-500/60 font-mono text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-sm font-medium">{stage.name}</h3>
                </div>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {stage.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* --- Focus areas -------------------------------------------------- */}
      {track.focusAreas.length > 0 && (
        <section aria-labelledby="focus" className="mt-8">
          <h2
            id="focus"
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <Target className="size-3.5" aria-hidden="true" />
            What to weight
          </h2>
          <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
            {track.focusAreas.map((area) => (
              <li
                key={area}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {area}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Roadmap ------------------------------------------------------ */}
      {track.roadmap.length > 0 && (
        <section aria-labelledby="roadmap" className="mt-8">
          <h2
            id="roadmap"
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <RouteIcon className="size-3.5" aria-hidden="true" />
            A plan
          </h2>
          <ol className="border-border mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
            {track.roadmap.map((step) => (
              <li key={step.title} className="p-3.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <Badge variant="outline" className="text-[0.65rem]">
                    {step.weeks}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Separator className="my-8" />

      {/* --- Problems ----------------------------------------------------- */}
      {track.problems.length > 0 && (
        <section aria-labelledby="problems">
          <h2 id="problems" className="text-sm font-semibold">
            Problems worth doing for this loop
          </h2>
          <ul className="border-border mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
            {track.problems.map((problem) => (
              <li key={problem.slug}>
                <Link
                  href={route(`/problems/${problem.slug}`)}
                  className="hover:bg-accent/40 group flex items-start gap-3 p-3.5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {problem.title}
                      </span>
                      <DifficultyBadge difficulty={problem.difficulty} />
                      {problem.status === "SOLVED" && (
                        <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Solved
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {problem.provenance.rationale}
                    </p>
                    <Attribution provenance={problem.provenance} />
                  </div>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-500 mt-1 size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Design exercises --------------------------------------------- */}
      {track.systemDesign.length > 0 && (
        <section aria-labelledby="design" className="mt-8">
          <h2 id="design" className="text-sm font-semibold">
            Design exercises worth doing
          </h2>
          <ul className="border-border mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
            {track.systemDesign.map((exercise) => (
              <li key={exercise.slug}>
                <Link
                  href={route(`/system-design/${exercise.slug}`)}
                  className="hover:bg-accent/40 group flex items-start gap-3 p-3.5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {exercise.title}
                      </span>
                      <DifficultyBadge difficulty={exercise.difficulty} />
                      {exercise.submitted && (
                        <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Submitted
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {exercise.provenance.rationale}
                    </p>
                    <Attribution provenance={exercise.provenance} />
                  </div>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-500 mt-1 size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border-border bg-card mt-8 flex flex-col items-start gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          When the reading list stops being the hard part, the loop itself is.
        </p>
        <Button asChild size="sm">
          <Link href="/interviews">Run a mock interview</Link>
        </Button>
      </div>
    </div>
  );
}
