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
import { VisualizationEmbed } from "@/components/visualization/visualization-embed";
import { VISUALIZATIONS, getVisualization } from "@/components/visualization/registry";

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-4">
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

      <h1 className="text-2xl font-semibold tracking-tight">
        {visualization.title}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed text-pretty">
        {visualization.description}
      </p>

      <div className="mt-6">
        <VisualizationEmbed visualizationKey={key} />
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        Use the arrow keys to step, space to play or pause, and the Input button
        to run it on your own data.
      </p>
    </div>
  );
}
