import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ListChecks,
  Medal,
  PlayCircle,
  Trophy,
} from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { PageHeader } from "@/components/common/page-header";
import { VISUALIZATIONS } from "@/components/visualization/registry";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { site } from "@/lib/site";
import { route } from "@/lib/utils";
import { getDailyChallenge } from "@/services/daily";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Problems, contests, courses and a live algorithm visualizer, open to everyone.",
  alternates: { canonical: "/explore" },
};

const AREAS = [
  {
    href: "/problems",
    icon: ListChecks,
    title: "Problems",
    text: "Filter by difficulty, topic and status, then solve in the editor.",
  },
  {
    href: "/learn",
    icon: BookOpen,
    title: "Courses",
    text: "DSA, system design and low-level design, in dependency order.",
  },
  {
    href: "/contests",
    icon: Trophy,
    title: "Contests",
    text: "A set of problems and a clock, with public standings.",
  },
  {
    href: "/leaderboard",
    icon: Medal,
    title: "Leaderboard",
    text: "Learners who chose to be listed, ranked by problems solved.",
  },
] as const;

export default async function ExplorePage() {
  const [daily, user] = await Promise.all([getDailyChallenge(), getCurrentUser()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={`${site.name} Learn`}
        title="Practise. Compete. See it run."
        description="Open to everyone, with no college needed. Sign up only to save your progress."
        actions={
          !user && (
            <Button asChild>
              <Link href="/signup">Create a free account</Link>
            </Button>
          )
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-labelledby="visualizer-heading"
          className="rounded-lg border border-border bg-card p-5"
        >
          <PlayCircle className="size-5 text-brand-300" aria-hidden="true" />
          <h2 id="visualizer-heading" className="mt-3 text-lg font-semibold">
            Live Visualizer
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Step through {Object.keys(VISUALIZATIONS).length} algorithms frame by frame,
            or trace your own Python and JavaScript on any problem. Every frame comes
            from actually running the code.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/visualize">
              Open the visualizer
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </section>

        {daily && (
          <section
            aria-labelledby="daily-heading"
            className="rounded-lg border border-border bg-card p-5"
          >
            <CalendarCheck className="size-5 text-brand-300" aria-hidden="true" />
            <h2 id="daily-heading" className="mt-3 text-lg font-semibold">
              Today&apos;s challenge
            </h2>
            <Link
              href={route(`/problems/${daily.problem.slug}`)}
              className="mt-1 block font-medium text-info hover:underline"
            >
              {daily.problem.title}
            </Link>
            <div className="mt-1">
              <DifficultyBadge difficulty={daily.problem.difficulty} />
            </div>
          </section>
        )}
      </div>

      <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {AREAS.map((area) => (
          <li key={area.href} className="border-t border-border pt-4">
            <Link
              href={route(area.href)}
              className="group flex items-center gap-2 font-medium"
            >
              <area.icon className="size-4 text-brand-300" aria-hidden="true" />
              <span className="group-hover:text-brand-300">{area.title}</span>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{area.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
