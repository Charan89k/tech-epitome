"use client";

import { useId } from "react";

import {
  CLASS_LAYOUT,
  describeClassDiagram,
  formatAttribute,
  formatMethod,
  layoutClassDiagram,
  type PositionedType,
} from "@/lib/class-diagram/layout";
import {
  TYPE_KIND_LABELS,
  TYPE_KIND_STEREOTYPE,
  type ClassDiagram,
  type RelationKind,
  type TypeKind,
} from "@/lib/class-diagram/types";
import { cn } from "@/lib/utils";

/**
 * Class diagrams, rendered from data.
 *
 * Inline SVG with a `viewBox` and no intrinsic width, so one layout is
 * legible from 320px to desktop without recomputation — the same
 * approach as the architecture diagram, and the reason the layout is
 * expressed in its own coordinate space.
 *
 * The SVG carries a `title` and a `desc` built from
 * `describeClassDiagram`, so a screen reader hears "Car extends Vehicle.
 * ParkingLot owns ParkingSpot." rather than a list of rectangles. The
 * same prose is offered as real text beneath the picture.
 *
 * Relationship kind is conveyed by arrowhead and line style, never by
 * colour alone — a composition and an aggregation are a filled and a
 * hollow diamond, which survives both greyscale and colour blindness.
 */

const KIND_STYLE: Record<TypeKind, { fill: string; stroke: string; dashed: boolean }> = {
  class: {
    fill: "color-mix(in oklab, var(--ember-500) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--ember-500) 45%, transparent)",
    dashed: false,
  },
  abstract: {
    fill: "color-mix(in oklab, var(--ember-500) 6%, transparent)",
    stroke: "color-mix(in oklab, var(--ember-500) 40%, transparent)",
    dashed: true,
  },
  interface: {
    fill: "color-mix(in oklab, var(--success) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--success) 45%, transparent)",
    dashed: false,
  },
  enum: {
    fill: "color-mix(in oklab, var(--warning) 10%, transparent)",
    stroke: "color-mix(in oklab, var(--warning) 45%, transparent)",
    dashed: false,
  },
};

/** Dashed for the two "does not own" relations, solid otherwise. */
const RELATION_DASH: Record<RelationKind, string | undefined> = {
  inheritance: undefined,
  implementation: "5 3",
  composition: undefined,
  aggregation: undefined,
  association: undefined,
  dependency: "3 3",
};

function fit(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function TypeBox({
  type,
  selected,
  onSelect,
}: {
  type: PositionedType;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const style = KIND_STYLE[type.kind];
  const stereotype = TYPE_KIND_STEREOTYPE[type.kind];
  const interactive = Boolean(onSelect);

  const hasAttributes = type.attributes.length > 0;
  const hasMethods = type.methods.length > 0;

  let cursorY = CLASS_LAYOUT.headerHeight;

  return (
    <g
      transform={`translate(${type.x}, ${type.y})`}
      className={cn(interactive && "cursor-pointer")}
      onClick={interactive ? () => onSelect!(type.id) : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect!(type.id);
              }
            }
          : undefined
      }
      // The kind is announced only when the visible label does not
      // already convey it, so nothing says "Class, Class".
      aria-label={
        interactive
          ? [
              type.name,
              type.name.toLowerCase() === TYPE_KIND_LABELS[type.kind].toLowerCase()
                ? null
                : TYPE_KIND_LABELS[type.kind],
              hasAttributes ? `${type.attributes.length} attributes` : null,
              hasMethods ? `${type.methods.length} methods` : null,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined
      }
    >
      <rect
        width={type.width}
        height={type.height}
        rx={4}
        fill={style.fill}
        stroke={selected ? "var(--ember-500)" : style.stroke}
        strokeWidth={selected ? 2 : 1}
        strokeDasharray={style.dashed ? "6 3" : undefined}
      />

      {stereotype && (
        <text
          x={type.width / 2}
          y={12}
          textAnchor="middle"
          fontSize={7.5}
          fill="var(--muted-foreground)"
          fontStyle="italic"
        >
          «{stereotype}»
        </text>
      )}
      <text
        x={type.width / 2}
        y={stereotype ? 23 : 18}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight={600}
        fill="var(--foreground)"
      >
        {fit(type.name, 22)}
      </text>

      <line
        x1={0}
        y1={CLASS_LAYOUT.headerHeight - 4}
        x2={type.width}
        y2={CLASS_LAYOUT.headerHeight - 4}
        stroke={style.stroke}
        strokeWidth={0.75}
      />

      {type.attributes.map((attribute, i) => {
        const y = cursorY + i * CLASS_LAYOUT.rowHeight + 6;
        return (
          <text
            key={`a-${i}`}
            x={7}
            y={y}
            fontSize={8}
            fill="var(--muted-foreground)"
            fontFamily="var(--font-mono, monospace)"
          >
            {fit(formatAttribute(attribute), 28)}
          </text>
        );
      })}

      {(() => {
        cursorY += type.attributes.length * CLASS_LAYOUT.rowHeight;
        if (hasAttributes && hasMethods) {
          const dividerY = cursorY + 1;
          cursorY += CLASS_LAYOUT.dividerHeight;
          return (
            <line
              x1={0}
              y1={dividerY}
              x2={type.width}
              y2={dividerY}
              stroke={style.stroke}
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
          );
        }
        return null;
      })()}

      {type.methods.map((method, i) => {
        const y = cursorY + i * CLASS_LAYOUT.rowHeight + 6;
        return (
          <text
            key={`m-${i}`}
            x={7}
            y={y}
            fontSize={8}
            fill="var(--foreground)"
            fontFamily="var(--font-mono, monospace)"
            fontStyle={method.isAbstract ? "italic" : undefined}
          >
            {fit(formatMethod(method), 28)}
          </text>
        );
      })}
    </g>
  );
}

/** UML arrowheads. Shape carries the meaning, not colour. */
function Markers({ uid }: { uid: string }) {
  const muted = "var(--muted-foreground)";
  return (
    <defs>
      {/* Hollow triangle: extends / implements */}
      <marker
        id={`${uid}-triangle`}
        viewBox="0 0 12 12"
        refX="11"
        refY="6"
        markerWidth="9"
        markerHeight="9"
        orient="auto-start-reverse"
      >
        <path d="M 1 1 L 11 6 L 1 11 z" fill="var(--card)" stroke={muted} strokeWidth="1" />
      </marker>
      {/* Filled diamond: composition */}
      <marker
        id={`${uid}-diamond-filled`}
        viewBox="0 0 14 10"
        refX="1"
        refY="5"
        markerWidth="10"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 1 5 L 7 1 L 13 5 L 7 9 z" fill={muted} />
      </marker>
      {/* Hollow diamond: aggregation */}
      <marker
        id={`${uid}-diamond-hollow`}
        viewBox="0 0 14 10"
        refX="1"
        refY="5"
        markerWidth="10"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 1 5 L 7 1 L 13 5 L 7 9 z" fill="var(--card)" stroke={muted} strokeWidth="1" />
      </marker>
      {/* Open arrow: association / dependency */}
      <marker
        id={`${uid}-open`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke={muted} strokeWidth="1.3" />
      </marker>
    </defs>
  );
}

function markerFor(uid: string, kind: RelationKind): { end?: string; start?: string } {
  switch (kind) {
    case "inheritance":
    case "implementation":
      return { end: `url(#${uid}-triangle)` };
    case "composition":
      // The diamond sits at the owning end, which is the source.
      return { start: `url(#${uid}-diamond-filled)` };
    case "aggregation":
      return { start: `url(#${uid}-diamond-hollow)` };
    default:
      return { end: `url(#${uid}-open)` };
  }
}

export function ClassDiagramView({
  diagram,
  caption,
  selectedTypeId,
  onSelectType,
  className,
  /** Hides the prose below the picture; it stays inside the SVG. */
  compact = false,
  emptyMessage = "No types yet. Add a class to start the design.",
}: {
  diagram: ClassDiagram;
  caption?: string;
  selectedTypeId?: string | null;
  onSelectType?: (id: string) => void;
  className?: string;
  compact?: boolean;
  emptyMessage?: string;
}) {
  const uid = useId().replace(/[^A-Za-z0-9]/g, "");
  const laidOut = layoutClassDiagram(diagram);
  const description = describeClassDiagram(diagram);

  if (laidOut.types.length === 0) {
    return (
      <div
        className={cn(
          "border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-xs",
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const byId = new Map(laidOut.types.map((t) => [t.id, t]));

  return (
    <figure className={cn("not-prose my-4", className)}>
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <svg
          viewBox={`0 0 ${laidOut.width} ${laidOut.height}`}
          className="h-auto w-full"
          role="img"
          aria-labelledby={`${uid}-title ${uid}-desc`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={`${uid}-title`}>{caption ?? "Class diagram"}</title>
          <desc id={`${uid}-desc`}>{description}</desc>

          <Markers uid={uid} />

          {laidOut.relationships.map((rel) => {
            const from = byId.get(rel.from)!;
            const to = byId.get(rel.to)!;

            const downward = to.y >= from.y;
            const x1 = from.x + from.width / 2;
            const y1 = downward ? from.y + from.height : from.y;
            const x2 = to.x + to.width / 2;
            const y2 = downward ? to.y : to.y + to.height;
            const midY = (y1 + y2) / 2;
            const markers = markerFor(uid, rel.kind);

            return (
              <g key={rel.id}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.6}
                  strokeWidth={1.1}
                  strokeDasharray={RELATION_DASH[rel.kind]}
                  markerEnd={markers.end}
                  markerStart={markers.start}
                />
                {rel.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={midY - 3}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill="var(--muted-foreground)"
                  >
                    {fit(rel.label, 20)}
                  </text>
                )}
              </g>
            );
          })}

          {laidOut.types.map((type) => (
            <TypeBox
              key={type.id}
              type={type}
              selected={selectedTypeId === type.id}
              onSelect={onSelectType}
            />
          ))}
        </svg>
      </div>

      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-xs">{caption}</figcaption>
      )}

      {!compact && (
        <details className="mt-2">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
            Describe this diagram in words
          </summary>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {description}
          </p>
        </details>
      )}
    </figure>
  );
}
