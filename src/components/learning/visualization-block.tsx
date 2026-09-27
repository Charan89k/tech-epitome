"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { getVisualization } from "@/components/visualization/registry";

/**
 * Embeds a registered visualization inside a lesson.
 *
 * The player is loaded dynamically so a chapter that embeds one does not
 * pull the engine into the bundle of every chapter that does not. An
 * unknown key renders a visible message rather than throwing — a typo in
 * content should degrade one block, not the page.
 */
const VisualizationPlayer = dynamic(
  () =>
    import("@/components/visualization/visualization-player").then(
      (module) => module.VisualizationPlayer
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="my-6 h-80 w-full rounded-lg" />,
  }
);

export function VisualizationBlock({
  visualizationKey,
  title,
  input,
}: {
  visualizationKey: string;
  title?: string;
  input?: unknown;
}) {
  const visualization = getVisualization(visualizationKey);

  if (!visualization) {
    return (
      <div className="not-prose border-border text-muted-foreground my-6 rounded-lg border border-dashed p-4 text-sm">
        No visualization is registered under{" "}
        <code className="font-mono">{visualizationKey}</code>.
      </div>
    );
  }

  return (
    <figure className="not-prose my-6">
      <VisualizationPlayer
        visualization={visualization}
        initialInput={input}
        allowEditing
      />
      {title && (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
