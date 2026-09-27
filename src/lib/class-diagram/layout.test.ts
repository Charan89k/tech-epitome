import { describe, expect, it } from "vitest";

import {
  boxHeight,
  classDiagramDiagnostics,
  describeClassDiagram,
  formatAttribute,
  formatMethod,
  layoutClassDiagram,
} from "./layout";
import type { ClassDiagram, DiagramType } from "./types";

/**
 * The class-diagram engine.
 *
 * Two things are worth asserting here and nothing else is. First, that
 * the picture is stable — a learner compares their design to a reference
 * beside it, so the same data must always draw the same way. Second, that
 * the prose description actually describes the *structure*, because that
 * one string is simultaneously the screen-reader text and the context the
 * AI reviewer reasons over. If it degrades to "a diagram with 7 boxes",
 * blind learners lose the exercise and the reviewer starts inventing.
 */

function t(
  id: string,
  name: string,
  kind: DiagramType["kind"] = "class",
  extra: Partial<DiagramType> = {}
): DiagramType {
  return { id, name, kind, attributes: [], methods: [], ...extra };
}

const parkingLot: ClassDiagram = {
  types: [
    t("vehicle", "Vehicle", "abstract", {
      attributes: [{ name: "plate", type: "String", visibility: "private" }],
    }),
    t("car", "Car"),
    t("bike", "Motorcycle"),
    t("lot", "ParkingLot", "class", {
      methods: [
        {
          name: "park",
          params: "v: Vehicle",
          returns: "Ticket",
          visibility: "public",
        },
      ],
    }),
    t("spot", "ParkingSpot"),
  ],
  relationships: [
    { id: "r1", from: "car", to: "vehicle", kind: "inheritance" },
    { id: "r2", from: "bike", to: "vehicle", kind: "inheritance" },
    { id: "r3", from: "lot", to: "spot", kind: "composition", label: "1..*" },
    { id: "r4", from: "lot", to: "vehicle", kind: "dependency" },
  ],
};

describe("layoutClassDiagram", () => {
  it("returns an empty canvas for an empty diagram", () => {
    const result = layoutClassDiagram({ types: [], relationships: [] });
    expect(result.types).toEqual([]);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it("is deterministic", () => {
    expect(layoutClassDiagram(parkingLot)).toEqual(layoutClassDiagram(parkingLot));
  });

  it("does not depend on the order types were added", () => {
    const shuffled: ClassDiagram = {
      types: [...parkingLot.types].reverse(),
      relationships: [...parkingLot.relationships].reverse(),
    };
    const positions = (d: ReturnType<typeof layoutClassDiagram>) =>
      Object.fromEntries(d.types.map((x) => [x.id, { x: x.x, y: x.y }]));

    expect(positions(layoutClassDiagram(shuffled))).toEqual(
      positions(layoutClassDiagram(parkingLot))
    );
  });

  it("places a supertype above its subtypes", () => {
    const result = layoutClassDiagram(parkingLot);
    const y = Object.fromEntries(result.types.map((x) => [x.id, x.y]));
    expect(y.vehicle).toBeLessThan(y.car!);
    expect(y.vehicle).toBeLessThan(y.bike!);
  });

  it("puts siblings on the same row", () => {
    const result = layoutClassDiagram(parkingLot);
    const car = result.types.find((x) => x.id === "car")!;
    const bike = result.types.find((x) => x.id === "bike")!;
    expect(car.y).toBe(bike.y);
    expect(car.x).not.toBe(bike.x);
  });

  it("makes a box taller when it has more members", () => {
    const small = t("a", "Small");
    const large = t("b", "Large", "class", {
      attributes: Array.from({ length: 6 }, (_, i) => ({
        name: `a${i}`,
        type: "int",
        visibility: "private" as const,
      })),
      methods: Array.from({ length: 6 }, (_, i) => ({
        name: `m${i}`,
        params: "",
        returns: "void",
        visibility: "public" as const,
      })),
    });
    // A class doing too much should *look* like it.
    expect(boxHeight(large)).toBeGreaterThan(boxHeight(small));
  });

  it("does not overlap a tall box with the row beneath it", () => {
    const diagram: ClassDiagram = {
      types: [
        t("base", "Base", "abstract", {
          methods: Array.from({ length: 10 }, (_, i) => ({
            name: `m${i}`,
            params: "",
            returns: "void",
            visibility: "public" as const,
          })),
        }),
        t("sub", "Sub"),
      ],
      relationships: [{ id: "r", from: "sub", to: "base", kind: "inheritance" }],
    };
    const result = layoutClassDiagram(diagram);
    const base = result.types.find((x) => x.id === "base")!;
    const sub = result.types.find((x) => x.id === "sub")!;
    expect(sub.y).toBeGreaterThanOrEqual(base.y + base.height);
  });

  it("terminates on an inheritance cycle", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A"), t("b", "B")],
      relationships: [
        { id: "r1", from: "a", to: "b", kind: "inheritance" },
        { id: "r2", from: "b", to: "a", kind: "inheritance" },
      ],
    };
    const result = layoutClassDiagram(diagram);
    expect(result.types).toHaveLength(2);
    expect(Number.isFinite(result.height)).toBe(true);
  });

  it("drops relationships naming a type that is not present", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A")],
      relationships: [{ id: "r", from: "a", to: "ghost", kind: "association" }],
    };
    expect(layoutClassDiagram(diagram).relationships).toEqual([]);
  });

  it("keeps every box inside the reported canvas", () => {
    const result = layoutClassDiagram(parkingLot);
    for (const box of result.types) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(result.width);
      expect(box.y + box.height).toBeLessThanOrEqual(result.height);
    }
  });
});

describe("member formatting", () => {
  it("renders UML visibility markers", () => {
    expect(
      formatAttribute({ name: "plate", type: "String", visibility: "private" })
    ).toBe("-plate: String");
    expect(
      formatAttribute({ name: "id", type: "int", visibility: "public" })
    ).toBe("+id: int");
    expect(
      formatAttribute({ name: "n", type: "int", visibility: "protected" })
    ).toBe("#n: int");
  });

  it("renders a method signature", () => {
    expect(
      formatMethod({
        name: "park",
        params: "v: Vehicle",
        returns: "Ticket",
        visibility: "public",
      })
    ).toBe("+park(v: Vehicle): Ticket");
  });

  it("marks static members", () => {
    expect(
      formatMethod({
        name: "of",
        params: "",
        returns: "Logger",
        visibility: "public",
        isStatic: true,
      })
    ).toBe("+static of(): Logger");
  });
});

describe("describeClassDiagram", () => {
  it("says so when there is nothing to describe", () => {
    expect(describeClassDiagram({ types: [], relationships: [] })).toMatch(/empty/i);
  });

  it("counts the kinds of type present", () => {
    const text = describeClassDiagram(parkingLot);
    expect(text).toMatch(/4 classes/);
    expect(text).toMatch(/1 abstract class/);
  });

  it("describes relationships as sentences, not an edge list", () => {
    // This is the property that makes the description usable by a screen
    // reader and by the reviewer. "5 nodes, 4 edges" would pass a naive
    // test and be worthless to both.
    const text = describeClassDiagram(parkingLot);
    expect(text).toContain("Car extends Vehicle");
    expect(text).toContain("ParkingLot owns ParkingSpot");
  });

  it("carries relationship labels through", () => {
    expect(describeClassDiagram(parkingLot)).toContain("ParkingSpot (1..*)");
  });

  it("groups several relationships from one type into one sentence", () => {
    const text = describeClassDiagram(parkingLot);
    expect(text).toMatch(/ParkingLot owns ParkingSpot \(1\.\.\*\) and uses Vehicle\./);
  });

  it("names each type's attributes and methods", () => {
    const text = describeClassDiagram(parkingLot);
    expect(text).toContain("Vehicle is an abstract class, holding plate");
    expect(text).toContain("with park()");
  });

  it("says when nothing is connected yet", () => {
    const text = describeClassDiagram({ types: [t("a", "A")], relationships: [] });
    expect(text).toMatch(/No relationships have been drawn/i);
  });

  it("reports groupings", () => {
    const diagram: ClassDiagram = {
      types: [
        t("a", "Auth", "class", { group: "security" }),
        t("b", "Token", "class", { group: "security" }),
      ],
      relationships: [],
    };
    expect(describeClassDiagram(diagram)).toContain(
      "security containing Auth, Token"
    );
  });

  it("distinguishes composition from association in words", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A"), t("b", "B"), t("c", "C")],
      relationships: [
        { id: "r1", from: "a", to: "b", kind: "composition" },
        { id: "r2", from: "a", to: "c", kind: "association" },
      ],
    };
    const text = describeClassDiagram(diagram);
    expect(text).toContain("owns B");
    expect(text).toContain("references C");
  });
});

describe("classDiagramDiagnostics", () => {
  const ids = (d: ReturnType<typeof classDiagramDiagnostics>) =>
    d.map((x) => x.message);

  it("says nothing about an empty diagram", () => {
    expect(classDiagramDiagnostics({ types: [], relationships: [] })).toEqual([]);
  });

  it("flags duplicate type names", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "Order"), t("b", "order")],
      relationships: [],
    };
    const found = classDiagramDiagnostics(diagram);
    expect(found.some((d) => d.level === "error" && /both called/.test(d.message))).toBe(
      true
    );
  });

  it("flags a duplicate method signature", () => {
    const diagram: ClassDiagram = {
      types: [
        t("a", "A", "class", {
          methods: [
            { name: "run", params: "x: int", returns: "void", visibility: "public" },
            { name: "run", params: "x: int", returns: "int", visibility: "public" },
          ],
        }),
      ],
      relationships: [],
    };
    expect(ids(classDiagramDiagnostics(diagram)).some((m) => /more than once/.test(m))).toBe(
      true
    );
  });

  it("allows genuine overloads that differ in parameters", () => {
    const diagram: ClassDiagram = {
      types: [
        t("a", "A", "class", {
          methods: [
            { name: "run", params: "x: int", returns: "void", visibility: "public" },
            { name: "run", params: "x: int, y: int", returns: "void", visibility: "public" },
          ],
        }),
      ],
      relationships: [],
    };
    expect(ids(classDiagramDiagnostics(diagram)).some((m) => /more than once/.test(m))).toBe(
      false
    );
  });

  it("detects an inheritance cycle and reports it once", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A"), t("b", "B"), t("c", "C")],
      relationships: [
        { id: "r1", from: "a", to: "b", kind: "inheritance" },
        { id: "r2", from: "b", to: "c", kind: "inheritance" },
        { id: "r3", from: "c", to: "a", kind: "inheritance" },
      ],
    };
    const cycles = classDiagramDiagnostics(diagram).filter((d) =>
      /Inheritance cycle/.test(d.message)
    );
    expect(cycles).toHaveLength(1);
  });

  it("flags implementing something that is not an interface", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "Car"), t("b", "Vehicle", "abstract")],
      relationships: [{ id: "r", from: "a", to: "b", kind: "implementation" }],
    };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) => /"Implements" is for interfaces/.test(m))
    ).toBe(true);
  });

  it("flags extending an interface", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "Car"), t("b", "Drivable", "interface")],
      relationships: [{ id: "r", from: "a", to: "b", kind: "inheritance" }],
    };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) => /Did you mean "implements"/.test(m))
    ).toBe(true);
  });

  it("flags an interface nothing implements", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "Payable", "interface"), t("b", "Order")],
      relationships: [{ id: "r", from: "b", to: "a", kind: "dependency" }],
    };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) => /Nothing implements Payable/.test(m))
    ).toBe(true);
  });

  it("flags an isolated type", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A"), t("b", "B"), t("c", "Lonely")],
      relationships: [{ id: "r", from: "a", to: "b", kind: "association" }],
    };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) => /Lonely is not connected/.test(m))
    ).toBe(true);
  });

  it("does not call a single type isolated", () => {
    const diagram: ClassDiagram = { types: [t("a", "Only")], relationships: [] };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) => /not connected/.test(m))
    ).toBe(false);
  });

  it("notices a dependency on a concrete class that implements an interface", () => {
    const diagram: ClassDiagram = {
      types: [
        t("gw", "PaymentGateway", "interface"),
        t("stripe", "StripeGateway"),
        t("proc", "PaymentProcessor"),
      ],
      relationships: [
        { id: "r1", from: "stripe", to: "gw", kind: "implementation" },
        { id: "r2", from: "proc", to: "stripe", kind: "dependency" },
      ],
    };
    expect(
      ids(classDiagramDiagnostics(diagram)).some((m) =>
        /depends on the concrete StripeGateway/.test(m)
      )
    ).toBe(true);
  });

  it("acknowledges an abstraction that is actually used", () => {
    const diagram: ClassDiagram = {
      types: [t("i", "Payable", "interface"), t("c", "Invoice")],
      relationships: [{ id: "r", from: "c", to: "i", kind: "implementation" }],
    };
    const ok = classDiagramDiagnostics(diagram).filter((d) => d.level === "ok");
    expect(ok.length).toBeGreaterThan(0);
  });

  it("never emits a score", () => {
    // Diagnostics are observations. A number here would invite ranking
    // one learner's design above another's, which this product does not do.
    for (const d of classDiagramDiagnostics(parkingLot)) {
      expect(d.message).not.toMatch(/\b\d+\s*(\/|out of|%)/);
      expect(d.message).not.toMatch(/\bscore\b/i);
    }
  });

  it("carries the subjects a message refers to, for highlighting", () => {
    const diagram: ClassDiagram = {
      types: [t("a", "A"), t("b", "B")],
      relationships: [{ id: "r", from: "a", to: "b", kind: "implementation" }],
    };
    const found = classDiagramDiagnostics(diagram);
    expect(found.every((d) => Array.isArray(d.subjects))).toBe(true);
  });
});
