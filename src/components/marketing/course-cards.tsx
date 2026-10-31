import Link from "next/link";
import {
  MiniDiagram,
  type MiniDiagramKind,
} from "@/components/marketing/mini-diagrams";
import { DSA_COURSE } from "@/data/curriculum";
import type { CourseSeed } from "@/data/curriculum/types";
import { LLD_COURSE } from "@/data/lld";
import { SYSTEM_DESIGN_COURSE } from "@/data/system-design";
import { cn } from "@/lib/utils";

/**
 * The three reader courses as cards, each topped by line art of what the
 * course draws. DSA gets a 2×2 of its core shapes because no single picture
 * stands for it; the design tracks have one canonical picture each.
 */

type Course = {
  href: "/learn/dsa" | "/learn/system-design" | "/learn/lld";
  title: string;
  description: string;
  panels: { kind: MiniDiagramKind; label: string }[];
  /** The seeded course, so the counts on the card are the real ones. */
  seed: CourseSeed;
};

function outline(seed: CourseSeed): string {
  const chapters = seed.sections.reduce((n, s) => n + s.chapters.length, 0);
  return `${seed.sections.length} sections · ${chapters} chapters`;
}

const COURSES: Course[] = [
  {
    href: "/learn/dsa",
    title: "Data Structures & Algorithms",
    description:
      "Complexity, arrays, hashing, pointers, windows, binary search, lists, stacks and recursion, in dependency order, with every step drawn.",
    panels: [
      { kind: "pointers", label: "Two pointers" },
      { kind: "window", label: "Sliding window" },
      { kind: "list", label: "Linked list" },
      { kind: "tree", label: "Trees" },
    ],
    seed: DSA_COURSE,
  },
  {
    href: "/learn/system-design",
    title: "System Design",
    description:
      "Scale, latency, replication, partitioning and consistency — and the trade-offs between them.",
    panels: [{ kind: "architecture", label: "Load balancing" }],
    seed: SYSTEM_DESIGN_COURSE,
  },
  {
    href: "/learn/lld",
    title: "Low-Level Design",
    description:
      "Responsibilities, relationships, SOLID and the design patterns that actually come up, with their costs stated.",
    panels: [{ kind: "classes", label: "Interfaces" }],
    seed: LLD_COURSE,
  },
];

export function CourseCards({ className }: { className?: string }) {
  return (
    <ul className={cn("grid gap-6 md:grid-cols-3", className)}>
      {COURSES.map((course) => (
        <li key={course.href}>
          <Link
            href={course.href}
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors outline-none hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CourseThumb panels={course.panels} />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-xl transition-colors group-hover:text-primary">
                {course.title}
              </h3>
              <p className="mt-1 font-mono text-xs text-subtle-foreground">
                {outline(course.seed)}
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
              <span className="mt-4 text-sm font-medium text-foreground underline decoration-primary/60 underline-offset-4 group-hover:decoration-primary">
                Start the course
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CourseThumb({ panels }: { panels: Course["panels"] }) {
  if (panels.length === 1) {
    const [panel] = panels;
    return (
      <MiniDiagram kind={panel!.kind} className="h-48 border-b border-border p-4" />
    );
  }

  return (
    <div
      className="viz-canvas grid h-48 grid-cols-2 grid-rows-2 gap-2 border-b border-border p-2.5"
      aria-hidden="true"
    >
      {panels.map((panel) => (
        <div
          key={panel.kind}
          className="relative min-h-0 overflow-hidden rounded-md border border-border/70 bg-background/30"
        >
          <p className="absolute top-1 left-1.5 font-mono text-[0.55rem] tracking-wide text-muted-foreground">
            {panel.label}
          </p>
          <MiniDiagram
            kind={panel.kind}
            className="h-full bg-transparent! bg-none! pt-2"
          />
        </div>
      ))}
    </div>
  );
}
