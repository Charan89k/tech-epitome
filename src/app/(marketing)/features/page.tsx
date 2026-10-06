import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MessagesSquare, Sparkles } from "lucide-react";

import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Everything in Tech Epitome",
  description:
    "Every track, tool and AI feature in Tech Epitome, and what each one is for. All of it is free — there is no paid tier.",
  alternates: { canonical: "/features" },
};

/**
 * What used to be the pricing page.
 *
 * Tech Epitome is free, so the question this page answers is no longer "what
 * does it cost" but "what is actually in it". The route `/pricing` redirects
 * here (see `next.config.ts`) rather than 404ing, because a pricing link that
 * dies is a worse answer than one that explains there is nothing to pay.
 */

const TRACKS = [
  {
    diagram: "tree",
    title: "Data structures & algorithms",
    body: "A dependency-ordered curriculum from complexity analysis through advanced dynamic programming. Each chapter states what you should be able to do afterwards, then checks it with problems and recall.",
    href: "/learn/dsa",
    linkLabel: "Open the curriculum",
  },
  {
    diagram: "window",
    title: "Algorithm patterns",
    body: "Each pattern page opens with the clues that identify it and the look-alikes that do not. Recognition is the skill an interview actually tests, so it is taught directly rather than left to emerge from volume.",
    href: "/patterns",
    linkLabel: "Browse patterns",
  },
  {
    diagram: "pointers",
    title: "Problems with a real editor",
    body: "Python, JavaScript, Java and C++, run against tests in an isolated sandbox. A failure shows the case that broke and what it expected, not a red cross.",
    href: "/problems",
    linkLabel: "Browse problems",
  },
  {
    diagram: "architecture",
    title: "System design",
    body: "Draw an architecture for a realistic brief and say what you traded away. The reference design and its trade-offs appear after you submit — withholding them before that is the whole exercise.",
    href: "/system-design",
    linkLabel: "See the exercises",
  },
  {
    diagram: "classes",
    title: "Low-level design",
    body: "Decide what each class is the only thing that knows, then defend it. Same rule as system design: you commit to a design before you see one.",
    href: "/lld",
    linkLabel: "See the exercises",
  },
  {
    diagram: "schedule",
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
  "No paid plan, no paid tier, no add-ons.",
  "No card, at signup or ever.",
  "No feature reserved for anyone. An account unlocks all of it.",
  "The AI features are rate-limited to keep them affordable to run — never to sell you a larger allowance.",
] as const;

export default function FeaturesPage() {
  return (
    <>
      {/* ---- Header ------------------------------------------------------ */}
      <section className="bg-hero-haze">
        <div className="mx-auto max-w-4xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <p className="border-ember-500/25 bg-ember-500/8 text-ember-300 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="bg-ember-500 size-1.5 rounded-full" aria-hidden="true" />
            Free · No plans · No card
          </p>
          <h1 className="tracking-display mt-6 text-4xl leading-[1.05] font-bold text-balance sm:text-5xl lg:text-6xl">
            Everything in <span className="whitespace-nowrap">{site.name}</span>,{" "}
            <span className="text-gradient-ember">for everyone</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            There is no pricing page because{" "}
            <strong className="text-foreground font-semibold">there is no price</strong>. Every
            track, every exercise and both AI features are available to any account. What follows is
            what you get, not what a tier gets.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
              <Link href="/signup">
                Create your account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
              <Link href="/learn/dsa">Look around first</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Tracks ------------------------------------------------------ */}
      <section aria-labelledby="tracks-heading">
        <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6 sm:pb-20">
          <h2 id="tracks-heading" className="tracking-headline text-2xl font-bold sm:text-3xl">
            What you can work through
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => (
              <article
                key={track.title}
                className="bg-card border-border flex flex-col overflow-hidden rounded-2xl border"
              >
                <MiniDiagram kind={track.diagram} className="border-border h-36 border-b p-3" />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-semibold">{track.title}</h3>
                  <p className="text-muted-foreground mt-1.5 flex-1 text-sm leading-relaxed">
                    {track.body}
                  </p>
                  <Link
                    href={track.href}
                    className="text-ember-300 hover:text-ember-200 mt-4 inline-flex items-center gap-1 text-sm font-medium"
                  >
                    {track.linkLabel}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- AI ---------------------------------------------------------- */}
      <section aria-labelledby="ai-heading" className="border-border border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="ai-heading" className="tracking-headline text-2xl font-bold sm:text-3xl">
            The AI features, and their one rule
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
            Both of them are built to make you do the work. Neither will hand you a finished
            solution, and neither can see a hidden test or a reference answer — that material never
            reaches the model.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {AI.map((feature) => (
              <article key={feature.title} className="bg-card border-border rounded-2xl border p-6">
                <span className="border-border bg-muted/40 text-ember-400 flex size-9 items-center justify-center rounded-xl border">
                  <feature.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The free claim, stated plainly ------------------------------ */}
      <section aria-labelledby="free-heading" className="bg-hero-haze border-border border-t">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="bg-card border-border rounded-2xl border p-6 sm:p-8">
            <h2 id="free-heading" className="tracking-headline text-2xl font-bold sm:text-3xl">
              What &ldquo;free&rdquo; means here
            </h2>
            <ul className="mt-6 space-y-3.5">
              {FREE_FACTS.map((fact) => (
                <li key={fact} className="flex items-start gap-3">
                  <span className="bg-ember-500/12 text-ember-400 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  <span className="text-foreground/90 text-sm leading-relaxed sm:text-base">
                    {fact}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground border-border mt-6 border-t pt-6 text-sm leading-relaxed">
              An account exists so your progress, notes, submissions and conversations have somewhere
              to live and stay yours. That is the only thing it is for.
            </p>

            <Button asChild className="mt-6 h-11 rounded-full px-6 text-base">
              <Link href="/signup">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
