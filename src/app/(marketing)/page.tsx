import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardCheck,
  Code2,
  Eye,
  FlaskConical,
  GraduationCap,
  LineChart,
  ListChecks,
  Map as MapIcon,
  MessageSquare,
  Repeat,
  ShieldCheck,
  Shapes,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CodeReplayDemo } from "@/components/marketing/code-replay-demo";
import { CourseCards } from "@/components/marketing/course-cards";
import { Button } from "@/components/ui/button";
import { DSA_COURSE } from "@/data/curriculum";
import { LLD_COURSE } from "@/data/lld";
import { PATTERNS } from "@/data/patterns";
import { PROBLEMS } from "@/data/problems";
import { SYSTEM_DESIGN_COURSE } from "@/data/system-design";
import { site } from "@/lib/site";
import { cn, route } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * The public landing page. Every figure is counted from the seeded content
 * in src/data (the same source the database is seeded from), every link goes
 * to a route that exists, and the code panel is a labelled preview that
 * replays a fixed example in the browser; it never runs visitor code.
 * Campus has no sign-up call to action because a college is set up by the
 * platform team, not self-served.
 */

const COURSES = [DSA_COURSE, SYSTEM_DESIGN_COURSE, LLD_COURSE];
const FACTS = [
  { value: COURSES.length, label: "courses" },
  {
    value: COURSES.reduce(
      (n, c) => n + c.sections.reduce((m, s) => m + s.chapters.length, 0),
      0
    ),
    label: "chapters",
  },
  { value: PROBLEMS.length, label: "problems" },
  { value: PATTERNS.length, label: "patterns" },
];

type Feature = { icon: LucideIcon; title: string; body: string; href?: string };

const CODE_POINTS: Feature[] = [
  {
    icon: Eye,
    title: "Every problem draws its input",
    body: "The array, list or grid from the sample is on screen before you write a line.",
  },
  {
    icon: Repeat,
    title: "Your own solution, replayed",
    body: "Run Python or JavaScript and the picture steps through your code with the current line marked. Tracing runs in your browser.",
  },
  {
    icon: FlaskConical,
    title: "Real tests on an isolated service",
    body: "Python, JavaScript, Java and C++ run against the problem's tests away from the web server. A failure shows the case that broke; if the service is off, the editor says so.",
  },
  {
    icon: Sparkles,
    title: "A tutor that asks, not tells",
    body: "It reads the chapter and the code in your editor, and walks you toward the answer instead of handing it over.",
  },
];

const CAMPUS_ITEMS: Feature[] = [
  {
    icon: BookOpen,
    title: "Classes and assignments",
    body: "Assign chapters, courses or problems with a due date. Progress comes from the work itself.",
  },
  {
    icon: ClipboardCheck,
    title: "Assessments",
    body: "Multiple-choice and coding questions from reusable banks, with server-enforced time windows and autosave.",
  },
  {
    icon: ShieldCheck,
    title: "Grading and records",
    body: "Grade and release results; every change to grades and membership is kept in an audit trail.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    body: "Participation and median scores per class from real attempts. No data shows a dash, never a zero.",
  },
  {
    icon: MessageSquare,
    title: "Mock interviews",
    body: "Students talk a problem through with an AI interviewer. Its feedback quotes their answers and is a practice signal, not a hiring assessment.",
  },
  {
    icon: ListChecks,
    title: "Interview preparation",
    body: "Preparation tracks for the shapes interview loops come in, tied back to the chapters and problems behind each topic.",
  },
  {
    icon: MapIcon,
    title: "Roadmaps",
    body: "Ordered study plans built from the courses, so students always know what to work on next.",
  },
  {
    icon: Shapes,
    title: "Practice from Learn",
    body: "Faculty assign the same courses, patterns and problems individual learners use, so nothing is duplicated.",
  },
];

/** The learning loop every chapter runs. A real sequence, so it is numbered. */
const LOOP: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Eye, label: "See", detail: "A worked example, stepped one frame at a time." },
  {
    icon: Brain,
    label: "Recognise",
    detail: "The clues that tell you which pattern applies.",
  },
  {
    icon: Code2,
    label: "Practise",
    detail: "A guided problem, then one with no scaffolding.",
  },
  {
    icon: MessageSquare,
    label: "Explain",
    detail: "Say why it works, and what it costs.",
  },
  {
    icon: Repeat,
    label: "Recall",
    detail: "Spaced revision, scheduled from how well you remembered.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Hero />

      <Section
        id="learn"
        index={1}
        label="Learn"
        title="Three courses, written to be understood"
        intro="Each course runs in dependency order and draws what it explains. Chapters end with a quick check, and the problems you solve come back for revision."
        action={{ href: "/learn", text: "All courses" }}
      >
        <CourseCards />
        <p className="mt-6 text-sm text-muted-foreground">
          Prefer to start from a pattern?{" "}
          <TextLink href="/patterns">
            Browse the {PATTERNS.length} algorithm patterns
          </TextLink>
        </p>
      </Section>

      <Section
        id="code"
        index={2}
        label="Practice"
        title="Write it, run it, watch it work"
        intro="The editor, the tests and the visualizer sit side by side on every problem."
        action={{ href: "/problems", text: "Open the problem set" }}
      >
        <FeatureGrid items={CODE_POINTS} columns={2} />
      </Section>

      <Section
        id="campus"
        index={3}
        label="Campus"
        title="Campus: the college edition"
        intro="Everything in Learn, run by your college: faculty assign courses and problems, set timed exams and grade them, and students prepare for placements with mock interviews, preparation tracks and roadmaps. Personal notes and highlights stay private; the college only sees the work it assigns."
      >
        <FeatureGrid items={CAMPUS_ITEMS} columns={4} />
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-brand-300">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            Colleges are set up by the Tech Epitome team. Faculty and students join by
            invitation or by verifying a college email.
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
          >
            <Link href="/campus">
              <Users className="size-4" aria-hidden="true" />
              Open your college workspace
            </Link>
          </Button>
        </div>
      </Section>

      <LearningLoop />

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-mono tracking-wider uppercase">05 / Start</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">
                Every course, every problem. Free.
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                No paid tier, no card. Create an account to save your progress, notes
                and revision schedule.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 shrink-0 px-5 text-base">
              <Link href="/signup">
                Create your account
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        <div>
          <p className="flex items-center gap-2 label-mono">
            <span className="size-1.5 bg-primary" aria-hidden="true" />
            Free for every learner. No paid tier.
          </p>
          <h1
            id="hero-heading"
            className="display mt-6 text-5xl sm:text-6xl lg:text-5xl xl:text-[3.25rem]"
          >
            Master technology.
            <br />
            <span className="text-brand-300">Build with confidence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Learn data structures, algorithms and system design from explanations that
            draw what they describe, then practise in an editor that replays your own
            code. Colleges get Campus: exams, assignments and interview preparation on
            top.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 px-5 text-base">
              <Link href="/signup">
                Start learning
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
              <Link href="/learn">Explore the courses</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-4 gap-4 border-t border-border pt-6">
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="label-mono">{fact.label}</dt>
                <dd className="mt-1 font-mono text-2xl font-medium tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="min-w-0">
          <CodeReplayDemo className="shadow-raised" />
          <figcaption className="mt-3 text-xs text-subtle-foreground">
            A preview of the visualizer: a fixed example replayed in your browser. On a
            problem, it replays the code you wrote.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Section({
  id,
  index,
  label,
  title,
  intro,
  action,
  children,
}: {
  id: string;
  index: number;
  label: string;
  title: string;
  intro: string;
  action?: { href: string; text: string };
  children: React.ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 border-t border-border"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="label-mono tracking-wider uppercase">
              <span className="text-brand-300">{String(index).padStart(2, "0")}</span> /{" "}
              {label}
            </p>
            <h2 id={headingId} className="display mt-3 text-3xl sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
              {intro}
            </p>
          </div>
          {action && (
            <Link
              href={route(action.href)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-medium text-foreground transition-colors outline-none hover:text-brand-300 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {action.text}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function FeatureGrid({ items, columns }: { items: Feature[]; columns: 2 | 4 }) {
  return (
    <ul
      className={cn(
        "grid gap-x-8 gap-y-8",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {items.map((item) => (
        <li key={item.title}>
          <FeatureCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function FeatureCard({ item }: { item: Feature }) {
  const Icon = item.icon;
  const body = (
    <>
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon className="size-4 shrink-0 text-brand-300" aria-hidden="true" />
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {item.body}
      </p>
      {item.href && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-300">
          Open
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      )}
    </>
  );
  const frame = "flex h-full flex-col border-t border-border pt-4";
  if (!item.href) return <div className={frame}>{body}</div>;
  return (
    <Link
      href={route(item.href)}
      className={cn(
        frame,
        "group transition-colors outline-none hover:border-brand-500/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      {body}
    </Link>
  );
}

function LearningLoop() {
  return (
    <section aria-labelledby="loop-heading" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="label-mono tracking-wider uppercase">
          <span className="text-brand-300">04</span> / How a chapter works
        </p>
        <h2 id="loop-heading" className="display mt-3 text-3xl sm:text-4xl">
          The loop every chapter runs you through
        </h2>
        <ol className="relative mt-10 grid gap-6 md:grid-cols-5 md:gap-4">
          {/* The connecting rail: vertical on small screens, horizontal from md. */}
          <span
            aria-hidden="true"
            className="absolute top-5 bottom-5 left-5 w-px bg-border md:top-5 md:right-[10%] md:bottom-auto md:left-[10%] md:h-px md:w-auto"
          />
          {LOOP.map(({ icon: Icon, label, detail }, index) => (
            <li
              key={label}
              className="relative flex gap-4 md:flex-col md:items-center md:text-center"
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-brand-300">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  <span className="mr-1.5 font-mono text-subtle-foreground tabular-nums">
                    {index + 1}
                  </span>
                  {label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
