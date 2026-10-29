/**
 * The next concrete things to do on a preparation track, from the
 * learner's own progress. A problem already attempted comes before a fresh
 * one (finishing beats starting); then the next design not yet submitted;
 * then a mock interview once there is something to rehearse.
 */

export type NextStep = { label: string; href: string; why: string };

type TrackProgress = {
  problems: { slug: string; title: string; status: "NOT_STARTED" | "ATTEMPTED" | "SOLVED" }[];
  systemDesign: { slug: string; title: string; submitted: boolean }[];
};

export function nextSteps(track: TrackProgress, limit = 3): NextStep[] {
  const steps: NextStep[] = [];
  const attempted = track.problems.find((p) => p.status === "ATTEMPTED");
  const fresh = track.problems.find((p) => p.status === "NOT_STARTED");
  if (attempted) {
    steps.push({
      label: `Finish ${attempted.title}`,
      href: `/problems/${attempted.slug}`,
      why: "You have attempted it but not solved it yet.",
    });
  }
  if (fresh) {
    steps.push({
      label: `Start ${fresh.title}`,
      href: `/problems/${fresh.slug}`,
      why: "The next recommended problem on this track.",
    });
  }
  const design = track.systemDesign.find((d) => !d.submitted);
  if (design) {
    steps.push({
      label: `Design ${design.title}`,
      href: `/system-design/${design.slug}`,
      why: "The next design exercise on this track you have not submitted.",
    });
  }
  const solved = track.problems.filter((p) => p.status === "SOLVED").length;
  if (solved > 0) {
    steps.push({
      label: "Rehearse in a mock interview",
      href: "/interviews",
      why: `You have solved ${solved} problem${solved === 1 ? "" : "s"} here; practise explaining one out loud.`,
    });
  }
  return steps.slice(0, limit);
}
