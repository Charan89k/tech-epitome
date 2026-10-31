import type { Metadata } from "next";
import Link from "next/link";
import { Medal } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { route } from "@/lib/utils";
import { getLeaderboard } from "@/services/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Learners who chose to be listed, ranked by problems solved.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Compete"
        title="Leaderboard"
        description="Ranked by problems solved. Nobody is listed unless they turn on a public profile in Settings."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Nobody is listed yet"
          description="Solve a problem and turn on your public profile in Settings to be the first."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Learners ranked by problems solved</caption>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                <th scope="col" className="px-4 py-2.5">
                  #
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Learner
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Solved
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Easy
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Medium
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Hard
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {rows.map((row, i) => (
                <tr key={row.username}>
                  <td className="px-4 py-2.5">{i + 1}</td>
                  <td className="px-4 py-2.5 font-sans">
                    <Link
                      href={route(`/u/${row.username}`)}
                      className="text-info hover:underline"
                    >
                      {row.username}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right">{row.problemsSolved}</td>
                  <td className="px-4 py-2.5 text-right">{row.easySolved}</td>
                  <td className="px-4 py-2.5 text-right">{row.mediumSolved}</td>
                  <td className="px-4 py-2.5 text-right">{row.hardSolved}</td>
                  <td className="px-4 py-2.5 text-right">{row.currentStreak}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
