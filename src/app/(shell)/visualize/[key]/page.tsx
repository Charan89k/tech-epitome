import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { diagramFor } from "@/components/learning/diagram-for";
import { MiniDiagram } from "@/components/marketing/mini-diagrams";
import { VisualizationEmbed } from "@/components/visualization/visualization-embed";
import { VISUALIZATIONS, getVisualization } from "@/components/visualization/registry";
import { route } from "@/lib/utils";

export function generateStaticParams() {
  return Object.keys(VISUALIZATIONS).map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: PageProps<"/visualize/[key]">): Promise<Metadata> {
  const { key } = await params;
  const visualization = getVisualization(key);
  if (!visualization) return { title: "Visualization not found" };

  return {
    title: visualization.title,
    description: visualization.description,
    alternates: { canonical: `/visualize/${key}` },
  };
}

export default async function VisualizePage({
  params,
}: PageProps<"/visualize/[key]">) {
  const { key } = await params;
  const visualization = getVisualization(key);

  if (!visualization) notFound();

  const others = Object.values(VISUALIZATIONS).filter((v) => v.key !== key);
  const kbd =
    "bg-muted border-border text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[0.65rem]";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/visualize">Visualize</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{visualization.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="max-w-3xl">
        <h1 className="tracking-headline text-2xl font-bold sm:text-3xl">
          {visualization.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty sm:text-base">
          {visualization.description}
        </p>
      </header>

      <div className="mt-6">
        <VisualizationEmbed visualizationKey={key} />
      </div>

      <p className="text-muted-foreground mt-4 text-xs leading-loose">
        Use <kbd className={kbd}>←</kbd> <kbd className={kbd}>→</kbd> to step,{" "}
        <kbd className={kbd}>Space</kbd> to play or pause, and the Input button to
        run it on your own data.
      </p>

      {others.length > 0 && (
        <section aria-labelledby="more-visuals" className="mt-12">
          <h2 id="more-visuals" className="tracking-headline text-lg font-semibold">
            More visualizations
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other, index) => (
              <li key={other.key}>
                <Link
                  href={route(`/visualize/${other.key}`)}
                  className="border-border bg-card hover:border-ember-500/40 group flex h-full overflow-hidden rounded-xl border transition-colors"
                >
                  <MiniDiagram
                    kind={diagramFor(other.key, index)}
                    className="border-border w-24 shrink-0 border-r"
                  />
                  <div className="min-w-0 flex-1 p-3">
                    <p className="group-hover:text-ember-200 truncate text-sm font-semibold transition-colors">
                      {other.title}
                    </p>
                    <p className="text-muted-foreground mt-1 font-mono text-[0.65rem]">
                      {other.complexity.time} time
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
