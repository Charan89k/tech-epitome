import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { writePointerViz } from "./write-pointer";

/**
 * Renderer tests for the write-pointer visualization.
 *
 * The step generator is covered in visualizations.test.ts; this file covers
 * the other half of the contract — that a frame's state reaches the screen.
 * The claim being tested is the one the engine rests on: the picture is a
 * function of the frame, so the same frame always draws the same thing.
 */

const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] });

/** Cell values in row order, read back out of the DOM. */
function renderedValues(container: HTMLElement): string[] {
  // Each Cell renders its value, a marker rail and an index. The value sits
  // in the first child of the cell wrapper.
  return Array.from(container.querySelectorAll<HTMLElement>(".font-mono.text-sm")).map(
    (node) => node.textContent ?? ""
  );
}

describe("write pointer renderer", () => {
  it("draws the array exactly as the frame holds it", () => {
    const { container } = render(writePointerViz.render(frames[0]!));
    expect(renderedValues(container)).toEqual(["0", "1", "0", "3", "12"]);
  });

  it("redraws when the frame's array has changed", () => {
    // Frame 3 is the first swap: 1 has moved to the front.
    const swapFrame = frames.find((frame) => frame.state.swapped !== null)!;
    const { container } = render(writePointerViz.render(swapFrame));
    expect(renderedValues(container)).toEqual(["1", "0", "0", "3", "12"]);
  });

  it("shows the final compacted array", () => {
    const { container } = render(writePointerViz.render(frames[frames.length - 1]!));
    expect(renderedValues(container)).toEqual(["1", "3", "12", "0", "0"]);
  });

  it("labels both pointers, and says so when they share a slot", () => {
    // Frame 0 has write and read both at slot 0.
    const { container: together } = render(writePointerViz.render(frames[0]!));
    expect(within(together).getByText("W R")).toBeInTheDocument();

    // Once they separate, each gets its own marker.
    const apart = frames.find((frame) => frame.state.read !== frame.state.write)!;
    const { container } = render(writePointerViz.render(apart));
    expect(within(container).getByText("W")).toBeInTheDocument();
    expect(within(container).getByText("R")).toBeInTheDocument();
  });

  it("drops the pointer markers once the scan is done", () => {
    render(writePointerViz.render(frames[frames.length - 1]!));
    expect(screen.queryByText("W")).not.toBeInTheDocument();
    expect(screen.queryByText("R")).not.toBeInTheDocument();
    expect(screen.queryByText("W R")).not.toBeInTheDocument();
  });

  it("renders every frame without throwing", () => {
    // Cheap, and it catches an index-out-of-range in the tone logic that a
    // single-frame test would miss.
    for (const frame of frames) {
      expect(() => render(writePointerViz.render(frame))).not.toThrow();
    }
  });
});
