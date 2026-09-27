import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  GitBranch,
  Layers,
  Repeat2,
  Target,
  TerminalSquare,
} from "lucide-react";

import { HeroVisual } from "@/components/marketing/hero-visual";
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

const PILLARS = [
  {
    icon: Target,
    title: "Pattern recognition first",
    body: "Every pattern page opens with the clues that identify it — contiguous range, monotonic order, k-th largest — and the look-alikes that do not. Recognition is the skill an interview actually tests.",
  },
  {
    icon: Layers,
    title: "One curriculum, not a problem dump",
    body: "Complexity through advanced dynamic programming, in dependency order. Each chapter states what you should be able to do afterwards, then checks it.",
  },
  {
    icon: TerminalSquare,
    title: "Write and run real code",
    body: "Python, JavaScript, Java and C++ in an editor with your tests running in an isolated sandbox. Failures show the case that broke, not a red cross.",
  },
  {
    icon: Braces,
    title: "Solutions that teach",
    body: "Brute force, then the observation that improves it, then the optimal approach — with the complexity argument and the edge cases that catch people out.",
  },
  {
    icon: Repeat2,
    title: "Revision that holds",
    body: "Solving something once is not learning it. Solved problems return on a widening schedule, and how well you recall them sets the next interval.",
  },
  {
    icon: GitBranch,
    title: "Progress you can trust",
    body: "Mastery is computed from attempts, hints opened and recall quality. If the dashboard says a pattern is weak, it is because your own history says so.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
          <div>
            <p className="text-ember-400 border-ember-500/25 bg-ember-500/8 inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs">
              DSA · Patterns · System Design · Interviews
            </p>

            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Master Technology.
              <br />
              <span className="text-muted-foreground">Build with Confidence.</span>
            </h1>

            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              {site.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start learning
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/learn/dsa">Explore DSA</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-xs">
              Free. Every track, every exercise, both AI features. No card.
            </p>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ---- The loop ---------------------------------------------------- */}
      <section
        aria-labelledby="loop-heading"
        className="border-border border-y"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2
            id="loop-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            The loop every chapter runs you through
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Reading an explanation is not learning. The product is built around
            the sequence that actually moves something into long-term memory.
          </p>

          <ol className="mt-8 grid gap-px overflow-hidden rounded-lg sm:grid-cols-2 lg:grid-cols-5">
            {LOOP.map((step, index) => (
              <li
                key={step.label}
                className="bg-card border-border relative border p-5"
              >
                <span className="text-ember-500/60 font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-sm font-semibold">{step.label}</h3>
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Pillars ----------------------------------------------------- */}
      <section aria-labelledby="pillars-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="pillars-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            What makes it different
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="border-border bg-card surface-edge rounded-lg border p-5"
              >
                <pillar.icon
                  className="text-ember-500 size-5"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-sm font-semibold">{pillar.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Closing ----------------------------------------------------- */}
      <section className="border-border border-t">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Walk into the interview asking &ldquo;what shape is this?&rdquo;
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm text-pretty">
            Not &ldquo;have I seen this exact problem before?&rdquo; That is the
            difference between preparing and hoping.
          </p>
          <Button asChild size="lg" className="mt-7">
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
