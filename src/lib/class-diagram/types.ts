/**
 * Class diagrams as data.
 *
 * Same argument as the architecture diagrams in Phase 7, and for the same
 * reasons: a picture cannot be themed, cannot be read aloud, cannot be
 * compared against a reference, and cannot be handed to a reviewer as
 * anything but pixels. So a class diagram here is a set of types and the
 * relationships between them, and the SVG is a rendering of that.
 *
 * What is deliberately *different* from the architecture diagram: there,
 * the component palette is closed, because "a cache" is a fixed idea. Here
 * the learner invents the vocabulary — the whole exercise is choosing what
 * `ParkingSpot` should be called and what it should know. So names are
 * free text, and what is constrained instead is the *shape*: which kinds
 * of type exist, which relationships are legal, and how big the thing can
 * get.
 */

/** A class, an interface, an abstract class, or an enum. */
export const TYPE_KINDS = ["class", "abstract", "interface", "enum"] as const;
export type TypeKind = (typeof TYPE_KINDS)[number];

export const TYPE_KIND_LABELS: Record<TypeKind, string> = {
  class: "Class",
  abstract: "Abstract class",
  interface: "Interface",
  enum: "Enum",
};

/** UML stereotype shown above the name, e.g. «interface». */
export const TYPE_KIND_STEREOTYPE: Record<TypeKind, string | null> = {
  class: null,
  abstract: "abstract",
  interface: "interface",
  enum: "enumeration",
};

export const VISIBILITIES = ["public", "protected", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/** UML visibility markers. Rendered before the member name. */
export const VISIBILITY_MARKER: Record<Visibility, string> = {
  public: "+",
  protected: "#",
  private: "-",
};

export type Attribute = {
  name: string;
  /** Free text: `String`, `List<Vehicle>`, `int`. Not parsed, only shown. */
  type: string;
  visibility: Visibility;
  isStatic?: boolean;
};

export type Method = {
  name: string;
  /** Rendered between the parentheses verbatim: `spot: ParkingSpot`. */
  params: string;
  returns: string;
  visibility: Visibility;
  isStatic?: boolean;
  /**
   * Declared but not implemented here. Always true on an interface's
   * methods; optional on an abstract class.
   */
  isAbstract?: boolean;
};

export type DiagramType = {
  id: string;
  kind: TypeKind;
  name: string;
  attributes: Attribute[];
  methods: Method[];
  /** Optional package/module grouping, drawn as a dashed enclosure. */
  group?: string;
};

/**
 * The relationships worth distinguishing.
 *
 * Kept to the six that change how you read a design. Notably absent:
 * "realization" as distinct from implementation, and the various
 * qualified/navigable association refinements — they are real UML but
 * they do not change the answer to "what does this class own, and what
 * does it merely use", which is the question the exercises ask.
 */
export const RELATION_KINDS = [
  "inheritance",
  "implementation",
  "composition",
  "aggregation",
  "association",
  "dependency",
] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];

export const RELATION_LABELS: Record<RelationKind, string> = {
  inheritance: "extends",
  implementation: "implements",
  composition: "is composed of",
  aggregation: "aggregates",
  association: "is associated with",
  dependency: "depends on",
};

/** How each relation reads in a sentence, for the prose description. */
export const RELATION_PHRASE: Record<RelationKind, string> = {
  inheritance: "extends",
  implementation: "implements",
  composition: "owns",
  aggregation: "holds",
  association: "references",
  dependency: "uses",
};

export type Relationship = {
  id: string;
  /** The type that declares the relationship. */
  from: string;
  to: string;
  kind: RelationKind;
  /** Cardinality or role: "1..*", "parks in". */
  label?: string;
};

export type ClassDiagram = {
  types: DiagramType[];
  relationships: Relationship[];
};

export const EMPTY_CLASS_DIAGRAM: ClassDiagram = { types: [], relationships: [] };

/** Starting point when the learner adds a type from the palette. */
export const TYPE_PALETTE: { kind: TypeKind; label: string; hint: string }[] = [
  { kind: "class", label: "Class", hint: "A concrete thing with state and behaviour" },
  {
    kind: "abstract",
    label: "Abstract class",
    hint: "Shared state and behaviour that is never instantiated on its own",
  },
  {
    kind: "interface",
    label: "Interface",
    hint: "A capability, with no state and no implementation",
  },
  { kind: "enum", label: "Enum", hint: "A closed set of named values" },
];
