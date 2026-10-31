import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { requireCampusUser } from "@/lib/campus-access";
import type { DimensionHistory } from "@/lib/career/summary";
import {
  BAND_LABELS,
  DIMENSION_LABELS,
  INTERVIEW_TYPES,
  MACHINES,
} from "@/lib/interview/types";
import { route } from "@/lib/utils";
import { getCareerOverview } from "@/services/career";

export const metadata: Metadata = {
  title: "Interview insights",
  robots: { index: false, follow: false },
};

/**
 * Strengths, focus areas and what to practise next, from the learner's
 * own feedback and activity. Private to them; nothing here is shared.
 */
export default async function InsightsPage() {
  const user = await requireCampusUser("/interviews/insights");
  const { summary, history, recommendations } = await getCareerOverview(user.id);

  const stats = [
    { label: "Mock interviews completed", value: history.interviewsCompleted },
    { label: "With written feedback", value: summary.sessions },
    { label: "Problems solved", value: history.problemsSolved },
    { label: "Lessons completed", value: history.chaptersCompleted },
    { label: "Designs submitted", value: history.designsSubmitted },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Interview insights"
        description="Built only from feedback you received and practice you did. Private to you."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/interviews">All interviews</Link>
          </Button>
        }
      />

      <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      {summary.sessions > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          By type:{" "}
          {INTERVIEW_TYPES.filter((t) => summary.byType[t] > 0)
            .map((t) => `${MACHINES[t].label} ${summary.byType[t]}`)
            .join(", ")}
        </p>
      )}

      {summary.sessions === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No written feedback yet. Finish a mock interview and generate its feedback to
          see strengths and focus areas here.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <HistoryList
            title="Strengths"
            empty="Nothing rated solid or strong in your latest feedback yet."
            items={summary.strengths}
          />
          <HistoryList
            title="Focus areas"
            empty="Nothing rated developing in your latest feedback."
            items={summary.improvements}
          />
        </div>
      )}
      {summary.notYetShown.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Not reached in any interview yet:{" "}
          {summary.notYetShown.map((h) => DIMENSION_LABELS[h.dimension]).join(", ")}.
          That is not a weakness; the interviews ended before getting there.
        </p>
      )}

      <section aria-labelledby="next-heading" className="mt-8">
        <h2 id="next-heading" className="text-base font-semibold">
          What to practise next
        </h2>
        {recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Recommendations appear once your feedback names a focus area.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {recommendations.map((r) => (
              <li key={r.href} className="px-4 py-3">
                <Link href={route(r.href)} className="font-medium hover:underline">
                  {r.title}
                </Link>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Feedback is AI-generated and advisory. These summaries help you choose what to
        practise; they do not predict or guarantee placement or hiring.
      </p>
    </div>
  );
}

function HistoryList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: DimensionHistory[];
}) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((h) => (
            <li
              key={`${h.type}:${h.dimension}`}
              className="rounded-lg border border-border p-3"
            >
              <p className="font-medium">
                {DIMENSION_LABELS[h.dimension]}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · {MACHINES[h.type].label}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {h.bands.map((b) => BAND_LABELS[b]).join(" → ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
