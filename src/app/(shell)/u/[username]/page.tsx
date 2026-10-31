import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { SectionHeading } from "@/components/common/section-heading";
import { getPublicProfile } from "@/services/leaderboard";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: true },
};

export default async function PublicProfilePage({
  params,
}: PageProps<"/u/[username]">) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const stats = [
    { label: "Solved", value: profile.problemsSolved },
    { label: "Easy", value: profile.easySolved },
    { label: "Medium", value: profile.mediumSolved },
    { label: "Hard", value: profile.hardSolved },
    { label: "Streak", value: `${profile.currentStreak}d` },
    { label: "Best streak", value: `${profile.longestStreak}d` },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Learner"
        title={profile.username ?? username}
        description={profile.bio ?? undefined}
      />
      <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4">
            <dd className="font-mono text-xl">{s.value}</dd>
            <dt className="mt-1 label-mono">{s.label}</dt>
          </div>
        ))}
      </dl>
      {profile.achievements.length > 0 && (
        <section aria-labelledby="achievements-heading" className="mt-8">
          <SectionHeading
            id="achievements-heading"
            title="Achievements"
            count={profile.achievements.length}
          />
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {profile.achievements.map((a) => (
              <li
                key={a.name}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <p className="font-medium">{a.name}</p>
                <p className="mt-0.5 text-muted-foreground">{a.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
