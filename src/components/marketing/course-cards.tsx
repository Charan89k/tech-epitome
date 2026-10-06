import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  MiniDiagram,
  type MiniDiagramKind,
} from "@/components/marketing/mini-diagrams";

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
};

const COURSES: Course[] = [
  {
    href: "/learn/dsa",
    title: "Data Structures & Algorithms",
    description:
      "Complexity analysis through advanced dynamic programming, in dependency order, with every step drawn.",
    panels: [
      { kind: "pointers", label: "Two pointers" },
      { kind: "window", label: "Sliding window" },
      { kind: "list", label: "Linked list" },
      { kind: "tree", label: "Trees" },
    ],
  },
  {
    href: "/learn/system-design",
    title: "System Design",
    description:
      "Scale, latency, replication, partitioning and consistency — and the trade-offs between them.",
    panels: [{ kind: "architecture", label: "Load balancing" }],
  },
  {
    href: "/learn/lld",
    title: "Low-Level Design",
    description:
      "Responsibilities, relationships, SOLID and the design patterns that actually come up, with their costs stated.",
    panels: [{ kind: "classes", label: "Interfaces" }],
  },
];

export function CourseCards() {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {COURSES.map((course) => (
        <li key={course.href}>
          <Link
            href={course.href}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors outline-none hover:border-ember-500/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CourseThumb panels={course.panels} />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-base font-semibold transition-colors group-hover:text-ember-200">
                {course.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ember-300">
                Start the course
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
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
