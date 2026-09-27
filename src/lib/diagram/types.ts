/**
 * Architecture diagrams as data.
 *
 * A screenshot of an architecture is worth very little to a learner: it
 * cannot be themed, cannot be read by a screen reader, cannot be diffed
 * against what the learner drew, and cannot be handed to the AI reviewer as
 * anything but pixels. So a diagram here is nodes and edges, and the SVG is
 * a rendering of that data rather than the source of truth.
 *
 * The same shape serves three jobs: reference architectures embedded in
 * lessons, the learner's own design in the workspace, and the structured
 * context the AI reviewer receives. One representation, three consumers.
 */

/**
 * The component vocabulary.
 *
 * Deliberately closed. An open-ended "any box with any label" palette
 * produces diagrams that cannot be reasoned about — the reviewer cannot
 * tell a cache from a queue, and neither can a grader. A fixed set means
 * "you put a cache in front of the database" is a checkable statement.
 */
export const NODE_KINDS = [
  "client",
  "cdn",
  "load_balancer",
  "api",
  "service",
  "worker",
  "queue",
  "cache",
  "database",
  "object_storage",
  "search",
  "external",
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];

export const NODE_KIND_LABELS: Record<NodeKind, string> = {
  client: "Client",
  cdn: "CDN",
  load_balancer: "Load Balancer",
  api: "API Server",
  service: "Service",
  worker: "Worker",
  queue: "Queue",
  cache: "Cache",
  database: "Database",
  object_storage: "Object Storage",
  search: "Search Index",
  external: "External Service",
};

/**
 * Where each kind naturally sits in a request path.
 *
 * Used by the layout to place nodes without asking the learner to drag
 * boxes into a pleasing arrangement — the teaching point is *what talks to
 * what*, not draughtsmanship, and a free canvas on a phone is unusable.
 */
export const NODE_KIND_TIER: Record<NodeKind, number> = {
  client: 0,
  cdn: 1,
  load_balancer: 1,
  api: 2,
  service: 3,
  cache: 4,
  queue: 4,
  worker: 5,
  database: 6,
  object_storage: 6,
  search: 6,
  external: 5,
};

export type DiagramNode = {
  id: string;
  kind: NodeKind;
  /** Shown in the box. Falls back to the kind's label when empty. */
  label: string;
  /** Optional one-line annotation: "write-through", "8 shards". */
  note?: string;
  /** Optional grouping, rendered as a dashed enclosure. */
  group?: string;
};

export type EdgeKind = "sync" | "async" | "replication";

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  /** "GET /v1/links", "publish", "read replica". */
  label?: string;
  kind: EdgeKind;
};

export type Diagram = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export const EMPTY_DIAGRAM: Diagram = { nodes: [], edges: [] };

/** Palette entry for the workspace's "add a component" control. */
export type PaletteEntry = { kind: NodeKind; label: string; hint: string };

export const PALETTE: PaletteEntry[] = [
  { kind: "client", label: "Client", hint: "Browser, mobile app, or API consumer" },
  { kind: "cdn", label: "CDN", hint: "Caches static assets near the user" },
  { kind: "load_balancer", label: "Load Balancer", hint: "Spreads traffic across instances" },
  { kind: "api", label: "API Server", hint: "Terminates requests, validates, routes" },
  { kind: "service", label: "Service", hint: "A bounded piece of business logic" },
  { kind: "cache", label: "Cache", hint: "In-memory store in front of slower storage" },
  { kind: "queue", label: "Queue", hint: "Decouples producers from consumers" },
  { kind: "worker", label: "Worker", hint: "Consumes queued work asynchronously" },
  { kind: "database", label: "Database", hint: "Durable system of record" },
  { kind: "object_storage", label: "Object Storage", hint: "Large blobs: files, video, backups" },
  { kind: "search", label: "Search Index", hint: "Inverted index for text queries" },
  { kind: "external", label: "External Service", hint: "A third party you do not control" },
];
