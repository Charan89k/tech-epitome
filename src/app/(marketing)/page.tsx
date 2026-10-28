import type { Metadata } from "next";
import Link from "next/link";

import { CodeReplayDemo } from "@/components/marketing/code-replay-demo";
import { CourseCards } from "@/components/marketing/course-cards";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * The landing page is laid out like the contents page of a book: a title
 * spread, then one ruled section per product area. Every link goes to a
 * route that exists today; Campus is described honestly as unbuilt and has
 * no call to action.
 */

type Entry = { title: string; href: string; note: string };

const CONTENTS: { area: string; entries: Entry[] }[] = [
  {
    area: "Learn",
    entries: [
      { title: "Data Structures & Algorithms", href: "/learn/dsa", note: "Course" },
      { title: "System Design", href: "/learn/system-design", note: "Course" },
      { title: "Low-Level Design", href: "/learn/lld", note: "Course" },
    ],
  },
  {
    area: "Code",
    entries: [
      { title: "Problems", href: "/problems", note: "Editor and tests" },
      { title: "Visualize", href: "/visualize", note: "Step-through" },
    ],
  },
  {
    area: "Career",
    entries: [
      { title: "Interview preparation", href: "/prepare", note: "Tracks" },
      { title: "Roadmaps", href: "/roadmaps", note: "Study plans" },
    ],
  },
];

/** The learning loop every chapter runs. A real sequence, so it is numbered. */
const LOOP = [
  { label: "See", detail: "A worked example, stepped one frame at a time." },
  { label: "Recognise", detail: "The clues that tell you which pattern applies." },
  { label: "Attempt", detail: "A guided problem, then one with no scaffolding." },
  { label: "Explain", detail: "Say why it works, and what it costs." },
  { label: "Recall", detail: "Spaced revision, timed to just before you forget." },
] as const;

const CODE_POINTS = [
  {
    title: "Every problem draws its input",
    body: "The array, list or grid from the sample is on screen before you write a line.",
  },
  {
    title: "Your own solution, replayed",
    body: "Run Python or JavaScript and the picture steps through your code with the current line marked.",
  },
  {
    title: "Real tests in a sandbox",
    body: "Python, JavaScript, Java and C++ run against the problem's tests in isolation. A failure shows the case that broke.",
  },
  {
    title: "A tutor that asks, not tells",
    body: "It reads the chapter and the code in your editor, and walks you toward the answer instead of handing it over.",
  },
] as const;

const CAREER_ITEMS = [
  {
    title: "Interview preparation",
    href: "/prepare",
    body: "Track-by-track preparation that ties each topic back to the chapters and problems behind it.",
  },
  {
    title: "Roadmaps",
    href: "/roadmaps",
    body: "Ordered study plans, so you always know what to work on next and why.",
  },
  {
    title: "Mock interviews",
    href: "/interviews",
    body: "Practise talking through a problem with an AI interviewer. Its feedback is a practice signal, not a hiring assessment.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <Hero />

      <Section id="learn" label="Learn" title="Three courses, written to be understood">
        <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
          Each course runs in dependency order and draws what it explains. Solved
          problems come back on a widening schedule, and how well you recall them sets
          the next interval.
        </p>
        <CourseCards className="mt-10" />
        <p className="mt-8 text-sm text-muted-foreground">
          Prefer to start from a pattern?{" "}
          <TextLink href="/patterns">Browse the algorithm patterns</TextLink>.
        </p>
      </Section>

      <Section id="code" label="Code" title="Watch your code run, line by line">
        <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
          The visualizer is built into every problem. Write a solution, press Run, and
          see what it actually does to the data.
        </p>
        <CodeReplayDemo className="mt-10" />
        <dl className="mt-10 grid border-t border-border sm:grid-cols-2">
          {CODE_POINTS.map((point) => (
            <div
              key={point.title}
              className="border-b border-border py-5 sm:odd:pr-8 sm:even:border-l sm:even:pl-8"
            >
              <dt className="text-sm font-semibold">{point.title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm">
          <TextLink href="/problems">Open the problem set</TextLink>
        </p>
      </Section>

      <Section
        id="career"
        label="Career"
        title="Walk into the interview asking “what shape is this?”"
      >
        <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
          Not “have I seen this exact problem before?” Preparation here is built on the
          same chapters and problems you learn from.
        </p>
        <ul className="mt-10 border-t border-border">
          {CAREER_ITEMS.map((item) => (
            <li key={item.href} className="border-b border-border">
              <Link
                href={route(item.href)}
                className="group grid gap-1 rounded-sm px-1 py-5 transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[14rem_1fr] sm:gap-8"
              >
                <span className="font-display text-xl transition-colors group-hover:text-primary">
                  {item.title}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="campus" label="Campus" title="For colleges, later">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
            We are designing tools for colleges: a shared view of a cohort&rsquo;s
            progress for faculty and placement cells. None of it is available yet, so
            there is nothing to sign up for. Everything an individual learner gets today
            stays free.
          </p>
          <p className="w-fit rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
            In development
          </p>
        </div>
      </Section>

      <section aria-labelledby="loop-heading" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="loop-heading" className="display text-3xl sm:text-4xl">
            The loop every chapter runs you through
          </h2>
          <ol className="mt-10 grid border-t border-border sm:grid-cols-5">
            {LOOP.map((step, index) => (
              <li
                key={step.label}
                className="border-b border-border py-5 sm:border-b-0 sm:px-4 sm:first:pl-0 sm:[&+li]:border-l"
              >
                <span className="text-sm text-primary tabular-nums">{index + 1}</span>
                <h3 className="mt-1 text-base font-semibold">{step.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-20 md:flex-row md:items-end md:justify-between">
          <h2 className="display max-w-xl text-3xl sm:text-4xl">
            Every track, every exercise, both AI features. Free.
          </h2>
          <Button asChild className="h-11 rounded-full px-6 text-base">
            <Link href="/signup">Create your account</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:grid-cols-[1.7fr_1fr] lg:gap-16">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Free for every learner. No paid tier.
          </p>
          <h1
            id="hero-heading"
            className="display mt-6 text-5xl sm:text-6xl lg:text-7xl"
          >
            Master technology.
            <br />
            Build with confidence.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Learn data structures, algorithms and system design from explanations that
            draw what they describe, then practise in an editor that replays your own
            code.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="h-11 rounded-full px-6 text-base">
              <Link href="/signup">Start learning</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full px-6 text-base"
            >
              <Link href="/learn/dsa">Browse the DSA course</Link>
            </Button>
          </div>
        </div>

        <nav aria-label="Contents" className="lg:pt-2">
          <p className="border-b border-border pb-3 text-sm text-muted-foreground">
            Contents
          </p>
          {CONTENTS.map((group) => (
            <div key={group.area} className="border-b border-border py-3">
              <p className="font-display text-lg">
                <a
                  href={`#${group.area.toLowerCase()}`}
                  className="rounded-sm transition-colors hover:text-primary"
                >
                  {group.area}
                </a>
              </p>
              <ul className="mt-1.5 space-y-1">
                {group.entries.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={route(entry.href)}
                      className="group flex items-baseline gap-3 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="group-hover:underline group-hover:underline-offset-4">
                        {entry.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mb-1 flex-1 border-b border-dotted border-border"
                      />
                      <span className="text-xs">{entry.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="py-3">
            <p className="font-display text-lg">
              <a
                href="#campus"
                className="rounded-sm transition-colors hover:text-primary"
              >
                Campus
              </a>
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">In development</p>
          </div>
        </nav>
      </div>
    </section>
  );
}

function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 border-t border-border"
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[10rem_1fr] lg:gap-12">
        <p className="text-sm font-medium text-primary lg:pt-3">{label}</p>
        <div className="min-w-0">
          <h2 id={headingId} className="display text-3xl sm:text-4xl">
            {title}
          </h2>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={route(href)}
      className="rounded-sm font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:decoration-primary"
    >
      {children}
    </Link>
  );
}
