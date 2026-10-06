import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";

import { InterviewRoom } from "@/components/interview/interview-room";
import { requireUser } from "@/lib/auth/session";
import {
  BAND_LABELS,
  DIMENSION_LABELS,
  MACHINES,
  type EvaluationDimension,
  type RatingBand,
} from "@/lib/interview/types";
import { getInterview } from "@/services/interview";

export const metadata: Metadata = {
  title: "Interview",
  robots: { index: false, follow: false },
};

/** Band colour plus a written label, so colour is never the only signal. */
const BAND_STYLE: Record<RatingBand, string> = {
  not_demonstrated: "border-border text-muted-foreground",
  developing: "border-warning/35 bg-warning/10 text-warning",
  solid: "border-ember-500/35 bg-ember-500/10 text-ember-300",
  strong: "border-success/35 bg-success/10 text-success",
};

export default async function InterviewPage({ params }: PageProps<"/interviews/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/interviews/${id}`);

  // Scoped read: another learner's session id matches no row and 404s,
  // which is indistinguishable from one that never existed.
  const session = await getInterview(id, user.id);
  if (!session) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/interviews"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        All interviews
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="tracking-headline text-2xl font-bold sm:text-3xl">
          Mock interview
        </h1>
        <span className="text-xs text-muted-foreground">
          {MACHINES[session.type].label}
          <span className="mx-1.5 text-muted-foreground/40" aria-hidden="true">
            ·
          </span>
          <span className="capitalize">{session.difficulty.toLowerCase()}</span>
        </span>
      </div>

      <div className="mt-5">
        <InterviewRoom
          sessionId={session.id}
          kind={session.type}
          initialStage={session.stage}
          initialTranscript={session.transcript.map((t) => ({
            id: t.id,
            role: t.role,
            content: t.content,
          }))}
          initialCode={session.code}
          language={session.language}
          problemTitle={session.problemTitle}
          problemStatement={session.problemStatement}
          hasFeedback={Boolean(session.feedback)}
        />
      </div>

      {session.feedback && (
        <>
          <section
            aria-labelledby="feedback"
            className="mt-8 rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 id="feedback" className="tracking-headline text-lg font-semibold">
              Feedback
            </h2>

            {/* Labelled as AI-generated at the top, before anything is
                read as a verdict. */}
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Info
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <strong className="font-medium text-foreground">
                  AI-generated feedback.
                </strong>{" "}
                Written by a language model reading your transcript. Each judgement
                cites what it is based on, so you can disagree with it. There is no
                overall score, and this is not equivalent to a real company interview.
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {session.feedback.summary}
            </p>

            <h3 className="mt-6 text-sm font-semibold">By dimension</h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {session.feedback.dimensions.map((d) => (
                <li
                  key={d.dimension}
                  className="rounded-lg border border-border bg-background/40 p-3.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {DIMENSION_LABELS[d.dimension as EvaluationDimension] ??
                        d.dimension}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${
                        BAND_STYLE[d.band as RatingBand] ?? "border-border"
                      }`}
                    >
                      {BAND_LABELS[d.band as RatingBand] ?? d.band}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {d.evidence}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-2 grid gap-x-8 md:grid-cols-2">
              {session.feedback.strengths.length > 0 && (
                <div>
                  <h3 className="mt-6 text-sm font-semibold">What went well</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-ember-500/60">
                    {session.feedback.strengths.map((s) => (
                      <li
                        key={s}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.feedback.improvements.length > 0 && (
                <div>
                  <h3 className="mt-6 text-sm font-semibold">What to work on</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-ember-500/60">
                    {session.feedback.improvements.map((s) => (
                      <li
                        key={s}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
