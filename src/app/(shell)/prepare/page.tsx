import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Info, Target } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { DesignThumb, type DesignThumbKind } from "@/components/system-design/design-thumb";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import { listPrepTracks } from "@/services/prep";

export const metadata: Metadata = {
  title: "Interview preparation",
  description:
    "Preparation plans for the shapes interview loops come in — a generalist loop, a startup loop, an infrastructure role — each with the problems and design exercises that rehearse them.",
  alternates: { canonical: "/prepare" },
};

const THUMBS: DesignThumbKind[] = ["stages", "roadmap", "layers"];

export default async function PrepareIndexPage() {
  const user = await getCurrentUser();
  const tracks = await listPrepTracks(user?.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Interview Preparation"
        description="Interview loops come in recognisable shapes, and they are different preparation problems. Pick the one closest to what you are heading into."
      />

      {/* The honesty notice, above the content rather than in a footnote. */}
      <div className="border-border bg-card mt-6 flex gap-3 rounded-xl border p-4">
        <span className="bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Info className="text-muted-foreground size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">These are shapes, not employers.</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Tech Epitome has no sourced record of what any company asks, so it does
            not claim to. Every plan below is our own description of how a kind
            of interview loop commonly runs, and every recommendation says who
            made the judgement and how confident it is.
          </p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="bg-card border-border mt-6 rounded-xl border">
          <EmptyState
            icon={Compass}
            title="No preparation tracks published yet"
            description="Tracks appear here once published. Running locally? Seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, index) => {
            const percent =
              track.solved !== null && track.problemCount > 0
                ? Math.round((track.solved / track.problemCount) * 100)
                : 0;
            return (
              <li key={track.slug}>
                <Link
                  href={route(`/prepare/${track.slug}`)}
                  className="group bg-card border-border hover:border-ember-500/40 focus-visible:ring-ring/50 flex h-full flex-col overflow-hidden rounded-xl border transition-colors focus-visible:ring-3 focus-visible:outline-none"
                >
                  <DesignThumb
                    kind={THUMBS[index % THUMBS.length]!}
                    className="border-border h-32 w-full border-b"
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start gap-2">
                      <h2 className="group-hover:text-ember-200 min-w-0 flex-1 text-base font-semibold transition-colors">
                        {track.name}
                      </h2>
                      <ArrowUpRight
                        className="text-muted-foreground group-hover:text-ember-400 mt-0.5 size-4 shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm leading-snug">
                      {track.blurb}
                    </p>

                    {track.focusAreas.length > 0 && (
                      <p className="text-muted-foreground/80 mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
                        <Target
                          className="text-ember-400 mt-0.5 size-3 shrink-0"
                          aria-hidden="true"
                        />
                        {track.focusAreas[0]}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                        <span>{track.problemCount} problems</span>
                        <span className="text-muted-foreground/40" aria-hidden="true">
                          ·
                        </span>
                        <span>{track.designCount} design exercises</span>
                        {track.solved !== null && (
                          <span className="text-ember-300 ml-auto font-mono tabular-nums">
                            {track.solved} solved
                          </span>
                        )}
                      </p>
                      {track.solved !== null && (
                        <div
                          className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${track.name} progress`}
                        >
                          <div
                            className="bg-ember-500 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!user && tracks.length > 0 && (
        <div className="border-border bg-card mt-6 flex flex-col items-start gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Sign in to track which of these you have already solved.
          </p>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
