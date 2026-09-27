import type { Metadata } from "next";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
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
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Visualize"
        description="Play, pause and step through an algorithm while watching its state, its variables and the line it is executing. Every frame comes from actually running the code, so what you see is what happens."
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {visualizations.map((visualization) => (
          <li key={visualization.key}>
            <Link
              href={route(`/visualize/${visualization.key}`)}
              className="border-border bg-card hover:border-ember-500/35 flex h-full flex-col rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <PlayCircle
                  className="text-ember-500 mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-medium">{visualization.title}</h2>
              </div>
              <p className="text-muted-foreground mt-2 flex-1 text-xs leading-relaxed">
                {visualization.description}
              </p>
              <p className="text-muted-foreground/70 mt-3 font-mono text-[0.68rem]">
                {visualization.complexity.time} time · {visualization.complexity.space} space
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
