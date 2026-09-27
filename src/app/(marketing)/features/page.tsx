import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Braces,
  Check,
  MessagesSquare,
  Network,
  Repeat2,
  Sparkles,
  Target,
  TerminalSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Everything in CodeForge",
  description:
    "Every track, tool and AI feature in CodeForge, and what each one is for. All of it is free — there is no paid tier.",
  alternates: { canonical: "/features" },
};

/**
 * What used to be the pricing page.
 *
 * CodeForge is free, so the question this page answers is no longer "what
 * does it cost" but "what is actually in it". The route `/pricing` redirects
 * here (see `next.config.ts`) rather than 404ing, because a pricing link that
 * dies is a worse answer than one that explains there is nothing to pay.
 */

const TRACKS = [
  {
    icon: Braces,
    title: "Data structures & algorithms",
    body: "A dependency-ordered curriculum from complexity analysis through advanced dynamic programming. Each chapter states what you should be able to do afterwards, then checks it with problems and recall.",
    href: "/learn/dsa",
    linkLabel: "Open the curriculum",
  },
  {
    icon: Target,
    title: "Algorithm patterns",
    body: "Each pattern page opens with the clues that identify it and the look-alikes that do not. Recognition is the skill an interview actually tests, so it is taught directly rather than left to emerge from volume.",
    href: "/patterns",
    linkLabel: "Browse patterns",
  },
  {
    icon: TerminalSquare,
    title: "Problems with a real editor",
    body: "Python, JavaScript, Java and C++, run against tests in an isolated sandbox. A failure shows the case that broke and what it expected, not a red cross.",
    href: "/problems",
    linkLabel: "Browse problems",
  },
  {
    icon: Network,
    title: "System design",
    body: "Draw an architecture for a realistic brief and say what you traded away. The reference design and its trade-offs appear after you submit — withholding them before that is the whole exercise.",
    href: "/system-design",
    linkLabel: "See the exercises",
  },
  {
    icon: Boxes,
    title: "Low-level design",
    body: "Decide what each class is the only thing that knows, then defend it. Same rule as system design: you commit to a design before you see one.",
    href: "/lld",
    linkLabel: "See the exercises",
  },
  {
    icon: Repeat2,
    title: "Spaced revision",
    body: "Solving something once is not learning it. Solved problems return on a widening schedule, and how well you recall them sets the next interval.",
    href: "/review",
    linkLabel: "Open review",
  },
] as const;

const AI = [
  {
    icon: Sparkles,
    title: "A tutor that refuses to just answer",
    body: "It knows the chapter you are reading and the code in your editor, and it walks you toward the answer instead of handing it over. Hints escalate only when you ask for the next one.",
  },
  {
    icon: MessagesSquare,
    title: "Mock interviews with real feedback",
    body: "An interviewer that asks rather than teaches, and will not correct you mid-answer. The feedback comes afterwards, with evidence quoted from your own transcript.",
  },
] as const;

const FREE_FACTS = [
  "No paid plan, no premium tier, no add-ons.",
  "No card, at signup or ever.",
  "No feature reserved for anyone. An account unlocks all of it.",
  "The AI features are rate-limited to keep them affordable to run — never to sell you a larger allowance.",
] as const;

export default function FeaturesPage() {
  return (
    <>
      {/* ---- Header ------------------------------------------------------ */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-ember-400 border-ember-500/25 bg-ember-500/8 inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs">
            Free · No plans · No card
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything in {site.name}, for everyone
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty">
            There is no pricing page because there is no price. Every track,
            every exercise and both AI features are available to any account.
            What follows is what you get, not what a tier gets.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Create your account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/learn/dsa">Look around first</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Tracks ------------------------------------------------------ */}
      <section aria-labelledby="tracks-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="tracks-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            What you can work through
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => (
              <article
                key={track.title}
                className="border-border bg-card surface-edge flex flex-col rounded-lg border p-5"
              >
                <track.icon
                  className="text-ember-500 size-5"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-sm font-semibold">{track.title}</h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  {track.body}
                </p>
                <Link
                  href={track.href}
                  className="text-ember-400 hover:text-ember-300 mt-4 inline-flex items-center gap-1 text-xs font-medium"
                >
                  {track.linkLabel}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- AI ---------------------------------------------------------- */}
      <section aria-labelledby="ai-heading" className="border-border border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="ai-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            The AI features, and their one rule
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Both of them are built to make you do the work. Neither will hand
            you a finished solution, and neither can see a hidden test or a
            reference answer — that material never reaches the model.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {AI.map((feature) => (
              <article
                key={feature.title}
                className="border-border bg-card surface-edge rounded-lg border p-5"
              >
                <feature.icon
                  className="text-ember-500 size-5"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The free claim, stated plainly ------------------------------ */}
      <section aria-labelledby="free-heading">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2
            id="free-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            What &ldquo;free&rdquo; means here
          </h2>
          <ul className="mt-6 space-y-3">
            {FREE_FACTS.map((fact) => (
              <li key={fact} className="flex items-start gap-3">
                <Check
                  className="text-success mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground text-sm leading-relaxed">
                  {fact}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground mt-8 text-sm leading-relaxed">
            An account exists so your progress, notes, submissions and
            conversations have somewhere to live and stay yours. That is the
            only thing it is for.
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">
              Start learning
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
