"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { getVisualization } from "./registry";

/**
 * Client boundary for a full-page visualization.
 *
 * The registry holds render functions, which cannot cross the server/client
 * boundary as props — so the key crosses instead and the lookup happens
 * here. The player itself is loaded dynamically because the engine is only
 * needed on pages that actually show one.
 */
const VisualizationPlayer = dynamic(
  () => import("./visualization-player").then((m) => m.VisualizationPlayer),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-xl" /> }
);

export function VisualizationEmbed({
  visualizationKey,
}: {
  visualizationKey: string;
}) {
  const visualization = getVisualization(visualizationKey);
  if (!visualization) return null;

  return <VisualizationPlayer visualization={visualization} allowEditing />;
}
