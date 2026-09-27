import {
  RELATION_PHRASE,
  TYPE_KIND_LABELS,
  VISIBILITY_MARKER,
  type ClassDiagram,
  type DiagramType,
  type Relationship,
} from "./types";

/**
 * Turning a class diagram into coordinates, deterministically.
 *
 * Same reasoning as the architecture layout: no force simulation and no
 * drag canvas, because a picture that moves between renders cannot be
 * compared against a reference, and dragging boxes is unusable on a
 * phone. What differs is the ordering rule. An architecture diagram has a
 * natural direction — requests flow downward. A class diagram's natural
 * direction is *generalisation*: supertypes above subtypes. So tiers come
 * from inheritance and implementation depth, and everything else is
 * placed relative to what it is attached to.
 *
 * Boxes are variable height here, because a class with twelve members is
 * genuinely taller than one with two, and squashing them to a fixed size
 * throws away the visual signal that a class is doing too much.
 */

export const CLASS_LAYOUT = {
  boxWidth: 168,
  /** Name band. */
  headerHeight: 30,
  /** Per attribute or method row. */
  rowHeight: 14,
  /** Divider between the attribute and method compartments. */
  dividerHeight: 6,
  columnGap: 32,
  rowGap: 64,
  padding: 18,
  minBoxHeight: 44,
} as const;

export type PositionedType = DiagramType & {
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
};

export type LaidOutClassDiagram = {
  types: PositionedType[];
  relationships: Relationship[];
  width: number;
  height: number;
};

/** A box is as tall as its contents, with a floor for empty types. */
export function boxHeight(type: DiagramType): number {
  const rows = type.attributes.length + type.methods.length;
  const divider =
    type.attributes.length > 0 && type.methods.length > 0
      ? CLASS_LAYOUT.dividerHeight
      : 0;
  return Math.max(
    CLASS_LAYOUT.minBoxHeight,
    CLASS_LAYOUT.headerHeight + rows * CLASS_LAYOUT.rowHeight + divider + 8
  );
}

/** Relations that mean "the target is more general than the source". */
const GENERALISATION = new Set(["inheritance", "implementation"]);

/**
 * Depth below the most general type.
 *
 * A type with no supertype sits at tier 0. Anything that extends or
 * implements something sits one tier below its deepest supertype. The
 * walk is bounded, so an inheritance cycle — which is invalid, and which
 * `classDiagramDiagnostics` reports separately — terminates instead of
 * spinning.
 */
function assignTiers(diagram: ClassDiagram): Map<string, number> {
  const tiers = new Map<string, number>();
  for (const type of diagram.types) tiers.set(type.id, 0);

  const supertypes = new Map<string, string[]>();
  for (const rel of diagram.relationships) {
    if (!GENERALISATION.has(rel.kind)) continue;
    if (!tiers.has(rel.from) || !tiers.has(rel.to)) continue;
    supertypes.set(rel.from, [...(supertypes.get(rel.from) ?? []), rel.to]);
  }

  const passes = Math.min(diagram.types.length, 12);
  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;
    for (const type of diagram.types) {
      const parents = supertypes.get(type.id);
      if (!parents?.length) continue;
      const deepest = Math.max(...parents.map((id) => tiers.get(id) ?? 0));
      if ((tiers.get(type.id) ?? 0) <= deepest) {
        tiers.set(type.id, deepest + 1);
        moved = true;
      }
    }
    if (!moved) break;
  }

  return tiers;
}

/**
 * Orders types within a tier so related ones sit near each other.
 *
 * Barycentre over the tier above, ties broken on id — the same heuristic
 * as the architecture layout, and stable for the same reason.
 */
function orderWithinTiers(
  byTier: Map<number, DiagramType[]>,
  diagram: ClassDiagram,
  tiers: Map<string, number>
): void {
  const sorted = [...byTier.keys()].sort((a, b) => a - b);
  const indexInTier = new Map<string, number>();

  for (const tier of sorted) {
    const types = byTier.get(tier)!;

    if (tier === sorted[0]) {
      types.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      const barycentre = (type: DiagramType): number => {
        const anchors = diagram.relationships
          .filter((r) => r.from === type.id && (tiers.get(r.to) ?? 0) < tier)
          .map((r) => indexInTier.get(r.to))
          .filter((i): i is number => i !== undefined);
        if (anchors.length === 0) return Number.MAX_SAFE_INTEGER;
        return anchors.reduce((s, i) => s + i, 0) / anchors.length;
      };
      types.sort((a, b) => {
        const diff = barycentre(a) - barycentre(b);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    }

    types.forEach((type, index) => indexInTier.set(type.id, index));
  }
}

export function layoutClassDiagram(diagram: ClassDiagram): LaidOutClassDiagram {
  if (diagram.types.length === 0) {
    return { types: [], relationships: [], width: 0, height: 0 };
  }

  const tiers = assignTiers(diagram);

  const byTier = new Map<number, DiagramType[]>();
  for (const type of diagram.types) {
    const tier = tiers.get(type.id) ?? 0;
    byTier.set(tier, [...(byTier.get(tier) ?? []), type]);
  }
  orderWithinTiers(byTier, diagram, tiers);

  const sortedTiers = [...byTier.keys()].sort((a, b) => a - b);
  const widest = Math.max(...sortedTiers.map((t) => byTier.get(t)!.length));
  const contentWidth =
    widest * CLASS_LAYOUT.boxWidth + (widest - 1) * CLASS_LAYOUT.columnGap;
  const width = contentWidth + CLASS_LAYOUT.padding * 2;

  const positioned: PositionedType[] = [];
  let y = CLASS_LAYOUT.padding;

  sortedTiers.forEach((tier, row) => {
    const types = byTier.get(tier)!;
    const rowWidth =
      types.length * CLASS_LAYOUT.boxWidth +
      (types.length - 1) * CLASS_LAYOUT.columnGap;
    const startX = CLASS_LAYOUT.padding + (contentWidth - rowWidth) / 2;

    // Rows are as tall as their tallest box, so a tier containing one
    // large class does not overlap the tier beneath it.
    const tallest = Math.max(...types.map(boxHeight));

    types.forEach((type, column) => {
      positioned.push({
        ...type,
        tier: row,
        x: startX + column * (CLASS_LAYOUT.boxWidth + CLASS_LAYOUT.columnGap),
        y,
        width: CLASS_LAYOUT.boxWidth,
        height: boxHeight(type),
      });
    });

    y += tallest + CLASS_LAYOUT.rowGap;
  });

  const height = y - CLASS_LAYOUT.rowGap + CLASS_LAYOUT.padding;

  // Relationships naming a missing type are dropped rather than drawn to
  // nowhere. Routine mid-edit: deleting a class leaves its edges behind
  // for one render.
  const ids = new Set(positioned.map((t) => t.id));
  const relationships = diagram.relationships.filter(
    (r) => ids.has(r.from) && ids.has(r.to)
  );

  return { types: positioned, relationships, width, height };
}

// ---------------------------------------------------------------------------
// Prose
// ---------------------------------------------------------------------------

/** `+park(spot: ParkingSpot): Ticket` */
export function formatMethod(method: {
  name: string;
  params: string;
  returns: string;
  visibility: keyof typeof VISIBILITY_MARKER;
  isStatic?: boolean;
}): string {
  const marker = VISIBILITY_MARKER[method.visibility];
  const stat = method.isStatic ? "static " : "";
  const returns = method.returns ? `: ${method.returns}` : "";
  return `${marker}${stat}${method.name}(${method.params})${returns}`;
}

/** `-spots: List<ParkingSpot>` */
export function formatAttribute(attribute: {
  name: string;
  type: string;
  visibility: keyof typeof VISIBILITY_MARKER;
  isStatic?: boolean;
}): string {
  const marker = VISIBILITY_MARKER[attribute.visibility];
  const stat = attribute.isStatic ? "static " : "";
  const type = attribute.type ? `: ${attribute.type}` : "";
  return `${marker}${stat}${attribute.name}${type}`;
}

/**
 * The diagram as prose.
 *
 * Three consumers, all of which need words rather than geometry: screen
 * readers (as the SVG's `desc`), the AI reviewer (as context), and the
 * learner reading it back to check their own understanding.
 *
 * Deliberately written as sentences about structure — "Car extends
 * Vehicle", "ParkingLot owns ParkingSpot" — rather than a field dump,
 * because "a diagram with 7 nodes" tells a blind learner nothing.
 */
export function describeClassDiagram(diagram: ClassDiagram): string {
  if (diagram.types.length === 0) return "The class diagram is empty.";

  const nameOf = (id: string): string =>
    diagram.types.find((t) => t.id === id)?.name ?? id;

  const lines: string[] = [];

  const byKind = {
    interface: diagram.types.filter((t) => t.kind === "interface"),
    abstract: diagram.types.filter((t) => t.kind === "abstract"),
    class: diagram.types.filter((t) => t.kind === "class"),
    enum: diagram.types.filter((t) => t.kind === "enum"),
  };

  const summary = (
    [
      [byKind.class.length, "class", "classes"],
      [byKind.abstract.length, "abstract class", "abstract classes"],
      [byKind.interface.length, "interface", "interfaces"],
      [byKind.enum.length, "enum", "enums"],
    ] as [number, string, string][]
  )
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(", ");

  lines.push(`This design has ${summary}.`);

  // Each type, with what it knows and what it does.
  for (const type of diagram.types) {
    const parts: string[] = [`${type.name} is ${article(TYPE_KIND_LABELS[type.kind])}`];

    if (type.attributes.length > 0) {
      parts.push(
        `holding ${type.attributes.map((a) => a.name).join(", ")}`
      );
    }
    if (type.methods.length > 0) {
      parts.push(
        `with ${type.methods.map((m) => `${m.name}()`).join(", ")}`
      );
    }
    lines.push(`${parts.join(", ")}.`);
  }

  if (diagram.relationships.length === 0) {
    lines.push("No relationships have been drawn between them yet.");
  } else {
    // Grouped by source so the description reads as a walk through the
    // design rather than an unordered edge list.
    const bySource = new Map<string, Relationship[]>();
    for (const rel of diagram.relationships) {
      bySource.set(rel.from, [...(bySource.get(rel.from) ?? []), rel]);
    }

    for (const [from, rels] of bySource) {
      const clauses = rels.map((r) => {
        const phrase = RELATION_PHRASE[r.kind];
        const qualifier = r.label ? ` (${r.label})` : "";
        return `${phrase} ${nameOf(r.to)}${qualifier}`;
      });
      lines.push(`${nameOf(from)} ${joinClauses(clauses)}.`);
    }
  }

  const grouped = diagram.types.filter((t) => t.group);
  if (grouped.length > 0) {
    const groups = [...new Set(grouped.map((t) => t.group!))];
    lines.push(
      "Grouped as " +
        groups
          .map(
            (g) =>
              `${g} containing ${grouped
                .filter((t) => t.group === g)
                .map((t) => t.name)
                .join(", ")}`
          )
          .join("; ") +
        "."
    );
  }

  return lines.join(" ");
}

function article(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun.toLowerCase()}` : `a ${noun.toLowerCase()}`;
}

function joinClauses(clauses: string[]): string {
  if (clauses.length === 1) return clauses[0]!;
  return `${clauses.slice(0, -1).join(", ")} and ${clauses.at(-1)}`;
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export type DiagnosticLevel = "error" | "warning" | "ok";

export type Diagnostic = {
  level: DiagnosticLevel;
  message: string;
  /** Type ids the message refers to, so the UI can highlight them. */
  subjects: string[];
};

/**
 * Deterministic structural checks over a design.
 *
 * These are diagnostics, not a grade. Every one of them is a fact that
 * can be checked by walking the graph — "these two classes have the same
 * name", "this interface is never implemented" — and none of them is a
 * judgement about whether the design is good. A design that produces no
 * warnings is not thereby correct, and the UI must not say it is; that is
 * why there is no score here and no "passed" state, only observations.
 */
export function classDiagramDiagnostics(diagram: ClassDiagram): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (diagram.types.length === 0) return out;

  const nameOf = (id: string) =>
    diagram.types.find((t) => t.id === id)?.name ?? id;

  // --- duplicate names ----------------------------------------------------
  const byName = new Map<string, string[]>();
  for (const type of diagram.types) {
    const key = type.name.trim().toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), type.id]);
  }
  for (const [, ids] of byName) {
    if (ids.length > 1) {
      out.push({
        level: "error",
        message: `Two types are both called "${nameOf(ids[0]!)}". Names have to be unique to be referred to.`,
        subjects: ids,
      });
    }
  }

  // --- dangling relationships --------------------------------------------
  const ids = new Set(diagram.types.map((t) => t.id));
  for (const rel of diagram.relationships) {
    if (!ids.has(rel.from) || !ids.has(rel.to)) {
      out.push({
        level: "error",
        message: `A relationship points at a type that is no longer in the diagram.`,
        subjects: [rel.from, rel.to].filter((id) => ids.has(id)),
      });
    }
  }

  // --- duplicate member signatures ---------------------------------------
  for (const type of diagram.types) {
    const seen = new Map<string, number>();
    for (const method of type.methods) {
      const sig = `${method.name.trim().toLowerCase()}(${method.params.trim()})`;
      seen.set(sig, (seen.get(sig) ?? 0) + 1);
    }
    for (const [sig, count] of seen) {
      if (count > 1) {
        out.push({
          level: "error",
          message: `${type.name} declares ${sig} more than once.`,
          subjects: [type.id],
        });
      }
    }

    const attrs = new Map<string, number>();
    for (const attribute of type.attributes) {
      const key = attribute.name.trim().toLowerCase();
      attrs.set(key, (attrs.get(key) ?? 0) + 1);
    }
    for (const [name, count] of attrs) {
      if (count > 1) {
        out.push({
          level: "error",
          message: `${type.name} declares an attribute called "${name}" more than once.`,
          subjects: [type.id],
        });
      }
    }
  }

  // --- inheritance cycles -------------------------------------------------
  const parents = new Map<string, string[]>();
  for (const rel of diagram.relationships) {
    if (rel.kind !== "inheritance" && rel.kind !== "implementation") continue;
    parents.set(rel.from, [...(parents.get(rel.from) ?? []), rel.to]);
  }
  for (const cycle of findCycles(parents)) {
    out.push({
      level: "error",
      message: `Inheritance cycle: ${cycle.map(nameOf).join(" → ")} → ${nameOf(cycle[0]!)}.`,
      subjects: cycle,
    });
  }

  // --- implementation targets --------------------------------------------
  for (const rel of diagram.relationships) {
    if (rel.kind !== "implementation") continue;
    const target = diagram.types.find((t) => t.id === rel.to);
    if (target && target.kind !== "interface") {
      out.push({
        level: "warning",
        message: `${nameOf(rel.from)} implements ${target.name}, but ${target.name} is ${article(TYPE_KIND_LABELS[target.kind])}. "Implements" is for interfaces; use "extends" for a class.`,
        subjects: [rel.from, rel.to],
      });
    }
  }

  // --- inheritance from an interface --------------------------------------
  for (const rel of diagram.relationships) {
    if (rel.kind !== "inheritance") continue;
    const target = diagram.types.find((t) => t.id === rel.to);
    if (target?.kind === "interface") {
      out.push({
        level: "warning",
        message: `${nameOf(rel.from)} extends the interface ${target.name}. Did you mean "implements"?`,
        subjects: [rel.from, rel.to],
      });
    }
  }

  // --- unimplemented interfaces -------------------------------------------
  const implemented = new Set(
    diagram.relationships
      .filter((r) => r.kind === "implementation")
      .map((r) => r.to)
  );
  for (const type of diagram.types) {
    if (type.kind === "interface" && !implemented.has(type.id)) {
      out.push({
        level: "warning",
        message: `Nothing implements ${type.name}. An interface with no implementation is not yet doing any work.`,
        subjects: [type.id],
      });
    }
  }

  // --- isolated types -----------------------------------------------------
  const connected = new Set(
    diagram.relationships.flatMap((r) => [r.from, r.to])
  );
  for (const type of diagram.types) {
    if (!connected.has(type.id) && diagram.types.length > 1) {
      out.push({
        level: "warning",
        message: `${type.name} is not connected to anything else.`,
        subjects: [type.id],
      });
    }
  }

  // --- concrete dependency where an abstraction exists --------------------
  // The classic Dependency Inversion smell, stated as an observation
  // rather than a verdict: a type depends on a concrete class that is
  // itself an implementation of some interface.
  const implementorOf = new Map<string, string[]>();
  for (const rel of diagram.relationships) {
    if (rel.kind !== "implementation") continue;
    implementorOf.set(rel.from, [...(implementorOf.get(rel.from) ?? []), rel.to]);
  }
  for (const rel of diagram.relationships) {
    if (rel.kind !== "dependency" && rel.kind !== "association") continue;
    const abstractions = implementorOf.get(rel.to);
    if (abstractions?.length) {
      out.push({
        level: "warning",
        message: `${nameOf(rel.from)} depends on the concrete ${nameOf(rel.to)}, which implements ${abstractions.map(nameOf).join(", ")}. Depending on the interface instead would let you swap the implementation.`,
        subjects: [rel.from, rel.to],
      });
    }
  }

  // --- abstraction present ------------------------------------------------
  const hasAbstraction = diagram.types.some(
    (t) => t.kind === "interface" || t.kind === "abstract"
  );
  if (hasAbstraction && implemented.size > 0) {
    out.push({
      level: "ok",
      message: `The design introduces an abstraction that something implements — a seam where behaviour can vary.`,
      subjects: [...implemented],
    });
  }

  return out;
}

/** Depth-first cycle detection over the supertype graph. */
function findCycles(parents: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const reported = new Set<string>();

  function walk(id: string): void {
    const current = state.get(id);
    if (current === "done") return;

    if (current === "visiting") {
      const start = stack.indexOf(id);
      if (start !== -1) {
        const cycle = stack.slice(start);
        // One report per cycle regardless of where it is entered.
        const key = [...cycle].sort().join("|");
        if (!reported.has(key)) {
          reported.add(key);
          cycles.push(cycle);
        }
      }
      return;
    }

    state.set(id, "visiting");
    stack.push(id);
    for (const parent of parents.get(id) ?? []) walk(parent);
    stack.pop();
    state.set(id, "done");
  }

  for (const id of parents.keys()) walk(id);
  return cycles;
}
