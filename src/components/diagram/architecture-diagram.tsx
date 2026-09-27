"use client";

import { useId } from "react";

import { layoutDiagram, type PositionedNode } from "@/lib/diagram/layout";
import { describeDiagram } from "@/lib/diagram/layout";
import { NODE_KIND_LABELS, type Diagram, type NodeKind } from "@/lib/diagram/types";
import { cn } from "@/lib/utils";

/**
 * Architecture diagrams, rendered from data.
 *
 * Inline SVG with a `viewBox` and no fixed pixel width, so the same
 * diagram is legible at 320px and on a desktop without a second layout
 * pass — which is the whole reason the layout is computed in intrinsic
 * coordinates rather than in device pixels.
 *
 * Accessibility is not an afterthought here. The SVG carries a `title` and
 * a `desc` generated from the same prose description the AI reviewer
 * receives, so a screen reader gets "Client -> Load Balancer -> API" as a
 * sentence rather than a hundred unlabelled rectangles. Below the picture
 * the same description is available as real text.
 *
 * Colours come from the existing theme tokens, so the diagram follows dark
 * and light mode without a second palette to maintain.
 */

/** Per-kind accent, all drawn from tokens already in globals.css. */
const KIND_STYLE: Record<NodeKind, { fill: string; stroke: string; text: string }> = {
  client: { fill: "var(--muted)", stroke: "var(--border)", text: "var(--foreground)" },
  cdn: { fill: "var(--muted)", stroke: "var(--border)", text: "var(--foreground)" },
  load_balancer: {
    fill: "color-mix(in oklab, var(--ember-500) 12%, transparent)",
    stroke: "color-mix(in oklab, var(--ember-500) 45%, transparent)",
    text: "var(--foreground)",
  },
  api: {
    fill: "color-mix(in oklab, var(--ember-500) 16%, transparent)",
    stroke: "color-mix(in oklab, var(--ember-500) 55%, transparent)",
    text: "var(--foreground)",
  },
  service: {
    fill: "color-mix(in oklab, var(--ember-500) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--ember-500) 40%, transparent)",
    text: "var(--foreground)",
  },
  worker: { fill: "var(--muted)", stroke: "var(--border)", text: "var(--foreground)" },
  queue: {
    fill: "color-mix(in oklab, var(--warning) 12%, transparent)",
    stroke: "color-mix(in oklab, var(--warning) 45%, transparent)",
    text: "var(--foreground)",
  },
  cache: {
    fill: "color-mix(in oklab, var(--warning) 14%, transparent)",
    stroke: "color-mix(in oklab, var(--warning) 50%, transparent)",
    text: "var(--foreground)",
  },
  database: {
    fill: "color-mix(in oklab, var(--success) 12%, transparent)",
    stroke: "color-mix(in oklab, var(--success) 45%, transparent)",
    text: "var(--foreground)",
  },
  object_storage: {
    fill: "color-mix(in oklab, var(--success) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--success) 38%, transparent)",
    text: "var(--foreground)",
  },
  search: {
    fill: "color-mix(in oklab, var(--success) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--success) 38%, transparent)",
    text: "var(--foreground)",
  },
  external: {
    fill: "transparent",
    stroke: "var(--border)",
    text: "var(--muted-foreground)",
  },
};

/** Truncates to fit the box; SVG text does not wrap on its own. */
function fit(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function NodeBox({
  node,
  selected,
  onSelect,
}: {
  node: PositionedNode;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const style = KIND_STYLE[node.kind];
  const label = node.label || NODE_KIND_LABELS[node.kind];
  const interactive = Boolean(onSelect);

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={cn(interactive && "cursor-pointer")}
      onClick={interactive ? () => onSelect!(node.id) : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect!(node.id);
              }
            }
          : undefined
      }
      // The kind is only announced when it adds something. A freshly added
      // component is labelled with its kind, and "Client, Client" is noise.
      aria-label={
        interactive
          ? [
              label,
              label === NODE_KIND_LABELS[node.kind]
                ? null
                : NODE_KIND_LABELS[node.kind],
              node.note,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined
      }
    >
      <rect
        width={node.width}
        height={node.height}
        rx={8}
        fill={style.fill}
        stroke={selected ? "var(--ember-500)" : style.stroke}
        strokeWidth={selected ? 2 : 1}
        strokeDasharray={node.kind === "external" ? "4 3" : undefined}
      />
      <text
        x={node.width / 2}
        y={node.note ? 22 : 27}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={500}
        fill={style.text}
      >
        {fit(label, 18)}
      </text>
      <text
        x={node.width / 2}
        y={node.note ? 34 : 41}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
        fill="var(--muted-foreground)"
      >
        {fit(NODE_KIND_LABELS[node.kind], 22)}
      </text>
      {node.note && (
        <text
          x={node.width / 2}
          y={45}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="var(--muted-foreground)"
        >
          {fit(node.note, 24)}
        </text>
      )}
    </g>
  );
}

export function ArchitectureDiagram({
  diagram,
  caption,
  selectedNodeId,
  onSelectNode,
  className,
  /** Hides the text description below the picture; it stays in the SVG. */
  compact = false,
}: {
  diagram: Diagram;
  caption?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const uid = useId().replace(/[^A-Za-z0-9]/g, "");
  const laidOut = layoutDiagram(diagram);
  const description = describeDiagram(diagram);

  if (laidOut.nodes.length === 0) {
    return (
      <div
        className={cn(
          "border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-xs",
          className
        )}
      >
        Nothing here yet. Add a component to start the design.
      </div>
    );
  }

  const byId = new Map(laidOut.nodes.map((n) => [n.id, n]));

  return (
    <figure className={cn("not-prose my-4", className)}>
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        {/* A viewBox with no intrinsic width is what makes this responsive:
            the browser scales the whole coordinate space to the container,
            so nothing overflows at 320px. */}
        <svg
          viewBox={`0 0 ${laidOut.width} ${laidOut.height}`}
          className="h-auto w-full"
          role="img"
          aria-labelledby={`${uid}-title ${uid}-desc`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={`${uid}-title`}>{caption ?? "Architecture diagram"}</title>
          <desc id={`${uid}-desc`}>{description}</desc>

          <defs>
            <marker
              id={`${uid}-arrow`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
            </marker>
          </defs>

          {laidOut.edges.map((edge) => {
            const from = byId.get(edge.from)!;
            const to = byId.get(edge.to)!;

            // Anchor on the facing edges of the two boxes so the arrow
            // never disappears underneath a node.
            const downward = to.y >= from.y;
            const x1 = from.x + from.width / 2;
            const y1 = downward ? from.y + from.height : from.y;
            const x2 = to.x + to.width / 2;
            const y2 = downward ? to.y : to.y + to.height;
            const midY = (y1 + y2) / 2;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                  strokeDasharray={
                    edge.kind === "async"
                      ? "5 3"
                      : edge.kind === "replication"
                        ? "2 3"
                        : undefined
                  }
                  markerEnd={`url(#${uid}-arrow)`}
                />
                {edge.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={midY - 3}
                    textAnchor="middle"
                    fontSize={8}
                    fill="var(--muted-foreground)"
                  >
                    {fit(edge.label, 22)}
                  </text>
                )}
              </g>
            );
          })}

          {laidOut.nodes.map((node) => (
            <NodeBox
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onSelect={onSelectNode}
            />
          ))}
        </svg>
      </div>

      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          {caption}
        </figcaption>
      )}

      {/* The same description as real text. A diagram that only exists as
          a picture is unreadable to a screen reader and unquotable by a
          learner taking notes. */}
      {!compact && (
        <details className="mt-2">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
            Describe this diagram in words
          </summary>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </details>
      )}
    </figure>
  );
}
