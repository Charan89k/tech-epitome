import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSharedSummary } from "@/services/sharing";

export const metadata: Metadata = {
  title: "Achievements",
  // A shared link is for the people it was sent to, not for search engines.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * A learner's public achievement summary. Only what `getSharedSummary`
 * returns: a chosen name, unlocked achievements, three counts. No scores,
 * feedback or transcripts exist on this page to leak.
 */
export default async function SharedSummaryPage({
  params,
}: PageProps<"/share/[token]">) {
  const { token } = await params;
  const summary = await getSharedSummary(token);
  if (!summary) notFound();

  const counts = [
    { label: "Problems solved", value: summary.counts.problemsSolved },
    { label: "Lessons completed", value: summary.counts.lessonsCompleted },
    { label: "Mock interviews practised", value: summary.counts.mockInterviews },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs text-muted-foreground">Tech Epitome learning summary</p>
      <h1 className="tracking-headline mt-1 text-2xl font-bold sm:text-3xl">
        {summary.displayName}
      </h1>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {counts.map((c) => (
          <div key={c.label} className="rounded-lg border border-border p-4">
            <dt className="text-xs text-muted-foreground">{c.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-8 text-base font-semibold">Achievements</h2>
      {summary.achievements.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None unlocked yet.</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {summary.achievements.map((a) => (
            <li key={a.name} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Unlocked{" "}
                {a.unlockedAt.toLocaleDateString("en", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Activity on a free practice platform, shared by the learner. It is not a
        certificate, an assessment or an endorsement by any employer.
      </p>
    </div>
  );
}
