import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BeforeAfterCard } from "./before-after-card";
import { ComparisonCard } from "./comparison-card";
import { blockToPlainText } from "@/types/content";
import { assertContent, parseContent } from "@/lib/validation/content";

/**
 * The two visual blocks added for the write-pointer chapter.
 *
 * Three things are worth pinning: they render the data they are given, they
 * stay readable without colour, and they reach the search index. The last
 * one matters more than it looks — a block that renders beautifully and
 * indexes as an empty string is invisible to search and to highlights.
 */

const BEFORE = { label: "Input", values: ["0", "1", "0", "3", "12"] };
const AFTER = { label: "After compacting", values: ["1", "3", "12", "0", "0"] };

describe("BeforeAfterCard", () => {
  it("renders both rows of values", () => {
    render(<BeforeAfterCard before={BEFORE} after={AFTER} />);

    for (const value of ["0", "1", "3", "12"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("After compacting")).toBeInTheDocument();
  });

  it("renders the title and note when given", () => {
    render(
      <BeforeAfterCard
        before={BEFORE}
        after={AFTER}
        title="Moving every zero to the end"
        note="Order is preserved."
      />
    );
    expect(screen.getByText("Moving every zero to the end")).toBeInTheDocument();
    expect(screen.getByText("Order is preserved.")).toBeInTheDocument();
  });

  it("is a figure, so the whole thing is one unit to a screen reader", () => {
    const { container } = render(<BeforeAfterCard before={BEFORE} after={AFTER} />);
    expect(container.querySelector("figure")).not.toBeNull();
    expect(container.querySelector("figcaption")).not.toBeNull();
  });

  it("handles rows of different lengths", () => {
    // A filter legitimately produces fewer values than it consumed.
    render(
      <BeforeAfterCard
        before={{ label: "In", values: ["1", "2", "3", "4"] }}
        after={{ label: "Out", values: ["2", "4"] }}
      />
    );
    expect(screen.getByText("In")).toBeInTheDocument();
    expect(screen.getByText("Out")).toBeInTheDocument();
  });
});

describe("ComparisonCard", () => {
  const OPTIONS = [
    {
      label: "Build a new array",
      time: "O(n)",
      space: "O(n)",
      when: "The input must not be mutated.",
    },
    {
      label: "Write pointer, in place",
      time: "O(n)",
      space: "O(1)",
      when: "O(1) extra space is required.",
      preferred: true,
    },
  ];

  it("renders every option with its cost and its when", () => {
    render(<ComparisonCard options={OPTIONS} title="Two ways to filter" />);

    expect(screen.getByText("Two ways to filter")).toBeInTheDocument();
    for (const option of OPTIONS) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
      expect(screen.getByText(option.when)).toBeInTheDocument();
    }
    expect(screen.getByText("O(1)")).toBeInTheDocument();
  });

  it("marks the preferred option with words, not only colour", () => {
    render(<ComparisonCard options={OPTIONS} />);

    // The marker is text, so it survives a monochrome or high-contrast view.
    const marker = screen.getByText("Taught here");
    expect(marker).toBeInTheDocument();

    const preferred = marker.closest("li")!;
    expect(within(preferred).getByText("Write pointer, in place")).toBeInTheDocument();
  });

  it("does not mark anything when no option is preferred", () => {
    render(
      <ComparisonCard options={OPTIONS.map(({ ...o }) => ({ ...o, preferred: false }))} />
    );
    expect(screen.queryByText("Taught here")).not.toBeInTheDocument();
  });

  it("gives the list an accessible name", () => {
    render(<ComparisonCard options={OPTIONS} title="Two ways to filter" />);
    expect(
      screen.getByRole("region", { name: "Two ways to filter" })
    ).toBeInTheDocument();
  });
});

describe("search and highlight projection", () => {
  it("indexes the values a before/after block shows", () => {
    const text = blockToPlainText({
      type: "beforeAfter",
      title: "Compacting",
      before: BEFORE,
      after: AFTER,
      note: "Order preserved.",
    });

    expect(text).toContain("Compacting");
    expect(text).toContain("0 1 0 3 12");
    expect(text).toContain("1 3 12 0 0");
    expect(text).toContain("Order preserved.");
  });

  it("indexes every approach in a comparison block", () => {
    const text = blockToPlainText({
      type: "comparison",
      title: "Two ways to filter",
      options: [
        { label: "New array", time: "O(n)", space: "O(n)", when: "Immutable input." },
        { label: "In place", time: "O(n)", space: "O(1)", when: "Tight space." },
      ],
    });

    expect(text).toContain("New array");
    expect(text).toContain("In place");
    expect(text).toContain("O(1)");
    expect(text).toContain("Tight space.");
  });

  it("never returns an empty projection, which would hide the block", () => {
    const minimal = blockToPlainText({
      type: "beforeAfter",
      before: { label: "A", values: ["1"] },
      after: { label: "B", values: ["2"] },
    });
    expect(minimal.trim().length).toBeGreaterThan(0);
  });
});

describe("validation", () => {
  it("accepts a well-formed pair of blocks", () => {
    const parsed = parseContent([
      { type: "beforeAfter", before: BEFORE, after: AFTER },
      {
        type: "comparison",
        options: [
          { label: "A", time: "O(n)", space: "O(n)", when: "x" },
          { label: "B", time: "O(n)", space: "O(1)", when: "y", preferred: true },
        ],
      },
    ]);
    expect(parsed).toHaveLength(2);
  });

  it("refuses a comparison with only one option", () => {
    // A "comparison" of one is a claim wearing a comparison's clothes.
    // `assertContent` is the write path, which throws; `parseContent` is the
    // read path, which degrades to an empty document so one bad block cannot
    // blank a chapter. Both are asserted.
    expect(() =>
      assertContent([
        {
          type: "comparison",
          options: [{ label: "A", time: "O(n)", space: "O(n)", when: "x" }],
        },
      ])
    ).toThrow();
  });

  it("refuses a before/after with an empty row", () => {
    expect(() =>
      assertContent([
        {
          type: "beforeAfter",
          before: { label: "In", values: [] },
          after: AFTER,
        },
      ])
    ).toThrow();
  });

  it("degrades to an empty document on the read path rather than throwing", () => {
    // A malformed block must not take the whole chapter page down.
    expect(
      parseContent([
        { type: "beforeAfter", before: { label: "In", values: [] }, after: AFTER },
      ])
    ).toEqual([]);
  });
});
