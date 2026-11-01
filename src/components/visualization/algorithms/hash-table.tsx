import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";
import { formatNumbers, parseNumbers } from "./input";

type State = {
  buckets: number[][];
  bucket: number | null;
  active: number | null;
};

export const HASH_BUCKETS = 7;

export function bucketFor(value: number): number {
  return ((value % HASH_BUCKETS) + HASH_BUCKETS) % HASH_BUCKETS;
}

/** A hash table with chaining: the hash picks a bucket, and only that bucket is searched. */
export const hashTableViz: Visualization<State, number[]> = {
  key: "hash-table",
  title: "Hash Table with Chaining",
  description:
    "The hash sends each key straight to one bucket. Keys that collide share a chain, and only that chain is searched.",
  complexity: {
    time: "O(1) on average, O(n) if every key collides",
    space: "O(n + buckets)",
  },
  pseudocode: [
    `for each key:`,
    `    bucket = key mod ${HASH_BUCKETS}`,
    "    search that bucket's chain for the key",
    "    if it is missing, add it to the chain",
  ],
  defaultInput: [15, 8, 23, 4, 11, 15, 30],
  inputHint: `Whole numbers to insert, with ${HASH_BUCKETS} buckets. Example: 15 8 22 4`,
  parseInput(raw) {
    const parsed = parseNumbers(raw, 14);
    if (parsed.ok && parsed.value.some((value) => !Number.isInteger(value))) {
      return { ok: false, error: "Enter whole numbers." };
    }
    return parsed;
  },
  formatInput: formatNumbers,

  buildFrames(input) {
    const buckets: number[][] = Array.from({ length: HASH_BUCKETS }, () => []);
    const frames: Frame<State>[] = [];
    let collisions = 0;
    const snap = (
      line: number,
      operation: string,
      bucket: number | null,
      active: number | null,
      key: number | string
    ) =>
      frames.push(
        frame(
          { buckets: buckets.map((chain) => [...chain]), bucket, active },
          line,
          operation,
          {
            key,
            collisions,
          }
        )
      );

    snap(0, `An empty table with ${HASH_BUCKETS} buckets.`, null, null, "none");
    for (const key of input) {
      const bucket = bucketFor(key);
      snap(
        1,
        `${key} mod ${HASH_BUCKETS} is ${bucket}, so go to bucket ${bucket}.`,
        bucket,
        null,
        key
      );

      const chain = buckets[bucket]!;
      let found = false;
      for (const existing of chain) {
        snap(2, `Compare ${key} with ${existing}.`, bucket, existing, key);
        if (existing === key) {
          found = true;
          break;
        }
      }
      if (found) {
        snap(
          2,
          `${key} is already in the table, so nothing changes.`,
          bucket,
          key,
          key
        );
        continue;
      }
      if (chain.length > 0) collisions += 1;
      chain.push(key);
      snap(
        3,
        chain.length > 1
          ? `Bucket ${bucket} is taken, so ${key} joins its chain. That is a collision.`
          : `Bucket ${bucket} is free, so ${key} goes there.`,
        bucket,
        key,
        key
      );
    }
    return frames;
  },

  render({ state }) {
    return (
      <ol className="space-y-1.5">
        {state.buckets.map((chain, index) => (
          <li
            key={index}
            aria-current={index === state.bucket ? "true" : undefined}
            className="flex items-center gap-3 rounded-md border border-transparent px-1 py-0.5 aria-current:border-brand-500/50"
          >
            <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
              Bucket {index}
            </span>
            {chain.length === 0 ? (
              <span className="font-mono text-xs text-muted-foreground">empty</span>
            ) : (
              <CellRow>
                {chain.map((value) => (
                  <Cell
                    key={value}
                    value={value}
                    showIndex={false}
                    tone={
                      index === state.bucket && value === state.active
                        ? "active"
                        : "idle"
                    }
                  />
                ))}
              </CellRow>
            )}
          </li>
        ))}
      </ol>
    );
  },
};
