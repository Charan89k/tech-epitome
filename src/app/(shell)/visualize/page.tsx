import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { diagramFor } from "@/components/learning/diagram-for";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { VISUALIZATIONS } from "@/components/visualization/registry";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Visualize",
  description:
    "Step through algorithms frame by frame. Every frame is produced by actually running the algorithm, not choreographed.",
  alternates: { canonical: "/visualize" },
};

export default function VisualizeIndexPage() {
  const visualizations = Object.values(VISUALIZATIONS);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="max-w-3xl">
        <p className="text-ember-400 text-[0.68rem] font-medium tracking-wider uppercase">
          Live visuals
        </p>
        <h1 className="tracking-headline mt-2 text-2xl font-bold sm:text-3xl">Visualize</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty sm:text-base">
          Play, pause and step through an algorithm while watching its state, its
          variables and the line it is executing. Every frame comes from actually
          running the code, so what you see is what happens.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visualizations.map((visualization, index) => (
          <li key={visualization.key}>
            <Link
              href={route(`/visualize/${visualization.key}`)}
              className="border-border bg-card hover:border-ember-500/40 group flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
            >
              <MiniDiagram
                kind={diagramFor(visualization.key, index)}
                className="border-border h-32 border-b"
              />
              <div className="flex flex-1 flex-col p-4">
                <h2 className="group-hover:text-ember-200 text-base font-semibold transition-colors">
                  {visualization.title}
                </h2>
                <p className="text-muted-foreground mt-1 line-clamp-3 flex-1 text-xs leading-relaxed">
                  {visualization.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap gap-1.5 font-mono text-[0.65rem]">
                    <span className="bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">
                      {visualization.complexity.time} time
                    </span>
                    <span className="bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">
                      {visualization.complexity.space} space
                    </span>
                  </div>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-ember-400 size-4 shrink-0 transition-all group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
