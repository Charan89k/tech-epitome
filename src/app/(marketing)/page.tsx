import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  GitBranch,
  MousePointer2,
  Play,
  Repeat2,
  Sparkles,
  Target,
  TerminalSquare,
  Zap,
} from "lucide-react";

import { CodeReplayDemo } from "@/components/marketing/code-replay-demo";
import { CourseCards } from "@/components/marketing/course-cards";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

/** The learning loop the whole product is organised around. */
const LOOP = [
  { label: "See", detail: "A worked example, stepped one frame at a time" },
  { label: "Recognise", detail: "The clues that tell you which pattern applies" },
  { label: "Attempt", detail: "A guided problem, then one with no scaffolding" },
  { label: "Explain", detail: "Say why it works, and what it costs" },
  { label: "Recall", detail: "Spaced revision, timed to just before you forget" },
] as const;

const VISUALIZER_POINTS = [
  {
    icon: MousePointer2,
    title: "Every problem draws its input",
    body: "Open a problem and the sample is already on screen — the array, the list, the grid — before you write a line.",
  },
  {
    icon: Play,
    title: "Your code, replayed line by line",
    body: "Run Python or JavaScript and the picture steps through your own solution, with the current line highlighted.",
  },
  {
    icon: Zap,
    title: "Pointers move, changed cells flash",
    body: "You see exactly which index moved and which value was written, so an off-by-one shows up as a picture, not a failed test.",
  },
] as const;

const PILLARS = [
  {
    icon: Target,
    title: "Pattern recognition first",
    body: "Every pattern page opens with the clues that identify it — contiguous range, monotonic order, k-th largest — and the look-alikes that do not.",
  },
  {
    icon: TerminalSquare,
    title: "Write and run real code",
    body: "Python, JavaScript, Java and C++ in an editor, with your tests running in an isolated sandbox. Failures show the case that broke.",
  },
  {
    icon: Braces,
    title: "Solutions that teach",
    body: "Brute force, then the observation that improves it, then the optimal approach — with the complexity argument and the edge cases.",
  },
  {
    icon: Repeat2,
    title: "Revision that holds",
    body: "Solved problems return on a widening schedule, and how well you recall them sets the next interval.",
  },
  {
    icon: Sparkles,
    title: "A tutor that makes you think",
    body: "It knows the chapter you are reading and the code in your editor, and walks you toward the answer instead of handing it over.",
  },
  {
    icon: GitBranch,
    title: "Progress you can trust",
    body: "Mastery is computed from attempts, hints opened and recall quality — your own history, not a streak counter.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="bg-hero-haze relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <p className="border-ember-500/25 bg-ember-500/8 text-ember-300 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="bg-ember-500 size-1.5 rounded-full" aria-hidden="true" />
            Completely free · DSA · System Design · Interviews
          </p>

          <h1 className="tracking-display mt-6 text-5xl leading-[1.02] font-bold text-balance sm:text-6xl lg:text-7xl">
            Master Technology.
            <br />
            Build with <span className="text-gradient-ember">Confidence.</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">
            The interactive way to learn{" "}
            <strong className="text-foreground font-semibold">DSA, system design and coding patterns</strong>{" "}
            — with <strong className="text-foreground font-semibold">visuals that replay your own code</strong>.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
              <Link href="/signup">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
              <Link href="/learn/dsa">Explore DSA</Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-4 text-xs">
            Free. Every track, every exercise, both AI features. No card.
          </p>
        </div>

        {/* ---- Courses --------------------------------------------------- */}
        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
          <h2 className="sr-only">Courses</h2>
          <CourseCards />
        </div>
      </section>

      {/* ---- Live visualizer --------------------------------------------- */}
      <section aria-labelledby="visualizer-heading" className="border-border border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <span className="bg-ember-500/15 text-ember-300 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              New
            </span>
            <h2
              id="visualizer-heading"
              className="tracking-headline mt-4 text-3xl font-bold text-balance sm:text-4xl"
            >
              Watch your code <span className="text-gradient-ember">run</span>, line by line
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed text-pretty sm:text-lg">
              The live code visualizer is built into every problem. Write a solution, press Run, and
              see what it actually does to the data.
            </p>
          </div>

          <CodeReplayDemo className="mt-10" />

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {VISUALIZER_POINTS.map((point) => (
              <li key={point.title}>
                <span className="border-border bg-muted/40 text-ember-400 flex size-9 items-center justify-center rounded-xl border">
                  <point.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold">{point.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{point.body}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/problems"
            className="text-ember-300 hover:text-ember-200 mt-8 inline-flex items-center gap-1 text-sm font-medium"
          >
            Try it on a problem
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ---- The loop ---------------------------------------------------- */}
      <section aria-labelledby="loop-heading" className="border-border border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="loop-heading" className="tracking-headline text-2xl font-bold sm:text-3xl">
            The loop every chapter runs you through
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
            Reading an explanation is not learning. The product is built around the sequence that
            actually moves something into long-term memory.
          </p>

          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP.map((step, index) => (
              <li key={step.label} className="bg-card border-border rounded-2xl border p-5">
                <span className="text-ember-400 font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-semibold">{step.label}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Pillars ----------------------------------------------------- */}
      <section aria-labelledby="pillars-heading" className="border-border border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="pillars-heading" className="tracking-headline text-2xl font-bold sm:text-3xl">
            What makes it different
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="bg-card border-border rounded-2xl border p-5">
                <span className="border-border bg-muted/40 text-ember-400 flex size-9 items-center justify-center rounded-xl border">
                  <pillar.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{pillar.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Closing ----------------------------------------------------- */}
      <section className="bg-hero-haze border-border border-t">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="tracking-headline text-3xl font-bold text-balance sm:text-4xl">
            Walk into the interview asking{" "}
            <span className="text-gradient-ember">&ldquo;what shape is this?&rdquo;</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base text-pretty">
            Not &ldquo;have I seen this exact problem before?&rdquo; That is the difference between
            preparing and hoping.
          </p>
          <Button asChild className="mt-8 h-12 rounded-full px-7 text-base">
            <Link href="/signup">
              Create your account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
