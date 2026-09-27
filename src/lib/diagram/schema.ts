import { z } from "zod";

import { EMPTY_DIAGRAM, NODE_KINDS, type Diagram } from "./types";

/**
 * Validation for diagram data.
 *
 * Two untrusted sources, both real: a seeded or admin-authored reference
 * architecture read out of a Json column, and a learner's own design
 * arriving from the browser. Neither is trusted, and the parse happens
 * before anything renders or reaches the AI reviewer.
 *
 * Bounds exist because this is a user-writable Json column. Without them a
 * learner — or a script — can store a megabyte of nodes and every page
 * that renders their design pays for it forever.
 */

export const LIMITS = {
  maxNodes: 40,
  maxEdges: 80,
  maxLabel: 60,
  maxNote: 120,
  maxGroup: 40,
  maxId: 64,
} as const;

const idSchema = z
  .string()
  .min(1)
  .max(LIMITS.maxId)
  // Ids end up in SVG `id`/`aria-labelledby` attributes and in the prose
  // description handed to the model; keeping them to a safe alphabet means
  // neither has to escape them.
  .regex(/^[A-Za-z0-9_-]+$/, "Node ids may use letters, digits, - and _ only.");

export const diagramNodeSchema = z.object({
  id: idSchema,
  kind: z.enum(NODE_KINDS),
  label: z.string().max(LIMITS.maxLabel),
  note: z.string().max(LIMITS.maxNote).optional(),
  group: z.string().max(LIMITS.maxGroup).optional(),
});

export const diagramEdgeSchema = z.object({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  label: z.string().max(LIMITS.maxLabel).optional(),
  kind: z.enum(["sync", "async", "replication"]),
});

export const diagramSchema = z
  .object({
    nodes: z.array(diagramNodeSchema).max(LIMITS.maxNodes),
    edges: z.array(diagramEdgeSchema).max(LIMITS.maxEdges),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    for (const node of value.nodes) {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate node id "${node.id}".`,
          path: ["nodes"],
        });
      }
      ids.add(node.id);
    }

    // An edge to a node that does not exist is a bug in whatever produced
    // it, not something to silently tolerate on write. The *renderer*
    // drops dangling edges, because mid-edit they are normal; a stored
    // diagram should never contain one.
    for (const edge of value.edges) {
      if (!ids.has(edge.from) || !ids.has(edge.to)) {
        ctx.addIssue({
          code: "custom",
          message: `Edge "${edge.id}" refers to a node that is not in the diagram.`,
          path: ["edges"],
        });
      }
    }
  });

/**
 * Parses a diagram out of a Json column, degrading to empty.
 *
 * A malformed reference architecture should cost that one lesson its
 * picture, not take the page down — the same policy `parseContent` uses
 * for chapter bodies.
 */
export function parseDiagram(value: unknown, context?: string): Diagram {
  const parsed = diagramSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[diagram] invalid diagram${context ? ` in ${context}` : ""}:`,
      parsed.error.issues.slice(0, 3)
    );
  }
  return EMPTY_DIAGRAM;
}

/** Strict parse, for writes. Throws so a bad save is refused. */
export function assertDiagram(value: unknown): Diagram {
  return diagramSchema.parse(value);
}
