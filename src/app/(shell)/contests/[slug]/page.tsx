import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { executionStatus } from "@/lib/code-execution";
import { route } from "@/lib/utils";
import { contestPhase, getContest, getStandings, isEntered } from "@/services/contests";

import { enterContestAction } from "../actions";

export const metadata: Metadata = { title: "Contest" };

const utc = (d: Date) => `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;

export default async function ContestPage({ params }: PageProps<"/contests/[slug]">) {
  const { slug } = await params;
  const contest = await getContest(slug);
  if (!contest) notFound();

  const user = await getCurrentUser();
  const phase = contestPhase(contest, new Date());
  const [entered, standings] = await Promise.all([
    user ? isEntered(contest.id, user.id) : false,
    getStandings(contest),
  ]);
  const execution = executionStatus();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={
          phase === "live" ? "Live now" : phase === "upcoming" ? "Upcoming" : "Finished"
        }
        title={contest.title}
        description={`${utc(contest.startsAt)} to ${utc(contest.endsAt)}`}
      />
      <p className="mt-4 max-w-2xl text-sm whitespace-pre-line text-muted-foreground">
        {contest.description}
      </p>

      {!execution.available && phase !== "ended" && (
        <p
          role="status"
          className="mt-4 rounded-md border border-warning/40 p-3 text-sm"
        >
          {execution.reason} Solves cannot be scored until submissions are on.
        </p>
      )}

      {phase !== "ended" && (
        <div className="mt-5">
          {!user ? (
            <Button asChild>
              <Link
                href={route(`/login?next=${encodeURIComponent(`/contests/${slug}`)}`)}
              >
                Sign in to enter
              </Link>
            </Button>
          ) : entered ? (
            <p className="text-sm text-success">You are entered.</p>
          ) : (
            <form action={enterContestAction.bind(null, slug)}>
              <Button type="submit">Enter this contest</Button>
              <p className="mt-2 text-xs text-subtle-foreground">
                Entering lists your username, or your name if you have none, in the
                public standings.
              </p>
            </form>
          )}
        </div>
      )}

      <section aria-labelledby="problems-heading" className="mt-8">
        <SectionHeading
          id="problems-heading"
          title="Problems"
          count={contest.problems.length}
        />
        {phase === "upcoming" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Problems appear when it starts.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {contest.problems.map((p, i) => (
              <li key={p.problemId} className="flex items-center gap-3 py-3 text-sm">
                <span className="font-mono text-xs text-subtle-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <Link
                  href={route(`/problems/${p.problem.slug}`)}
                  className="min-w-0 flex-1 font-medium text-info hover:underline"
                >
                  {p.problem.title}
                </Link>
                <DifficultyBadge difficulty={p.problem.difficulty} />
                <span className="font-mono text-xs">{p.points} pts</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="standings-heading" className="mt-8">
        <SectionHeading
          id="standings-heading"
          title="Standings"
          count={standings.length}
        />
        {standings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nobody has entered yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[28rem] text-sm">
              <caption className="sr-only">Contest standings</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                  <th scope="col" className="px-4 py-2.5">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Entrant
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Solved
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Penalty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {standings.map((row) => (
                  <tr key={row.userId}>
                    <td className="px-4 py-2.5">{row.rank}</td>
                    <td className="px-4 py-2.5 font-sans">{row.name}</td>
                    <td className="px-4 py-2.5 text-right">{row.solved}</td>
                    <td className="px-4 py-2.5 text-right">{row.score}</td>
                    <td className="px-4 py-2.5 text-right">{row.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
