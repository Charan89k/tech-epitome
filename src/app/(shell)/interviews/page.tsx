import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  MessagesSquare,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { NewInterviewForm } from "@/components/interview/new-interview-form";
import { PageHeader } from "@/components/common/page-header";
import { StatTile } from "@/components/common/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";
import { STAGE_LABELS } from "@/lib/interview/types";
import { route } from "@/lib/utils";
import { getInterviewStats, listInterviews } from "@/services/interview";

export const metadata: Metadata = {
  title: "Mock interviews",
  description:
    "Practise a technical interview with an AI interviewer that evaluates rather than teaches, then read structured feedback on what you actually did.",
  alternates: { canonical: "/interviews" },
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  return `${Math.round(seconds / 60)} min`;
}

export default async function InterviewsPage() {
  const user = await requireUser("/interviews");
  const allowed = canAccess(user, FEATURES.AI_MOCK_INTERVIEW);

  // Every number below is an aggregate over this user's own rows.
  // Nothing here is hardcoded and nothing is estimated.
  const [stats, sessions] = await Promise.all([
    getInterviewStats(user.id),
    listInterviews(user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Mock Interviews"
        description="An interviewer that asks rather than teaches. It will not correct you mid-answer — the feedback comes afterwards, with evidence from what you said."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Interviews" value={stats.total} />
        <StatTile label="Completed" value={stats.completed} />
        <StatTile label="With feedback" value={stats.withFeedback} />
        <StatTile label="In progress" value={stats.inProgress} />
      </div>

      {!allowed ? (
        <div className="border-border bg-card mt-8 rounded-lg border p-6 text-center">
          <Lock className="text-muted-foreground mx-auto size-5" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold">
            Mock interviews are part of Pro
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            A full interview loop with an AI interviewer, and written feedback
            with evidence from your own transcript.
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/pricing">See plans</Link>
          </Button>
        </div>
      ) : (
        <section aria-labelledby="start" className="mt-8">
          <h2 id="start" className="text-sm font-semibold">
            Start an interview
          </h2>
          <div className="mt-3">
            <NewInterviewForm />
          </div>
        </section>
      )}

      <section aria-labelledby="history" className="mt-10">
        <h2 id="history" className="text-sm font-semibold">
          Your interviews
        </h2>

        {sessions.length === 0 ? (
          <div className="border-border mt-3 rounded-lg border border-dashed">
            <EmptyState
              icon={MessagesSquare}
              title="No interviews yet"
              description="Start one above. Sessions, transcripts and feedback all appear here afterwards."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="interview-history">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={route(`/interviews/${session.id}`)}
                  className="border-border bg-card hover:border-ember-500/35 group flex items-center gap-4 rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {session.problemTitle ?? "Interview"}
                      </h3>
                      <Badge variant="secondary" className="text-[0.65rem]">
                        {session.type.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {session.difficulty.toLowerCase()}
                      </Badge>
                      {session.hasFeedback && (
                        <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Feedback
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>{session.startedAt.toLocaleDateString()}</span>
                      <span>{STAGE_LABELS[session.stage]}</span>
                      {session.durationSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {formatDuration(session.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-500 size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground/70 mt-8 text-xs leading-relaxed">
        Feedback here is generated by a language model reading your transcript.
        It is a practice tool — useful for noticing habits, not a measurement,
        and not equivalent to a real company interview.
      </p>
    </div>
  );
}
