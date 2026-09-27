import type { ReactNode } from "react";

/**
 * The visualization engine.
 *
 * Every visualization is a pure function from an input to a list of frames,
 * plus a renderer for one frame. That separation is the whole design:
 *
 *   - Frames are produced by *actually running the algorithm*, recording a
 *     snapshot at each meaningful step. Nothing is choreographed. If the
 *     animation shows a pointer moving, it is because the algorithm moved
 *     it, which is the difference between a teaching aid and a decoration.
 *   - The player owns play/pause/step/reset/speed and knows nothing about
 *     any particular algorithm.
 *   - Stepping is just an array index, so reverse, scrubbing and reduced
 *     motion all come for free.
 */

export type FrameVariables = Record<string, string | number | boolean>;

export type Frame<TState> = {
  state: TState;
  /** Named values shown in the variables panel, in insertion order. */
  variables: FrameVariables;
  /** One sentence describing what this step did. */
  operation: string;
  /** 0-based index into `pseudocode`, highlighted for this frame. */
  line: number;
};

export type Visualization<TState = unknown, TInput = unknown> = {
  /** Stable key, referenced by content blocks and by /visualize routes. */
  key: string;
  title: string;
  description: string;
  /** Shown beside the animation, with the active line highlighted. */
  pseudocode: string[];
  complexity: { time: string; space: string };
  defaultInput: TInput;
  /** Runs the algorithm, recording one frame per meaningful step. */
  buildFrames: (input: TInput) => Frame<TState>[];
  /** Renders a single frame. Must be pure and cheap. */
  render: (frame: Frame<TState>) => ReactNode;
  /** Optional editable controls for the input. */
  inputHint?: string;
  /** Parses user-entered text into an input, or returns an error message. */
  parseInput?: (raw: string) => { ok: true; value: TInput } | { ok: false; error: string };
  /** Serialises an input back to editable text. */
  formatInput?: (input: TInput) => string;
};

/** Helper for building a frame without repeating the field names. */
export function frame<TState>(
  state: TState,
  line: number,
  operation: string,
  variables: FrameVariables = {}
): Frame<TState> {
  return { state, line, operation, variables };
}

/**
 * A visualization with its type parameters erased, for storage in the
 * registry and for the player.
 *
 * TypeScript has no existential types, so there is no way to say "some
 * Visualization, whose state type I do not care about" while keeping the
 * methods sound — `render` takes a Frame<TState> and is therefore
 * contravariant in it. Rather than spraying `any` through the registry and
 * the player, the erasure happens once, in `erase` below, with the reason
 * written down.
 *
 * The erasure is safe in practice because the player only ever passes a
 * frame back to the same visualization that produced it.
 */
export type ErasedVisualization = Omit<
  Visualization,
  "buildFrames" | "render" | "parseInput" | "formatInput" | "defaultInput"
> & {
  defaultInput: unknown;
  buildFrames: (input: unknown) => Frame<unknown>[];
  render: (frame: Frame<unknown>) => ReactNode;
  parseInput?: (
    raw: string
  ) => { ok: true; value: unknown } | { ok: false; error: string };
  formatInput?: (input: unknown) => string;
};

/** The single place the type parameters are discarded. */
export function erase<TState, TInput>(
  visualization: Visualization<TState, TInput>
): ErasedVisualization {
  return visualization as unknown as ErasedVisualization;
}
