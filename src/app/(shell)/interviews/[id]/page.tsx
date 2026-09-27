import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";

import { InterviewRoom } from "@/components/interview/interview-room";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth/session";
import {
  BAND_LABELS,
  DIMENSION_LABELS,
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

export default async function InterviewPage({
  params,
}: PageProps<"/interviews/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/interviews/${id}`);

  // Scoped read: another learner's session id matches no row and 404s,
  // which is indistinguishable from one that never existed.
  const session = await getInterview(id, user.id);
  if (!session) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 h-8">
        <Link href="/interviews">
          <ChevronLeft className="size-4" />
          All interviews
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Mock interview</h1>
        <Badge variant="secondary" className="text-[0.65rem]">
          {session.type.replace(/_/g, " ")}
        </Badge>
        <Badge variant="outline" className="text-[0.65rem]">
          {session.difficulty.toLowerCase()}
        </Badge>
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
          <Separator className="my-8" />
          <section aria-labelledby="feedback">
            <h2 id="feedback" className="text-lg font-semibold tracking-tight">
              Feedback
            </h2>

            {/* Labelled as AI-generated at the top, before anything is
                read as a verdict. */}
            <div className="border-border bg-muted/30 mt-2 flex items-start gap-2 rounded-lg border p-3">
              <Info
                className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-xs leading-relaxed">
                <strong className="text-foreground font-medium">
                  AI-generated feedback.
                </strong>{" "}
                Written by a language model reading your transcript. Each
                judgement cites what it is based on, so you can disagree with
                it. There is no overall score, and this is not equivalent to a
                real company interview.
              </p>
            </div>

            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {session.feedback.summary}
            </p>

            <h3 className="mt-6 text-sm font-semibold">By dimension</h3>
            <ul className="mt-2 space-y-2">
              {session.feedback.dimensions.map((d) => (
                <li key={d.dimension} className="border-border rounded-lg border p-3">
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
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    {d.evidence}
                  </p>
                </li>
              ))}
            </ul>

            {session.feedback.strengths.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">What went well</h3>
                <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
                  {session.feedback.strengths.map((s) => (
                    <li key={s} className="text-muted-foreground text-sm leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {session.feedback.improvements.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">What to work on</h3>
                <ul className="marker:text-muted-foreground/40 mt-2 list-disc space-y-1 pl-5">
                  {session.feedback.improvements.map((s) => (
                    <li key={s} className="text-muted-foreground text-sm leading-relaxed">
                      {s}
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
