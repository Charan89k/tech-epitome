import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, MessagesSquare } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { NewInterviewForm } from "@/components/interview/new-interview-form";
import { PageHeader } from "@/components/common/page-header";
import { StatTile } from "@/components/common/stat-tile";
import { DesignThumb } from "@/components/system-design/design-thumb";
import { requireUser } from "@/lib/auth/session";
import { MACHINES, STAGE_LABELS } from "@/lib/interview/types";
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

  // Every number below is an aggregate over this user's own rows.
  // Nothing here is hardcoded and nothing is estimated.
  const [stats, sessions] = await Promise.all([
    getInterviewStats(user.id),
    listInterviews(user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Mock Interviews"
        description="An interviewer that asks rather than teaches. It will not correct you mid-answer — the feedback comes afterwards, with evidence from what you said."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Interviews" value={stats.total} className="rounded-xl" />
        <StatTile label="Completed" value={stats.completed} className="rounded-xl" />
        <StatTile label="With feedback" value={stats.withFeedback} className="rounded-xl" />
        <StatTile label="In progress" value={stats.inProgress} className="rounded-xl" />
      </div>

      <section
        aria-labelledby="start"
        className="bg-card border-border mt-6 overflow-hidden rounded-xl border md:grid md:grid-cols-[15rem_1fr]"
      >
        <DesignThumb
          kind="stages"
          className="border-border hidden h-full min-h-40 border-r md:flex"
        />
        <div className="p-4 sm:p-5">
          <h2 id="start" className="tracking-headline text-lg font-semibold">
            Start an interview
          </h2>
          <p className="text-muted-foreground mt-0.5 mb-4 text-xs">
            Pick the kind of loop to rehearse. Every stage is shown as you go.
          </p>
          <NewInterviewForm />
        </div>
      </section>

      <section aria-labelledby="history" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 id="history" className="tracking-headline text-lg font-semibold">
            Your interviews
          </h2>
          {sessions.length > 0 && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="bg-card border-border mt-3 rounded-xl border">
            <EmptyState
              icon={MessagesSquare}
              title="No interviews yet"
              description="Start one above. Sessions, transcripts and feedback all appear here afterwards."
            />
          </div>
        ) : (
          <div
            className="bg-card border-border mt-3 overflow-x-auto rounded-xl border"
            data-testid="interview-history"
          >
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Your interviews, newest first</caption>
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs">
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                    Interview
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Stage
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-medium">
                    Length
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-accent/25 transition-colors">
                    <td className="px-4 py-3 sm:px-5">
                      <Link
                        href={route(`/interviews/${session.id}`)}
                        className="text-info hover:text-ember-300 font-medium transition-colors"
                      >
                        {session.problemTitle ?? "Interview"}
                      </Link>
                      <span className="text-muted-foreground ml-2 text-xs capitalize">
                        {session.difficulty.toLowerCase()}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-2 py-3 text-xs">
                      {MACHINES[session.type].label}
                    </td>
                    <td className="px-2 py-3 text-xs">{STAGE_LABELS[session.stage]}</td>
                    <td className="text-muted-foreground px-2 py-3 text-xs whitespace-nowrap">
                      {session.startedAt.toLocaleDateString()}
                    </td>
                    <td className="text-muted-foreground px-2 py-3 text-right text-xs whitespace-nowrap tabular-nums">
                      {session.durationSeconds > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {formatDuration(session.durationSeconds)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      {session.hasFeedback && (
                        <span className="text-ember-300 inline-flex items-center gap-1 text-xs font-medium">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-muted-foreground/70 mt-8 text-xs leading-relaxed">
        Feedback here is generated by a language model reading your transcript. It is a
        practice tool — useful for noticing habits, not a measurement, and not
        equivalent to a real company interview.
      </p>
    </div>
  );
}
