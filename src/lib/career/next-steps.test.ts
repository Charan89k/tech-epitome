import { describe, expect, it } from "vitest";

import { nextSteps } from "./next-steps";

const p = (slug: string, status: "NOT_STARTED" | "ATTEMPTED" | "SOLVED") => ({
  slug,
  title: slug,
  status,
});

describe("track next steps", () => {
  it("puts an unfinished attempt before a fresh problem, then a design", () => {
    const steps = nextSteps({
      problems: [p("a", "SOLVED"), p("b", "NOT_STARTED"), p("c", "ATTEMPTED")],
      systemDesign: [{ slug: "x", title: "x", submitted: false }],
    });
    expect(steps.map((s) => s.href)).toEqual([
      "/problems/c",
      "/problems/b",
      "/system-design/x",
    ]);
  });

  it("suggests a mock interview only once something is solved", () => {
    expect(
      nextSteps({ problems: [p("a", "NOT_STARTED")], systemDesign: [] }).map((s) => s.href)
    ).toEqual(["/problems/a"]);
    expect(
      nextSteps({ problems: [p("a", "SOLVED")], systemDesign: [] }).map((s) => s.href)
    ).toEqual(["/interviews"]);
  });

  it("returns nothing when the track is done and has no designs", () => {
    expect(nextSteps({ problems: [], systemDesign: [] })).toEqual([]);
  });
});
