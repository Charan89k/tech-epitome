import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Info, Target } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
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

export default async function PrepareIndexPage() {
  const user = await getCurrentUser();
  const tracks = await listPrepTracks(user?.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Interview Preparation"
        description="Interview loops come in recognisable shapes, and they are different preparation problems. Pick the one closest to what you are heading into."
      />

      {/* The honesty notice, above the content rather than in a footnote. */}
      <div className="border-border bg-card mt-6 flex gap-3 rounded-lg border p-4">
        <Info
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
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
        <div className="border-border mt-8 rounded-lg border border-dashed">
          <EmptyState
            icon={Compass}
            title="No preparation tracks published yet"
            description="Tracks appear here once published. Running locally? Seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {tracks.map((track) => (
            <li key={track.slug}>
              <Link
                href={route(`/prepare/${track.slug}`)}
                className="border-border bg-card hover:border-ember-500/35 group flex items-start gap-4 rounded-lg border p-4 transition-colors sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-medium">{track.name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {track.blurb}
                  </p>

                  {track.focusAreas.length > 0 && (
                    <p className="text-muted-foreground/70 mt-2 flex items-start gap-1.5 text-xs leading-relaxed">
                      <Target
                        className="mt-0.5 size-3 shrink-0"
                        aria-hidden="true"
                      />
                      {track.focusAreas[0]}
                    </p>
                  )}

                  <p className="text-muted-foreground/70 mt-2 text-xs">
                    {track.problemCount} problems · {track.designCount} design
                    exercises
                    {track.solved !== null && (
                      <>
                        {" · "}
                        <span className="text-success">
                          {track.solved} solved
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <ArrowRight
                  className="text-muted-foreground group-hover:text-ember-500 mt-1 size-4 shrink-0 transition-colors"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!user && tracks.length > 0 && (
        <div className="border-border bg-card mt-8 flex flex-col items-start gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
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
