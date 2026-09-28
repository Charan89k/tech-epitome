import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type State = {
  /** The array as it stands on this frame. Copied, because it is mutated. */
  values: number[];
  read: number;
  write: number;
  /** The two slots exchanged on this frame, if any. */
  swapped: [number, number] | null;
  done: boolean;
};

type Input = { values: number[] };

/**
 * Same-direction two pointers: compacting an array in place.
 *
 * The other two-pointer visualization in this engine starts the pointers at
 * opposite ends and walks them together. This is the other half of the
 * pattern, and it is a different idea wearing the same name: both pointers
 * move forward, at different rates, over a single array.
 *
 * The teaching point is the invariant `write <= read`. Every frame shows the
 * gap between the two, because that gap is exactly the number of discarded
 * values, and it is the reason the algorithm can overwrite as it goes without
 * ever destroying a value it has not already read.
 *
 * The frames come from running the loop, not from a script: the array in each
 * frame is a snapshot taken after the real swap.
 */
export const writePointerViz: Visualization<State, Input> = {
  key: "write-pointer",
  title: "Write Pointer",
  description:
    "Move every zero to the end of an array without allocating a second one. A read pointer visits each slot while a write pointer trails behind marking where the next kept value belongs; the gap between them is the number of values discarded so far.",
  complexity: { time: "O(n)", space: "O(1)" },
  // Kept narrow on purpose: the pseudocode panel is a fixed 15rem column that
  // scrolls rather than wraps, so a long line would push the highlighted step
  // out of view — exactly the line the reader needs. `nums` matches the Python
  // sample in the chapter this visualization illustrates.
  pseudocode: [
    "write = 0",
    "for read in 0 .. n-1:",
    "  if nums[read] != 0:",
    "    swap nums[write], nums[read]",
    "    write += 1",
    "# nums[0 .. write) are kept",
  ],
  defaultInput: { values: [0, 1, 0, 3, 12] },
  inputHint: "Whole numbers, zeros included. Example: 0 1 0 3 12",

  parseInput(raw) {
    const values = raw
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    if (values.length < 2 || values.some((value) => !Number.isFinite(value))) {
      return { ok: false, error: "Enter at least two whole numbers." };
    }
    if (values.length > 16) {
      return { ok: false, error: "Keep it to 16 values so the row stays readable." };
    }
    return { ok: true, value: { values } };
  },

  formatInput: (input) => input.values.join(" "),

  buildFrames(input) {
    // Copied up front: the algorithm swaps in place, and every frame keeps a
    // snapshot, so the source input must not be mutated under the caller.
    const values = [...input.values];
    const frames: Frame<State>[] = [];
    let write = 0;
    let read = 0;

    const snapshot = (
      line: number,
      operation: string,
      extra: { swapped?: [number, number]; done?: boolean } = {}
    ) =>
      frames.push(
        frame(
          {
            values: [...values],
            read,
            write,
            swapped: extra.swapped ?? null,
            done: extra.done ?? false,
          },
          line,
          operation,
          {
            read,
            write,
            gap: read - write,
            kept: write,
          }
        )
      );

    snapshot(
      0,
      `Nothing is kept yet, so the write pointer starts at slot 0 alongside the read pointer. Array: [${values.join(", ")}].`
    );

    for (read = 0; read < values.length; read += 1) {
      const value = values[read]!;

      if (value === 0) {
        snapshot(
          2,
          `Slot ${read} holds 0, which is discarded. The write pointer stays at ${write} while the read pointer moves on — the gap that opens between them is exactly the number of values thrown away so far.`
        );
        continue;
      }

      snapshot(2, `Slot ${read} holds ${value}, which is kept.`);

      const displaced = values[write]!;
      [values[write], values[read]] = [values[read]!, values[write]!];

      snapshot(
        3,
        write === read
          ? `The pointers are still together at slot ${read}, so the swap exchanges the slot with itself and ${value} does not move. No value has been discarded yet, so there is nowhere earlier for it to go.`
          : `Swap slots ${write} and ${read}: ${value} moves forward into the kept prefix, and the ${displaced} it replaced moves back to slot ${read}. Slot ${write} was only free because its value had already been read and discarded.`,
        { swapped: [write, read] }
      );

      write += 1;

      snapshot(
        4,
        `The write pointer advances to ${write} — it moves only on a keep, which is what makes it point at the end of the kept run. Settled so far: [${values.slice(0, write).join(", ")}].`
      );
    }

    read = values.length - 1;
    snapshot(
      5,
      write === values.length
        ? `Every value was kept, so the array is unchanged: [${values.join(", ")}].`
        : `The scan is finished. The first ${write} slot${write === 1 ? "" : "s"} hold the kept values in their original order, and everything from slot ${write} on is zero: [${values.join(", ")}].`,
      { done: true }
    );

    return frames;
  },

  render(frameData) {
    const { values, read, write, swapped, done } = frameData.state;

    return (
      <CellRow>
        {values.map((value, index) => {
          const isSwapped = swapped
            ? index === swapped[0] || index === swapped[1]
            : false;

          const tone = isSwapped
            ? "compare"
            : done
              ? index < write
                ? "done"
                : "excluded"
              : index < write
                ? "done"
                : index === read
                  ? "active"
                  : "idle";

          // Both markers ride the same row, so a slot holding both says so
          // rather than silently dropping one.
          const atWrite = index === write && !done;
          const atRead = index === read && !done;
          const label =
            atWrite && atRead ? "W R" : atWrite ? "W" : atRead ? "R" : undefined;

          return (
            <Cell key={index} value={value} index={index} tone={tone} label={label} />
          );
        })}
      </CellRow>
    );
  },
};
