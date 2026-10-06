import { CornerDownLeft, Layers } from "lucide-react";

import type { HeapNode, TraceStep, TraceValue } from "@/lib/trace/types";
import { display } from "@/lib/trace/wire";
import { cn } from "@/lib/utils";

/**
 * Draws one traced step: every variable in scope, each in the shape that
 * suits it.
 *
 *   sequences (lists, arrays, strings)  cells, with index pointers beneath
 *   numeric sequences                    the same, plus a bar per value
 *   names like `stack`                   a vertical pile, top first
 *   linked-list nodes                    boxes and arrows, pointers beneath
 *   dicts / Maps, sets                   key-value rows, chips
 *   everything else                      the variables strip
 *
 * The layout is inferred from the values rather than configured per
 * problem, which is what lets all fifty problems — and any helper variable a
 * learner invents — get a picture without anyone authoring one.
 *
 * Anything that changed since the previous step is ringed in ember. Colour
 * is never the only signal: pointers are labelled, and changed values are
 * also marked for screen readers.
 */

/** Integer variables that read as positions into a sequence. */
const POINTER_NAME =
  /^(i|j|l|r|lo|hi|low|high|mid|left|right|start|end|begin|slow|fast|w|write|read|p|q|p1|p2|ptr|idx|index|cur|curr|pos|front|back|top|anchor|insert|place|slot|boundary|lhs|rhs)$|(_?(idx|index|ptr|pos|i|j))$|(Index|Idx|Ptr|Pos)$/i;

const RANGE_PAIRS: [string, string][] = [
  ["left", "right"],
  ["lo", "hi"],
  ["low", "high"],
  ["l", "r"],
  ["start", "end"],
  ["i", "j"],
];

const STACK_NAME =
  /^(stack|stk|st|pile|mono|monostack|mono_stack|ops|operands)$|stack$/i;

type Pointer = { name: string; index: number };

export type StateViewProps = {
  step: TraceStep;
  previous?: TraceStep | null;
  /** Parameter names, drawn first and in signature order. */
  paramNames?: string[];
  className?: string;
};

export function StateView({
  step,
  previous,
  paramNames = [],
  className,
}: StateViewProps) {
  const names = orderNames(Object.keys(step.locals), paramNames);
  const prevLocals = previous?.locals ?? {};

  const ints = names
    .map((name) => ({ name, value: step.locals[name]! }))
    .filter(
      (entry): entry is { name: string; value: { t: "num"; v: number } } =>
        entry.value.t === "num" && Number.isInteger(entry.value.v)
    );

  const sequences: {
    name: string;
    items: TraceValue[];
    more?: number;
    isString: boolean;
  }[] = [];
  const grids: { name: string; rows: TraceValue[][] }[] = [];
  const maps: { name: string; value: Extract<TraceValue, { t: "map" }> }[] = [];
  const sets: { name: string; value: Extract<TraceValue, { t: "set" }> }[] = [];
  const objects: { name: string; value: Extract<TraceValue, { t: "obj" }> }[] = [];
  const nodeRefs: { name: string; id: number }[] = [];
  const scalars: { name: string; value: TraceValue }[] = [];

  for (const name of names) {
    const value = step.locals[name]!;
    switch (value.t) {
      case "arr":
        if (value.items.length > 0 && value.items.every((item) => item.t === "arr")) {
          grids.push({
            name,
            rows: value.items.map((row) => (row.t === "arr" ? row.items : [])),
          });
        } else {
          sequences.push({
            name,
            items: value.items,
            more: value.more,
            isString: false,
          });
        }
        break;
      case "str":
        // A string the problem is about gets cells; a short label stays a scalar.
        if (paramNames.includes(name) || value.v.length > 3) {
          sequences.push({
            name,
            items: Array.from(value.v).map((ch) => ({ t: "str", v: ch }) as TraceValue),
            isString: true,
          });
        } else {
          scalars.push({ name, value });
        }
        break;
      case "map":
        maps.push({ name, value });
        break;
      case "set":
        sets.push({ name, value });
        break;
      case "obj":
        objects.push({ name, value });
        break;
      case "node":
        nodeRefs.push({ name, id: value.id });
        break;
      default:
        scalars.push({ name, value });
    }
  }

  const anyParamSequence = sequences.some((seq) => paramNames.includes(seq.name));

  const hasStructure =
    sequences.length +
      grids.length +
      maps.length +
      sets.length +
      objects.length +
      nodeRefs.length >
    0;

  return (
    <div className={cn("space-y-4", className)}>
      {step.stack.length > 1 && <CallStack step={step} />}

      {nodeRefs.length > 0 && (
        <LinkedLists heap={step.heap} prevHeap={previous?.heap} refs={nodeRefs} />
      )}

      {sequences.map((seq) => {
        // Index variables point into the problem's own input. Drawing them
        // on every list as well would put `right` on a deque of indices or a
        // result array, where the position means nothing.
        const pointsHere = !anyParamSequence || paramNames.includes(seq.name);
        const pointers = pointsHere
          ? pointersFor(ints, seq.items.length, seq.name)
          : [];
        const prev = prevLocals[seq.name];
        const prevItems =
          prev?.t === "arr"
            ? prev.items
            : prev?.t === "str"
              ? Array.from(prev.v).map((v) => ({ t: "str", v }) as TraceValue)
              : null;
        return STACK_NAME.test(seq.name) && !seq.isString ? (
          <StackView
            key={seq.name}
            name={seq.name}
            items={seq.items}
            prevItems={prevItems}
          />
        ) : (
          <SequenceView
            key={seq.name}
            name={seq.name}
            items={seq.items}
            more={seq.more}
            prevItems={prevItems}
            pointers={pointers}
            range={pointsHere ? rangeFor(ints, seq.items.length) : null}
            isString={seq.isString}
          />
        );
      })}

      {grids.map((grid) => (
        <GridView
          key={grid.name}
          name={grid.name}
          rows={grid.rows}
          previous={prevLocals[grid.name]}
        />
      ))}

      {(maps.length > 0 || sets.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {maps.map((map) => (
            <MapView
              key={map.name}
              name={map.name}
              value={map.value}
              previous={prevLocals[map.name]}
            />
          ))}
          {sets.map((set) => (
            <SetView
              key={set.name}
              name={set.name}
              value={set.value}
              previous={prevLocals[set.name]}
            />
          ))}
        </div>
      )}

      {objects.map((object) => (
        <Panel key={object.name} name={object.name} caption={object.value.name}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
            {Object.entries(object.value.fields).map(([field, value]) => (
              <div key={field} className="contents">
                <dt className="text-muted-foreground">{field}</dt>
                <dd className="truncate">{display(value)}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ))}

      {scalars.length + ints.length > 0 && (
        <VariableStrip
          entries={[
            ...ints.map((e) => ({ name: e.name, value: e.value as TraceValue })),
            ...scalars,
          ]
            .filter(
              (entry, index, all) =>
                all.findIndex((other) => other.name === entry.name) === index
            )
            .sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name))}
          previous={prevLocals}
          hasPrevious={Boolean(previous)}
        />
      )}

      {nodeRefs.length === 0 && !hasStructure && scalars.length + ints.length === 0 && (
        <p className="text-xs text-muted-foreground">No variables in scope yet.</p>
      )}

      {step.event === "return" && step.returnValue && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 font-mono text-xs text-success">
          <CornerDownLeft className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-sans text-muted-foreground">
            {step.stack.at(-1)?.func ?? "function"} returns
          </span>
          <span className="truncate">
            {step.returnValue.t === "node"
              ? chainText(step.returnValue.id, step.heap)
              : display(step.returnValue)}
          </span>
        </div>
      )}
    </div>
  );
}

function orderNames(names: string[], paramNames: string[]): string[] {
  const params = paramNames.filter((name) => names.includes(name));
  return [...params, ...names.filter((name) => !params.includes(name))];
}

function pointersFor(
  ints: { name: string; value: { v: number } }[],
  length: number,
  owner: string
): Pointer[] {
  return ints
    .filter(
      ({ name, value }) =>
        name !== owner && POINTER_NAME.test(name) && value.v >= 0 && value.v <= length
    )
    .map(({ name, value }) => ({ name, index: value.v }));
}

/** The first matching pair of bounds, drawn as a shaded window. */
function rangeFor(
  ints: { name: string; value: { v: number } }[],
  length: number
): [number, number] | null {
  const lookup = new Map(ints.map(({ name, value }) => [name, value.v]));
  for (const [a, b] of RANGE_PAIRS) {
    const lo = lookup.get(a);
    const hi = lookup.get(b);
    if (lo === undefined || hi === undefined) continue;
    if (lo < 0 || hi < 0 || lo >= length || lo > hi) continue;
    return [lo, Math.min(hi, length - 1)];
  }
  return null;
}

function same(a: TraceValue | undefined, b: TraceValue | undefined): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Panel({
  name,
  caption,
  children,
  className,
}: {
  name: string;
  caption?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)} aria-label={name}>
      <header className="mb-1.5 flex items-baseline gap-2">
        <h4 className="font-mono text-xs font-semibold text-foreground">{name}</h4>
        {caption && (
          <span className="text-[0.65rem] text-muted-foreground">{caption}</span>
        )}
      </header>
      {children}
    </section>
  );
}

function SequenceView({
  name,
  items,
  more,
  prevItems,
  pointers,
  range,
  isString,
}: {
  name: string;
  items: TraceValue[];
  more?: number;
  prevItems: TraceValue[] | null;
  pointers: Pointer[];
  range: [number, number] | null;
  isString: boolean;
}) {
  const numeric =
    !isString && items.length > 0 && items.every((item) => item.t === "num");
  const values = numeric ? items.map((item) => (item.t === "num" ? item.v : 0)) : [];
  const max = numeric ? Math.max(1, ...values.map(Math.abs)) : 1;
  const showBars = numeric && items.length <= 40;
  // An end pointer (== length) gets a ghost slot so it has somewhere to sit.
  const endPointers = pointers.filter((p) => p.index === items.length);

  return (
    <Panel
      name={name}
      caption={`${isString ? "string" : "list"} · ${items.length + (more ?? 0)} ${isString ? "chars" : "items"}`}
    >
      {items.length === 0 ? (
        <div className="inline-flex h-10 items-center rounded-md border border-dashed border-border px-3 font-mono text-xs text-muted-foreground">
          empty
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max items-end gap-1">
            {items.map((item, index) => {
              const changed = prevItems !== null && !same(item, prevItems[index]);
              const here = pointers.filter((p) => p.index === index);
              const inRange = range !== null && index >= range[0] && index <= range[1];
              const value = item.t === "num" ? item.v : 0;
              return (
                <div key={index} className="flex w-9 flex-col items-center gap-1">
                  {showBars && (
                    <div
                      className="flex h-12 w-full items-end justify-center"
                      aria-hidden="true"
                    >
                      <div
                        className={cn(
                          "w-5 rounded-t-sm transition-[height,background-color] duration-300",
                          value < 0 ? "bg-difficulty-hard/45" : "bg-ember-500/35",
                          here.length > 0 && "bg-ember-500/80",
                          changed && "bg-ember-400"
                        )}
                        style={{
                          height: `${Math.max(6, (Math.abs(value) / max) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-md border font-mono text-xs transition-colors duration-300",
                      inRange
                        ? "border-viz-compare/50 bg-viz-compare/12"
                        : "border-border bg-muted/40",
                      here.length > 0 &&
                        "border-ember-500/70 bg-ember-500/15 text-ember-100",
                      changed && "animate-in ring-2 ring-ember-400 zoom-in-95"
                    )}
                  >
                    <span className="truncate px-0.5">
                      {item.t === "str" && isString
                        ? item.v === " "
                          ? "␣"
                          : item.v
                        : display(item)}
                    </span>
                    {changed && <span className="sr-only"> (changed)</span>}
                  </div>
                  <span className="font-mono text-[0.6rem] leading-none text-muted-foreground/50">
                    {index}
                  </span>
                  <PointerLabels pointers={here} />
                </div>
              );
            })}
            {endPointers.length > 0 && (
              <div className="flex w-9 flex-col items-center gap-1">
                {showBars && <div className="h-12" />}
                <div className="flex h-9 w-full items-center justify-center rounded-md border border-dashed border-border/60 font-mono text-[0.6rem] text-muted-foreground/40">
                  end
                </div>
                <span className="font-mono text-[0.6rem] leading-none text-muted-foreground/50">
                  {items.length}
                </span>
                <PointerLabels pointers={endPointers} />
              </div>
            )}
            {more ? (
              <span className="self-center px-2 text-xs text-muted-foreground">
                +{more} more
              </span>
            ) : null}
          </div>
        </div>
      )}
    </Panel>
  );
}

function PointerLabels({ pointers }: { pointers: Pointer[] }) {
  return (
    <div className="flex min-h-4 flex-col items-center gap-0.5">
      {pointers.map((pointer) => (
        <span
          key={pointer.name}
          className="flex flex-col items-center font-mono text-[0.6rem] leading-none font-semibold text-ember-300"
        >
          <span aria-hidden="true">▲</span>
          {pointer.name}
        </span>
      ))}
    </div>
  );
}

function StackView({
  name,
  items,
  prevItems,
}: {
  name: string;
  items: TraceValue[];
  prevItems: TraceValue[] | null;
}) {
  const pushed = prevItems !== null && items.length > prevItems.length;
  const popped = prevItems !== null && items.length < prevItems.length;
  return (
    <Panel
      name={name}
      caption={`stack · ${items.length} ${pushed ? "· pushed" : popped ? "· popped" : ""}`}
    >
      <div className="flex items-end gap-3">
        <div className="flex min-h-12 w-28 flex-col-reverse gap-1 rounded-b-lg border-x-2 border-b-2 border-border p-1.5">
          {items.length === 0 && (
            <span className="py-2 text-center font-mono text-[0.65rem] text-muted-foreground/60">
              empty
            </span>
          )}
          {items.map((item, index) => {
            const top = index === items.length - 1;
            return (
              <div
                key={index}
                className={cn(
                  "flex h-7 items-center justify-center rounded border font-mono text-xs transition-colors",
                  top
                    ? "border-ember-500/60 bg-ember-500/15 text-ember-100"
                    : "border-border bg-muted/40",
                  top &&
                    pushed &&
                    "animate-in ring-2 ring-ember-400 slide-in-from-top-2"
                )}
              >
                <span className="truncate px-1">{display(item)}</span>
              </div>
            );
          })}
        </div>
        {items.length > 0 && (
          <span className="mb-auto pt-1 font-mono text-[0.6rem] font-semibold text-ember-300">
            ◀ top
          </span>
        )}
      </div>
    </Panel>
  );
}

function GridView({
  name,
  rows,
  previous,
}: {
  name: string;
  rows: TraceValue[][];
  previous: TraceValue | undefined;
}) {
  const prevRows =
    previous?.t === "arr"
      ? previous.items.map((row) => (row.t === "arr" ? row.items : []))
      : null;
  return (
    <Panel name={name} caption={`grid · ${rows.length} rows`}>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 font-mono text-xs">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <th className="pr-1 text-right text-[0.6rem] font-normal text-muted-foreground/50">
                  {r}
                </th>
                {row.map((cell, c) => {
                  const changed = prevRows !== null && !same(cell, prevRows[r]?.[c]);
                  return (
                    <td
                      key={c}
                      className={cn(
                        "h-8 min-w-8 rounded border border-border bg-muted/40 px-1.5 text-center transition-colors",
                        changed && "bg-ember-500/15 ring-2 ring-ember-400"
                      )}
                    >
                      {display(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MapView({
  name,
  value,
  previous,
}: {
  name: string;
  value: Extract<TraceValue, { t: "map" }>;
  previous: TraceValue | undefined;
}) {
  const before = new Map(
    previous?.t === "map"
      ? previous.entries.map(([k, v]) => [JSON.stringify(k), v])
      : []
  );
  return (
    <Panel
      name={name}
      caption={`map · ${value.entries.length + (value.more ?? 0)} keys`}
    >
      {value.entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          {"{}"}
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded-md border border-border">
          <table className="w-full font-mono text-xs">
            <tbody className="divide-y divide-border">
              {value.entries.map(([key, entry]) => {
                const k = JSON.stringify(key);
                const isNew = previous !== undefined && !before.has(k);
                const changed =
                  previous !== undefined && !isNew && !same(before.get(k), entry);
                return (
                  <tr
                    key={k}
                    className={cn(
                      "transition-colors",
                      (isNew || changed) && "bg-ember-500/12"
                    )}
                  >
                    <td className="w-1/2 truncate px-2 py-1 text-viz-compare">
                      {key.t === "str" ? JSON.stringify(key.v) : display(key)}
                    </td>
                    <td
                      className={cn(
                        "truncate px-2 py-1",
                        (isNew || changed) && "text-ember-200"
                      )}
                    >
                      {display(entry)}
                      {isNew && (
                        <span className="ml-1.5 text-[0.6rem] text-ember-400">new</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function SetView({
  name,
  value,
  previous,
}: {
  name: string;
  value: Extract<TraceValue, { t: "set" }>;
  previous: TraceValue | undefined;
}) {
  const before = new Set(
    previous?.t === "set" ? previous.items.map((item) => JSON.stringify(item)) : []
  );
  return (
    <Panel
      name={name}
      caption={`set · ${value.items.length + (value.more ?? 0)} items`}
    >
      <div className="flex flex-wrap gap-1">
        {value.items.length === 0 && (
          <span className="font-mono text-xs text-muted-foreground">{"{}"}</span>
        )}
        {value.items.map((item) => {
          const isNew = previous !== undefined && !before.has(JSON.stringify(item));
          return (
            <span
              key={JSON.stringify(item)}
              className={cn(
                "rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs",
                isNew && "border-ember-500/60 bg-ember-500/15 text-ember-100"
              )}
            >
              {item.t === "str" ? JSON.stringify(item.v) : display(item)}
            </span>
          );
        })}
      </div>
    </Panel>
  );
}

function LinkedLists({
  heap,
  prevHeap,
  refs,
}: {
  heap: Record<number, HeapNode>;
  prevHeap?: Record<number, HeapNode>;
  refs: { name: string; id: number }[];
}) {
  const chains = buildChains(heap, refs);
  const labels = new Map<number, string[]>();
  for (const ref of refs) labels.set(ref.id, [...(labels.get(ref.id) ?? []), ref.name]);

  return (
    <Panel name="linked list" caption={`${Object.keys(heap).length} nodes`}>
      <div className="space-y-3">
        {chains.map((chain, chainIndex) => (
          <div key={chainIndex} className="overflow-x-auto pb-1">
            <div className="flex w-max items-start">
              {chain.ids.map((id, position) => {
                const node = heap[id]!;
                const rewired =
                  prevHeap?.[id] !== undefined && prevHeap[id]!.next !== node.next;
                const names = labels.get(id) ?? [];
                const last = position === chain.ids.length - 1;
                return (
                  <div key={id} className="flex items-start">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-9 min-w-10 items-center justify-center rounded-lg border px-2 font-mono text-xs transition-colors",
                          names.length > 0
                            ? "border-ember-500/70 bg-ember-500/15 text-ember-100"
                            : "border-border bg-muted/40",
                          rewired && "ring-2 ring-ember-400"
                        )}
                      >
                        {display(node.val)}
                      </div>
                      <PointerLabels
                        pointers={names.map((name) => ({ name, index: 0 }))}
                      />
                    </div>
                    <div className="flex h-9 items-center px-1">
                      {last ? (
                        chain.tail === "null" ? (
                          <span className="flex items-center font-mono text-[0.65rem] text-muted-foreground/60">
                            <Arrow muted={rewired} /> null
                          </span>
                        ) : chain.tail === "cycle" ? (
                          <span className="flex items-center font-mono text-[0.65rem] text-difficulty-hard">
                            <Arrow /> ↺ {display(heap[node.next!]!.val)}
                          </span>
                        ) : (
                          <span className="flex items-center font-mono text-[0.65rem] text-muted-foreground">
                            <Arrow /> joins {display(heap[node.next!]!.val)}
                          </span>
                        )
                      ) : (
                        <Arrow />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {refs.length > 0 && chains.length === 0 && (
          <span className="font-mono text-xs text-muted-foreground">null</span>
        )}
      </div>
    </Panel>
  );
}

function Arrow({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      width="22"
      height="10"
      viewBox="0 0 22 10"
      aria-hidden="true"
      className={cn("mr-0.5", muted ? "text-ember-400" : "text-muted-foreground/70")}
    >
      <path
        d="M0 5h18M14 1l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

type Chain = { ids: number[]; tail: "null" | "cycle" | "join" };

/**
 * Splits the heap into chains for drawing.
 *
 * Each chain starts at a node nothing points to, so a list being reversed
 * shows as two chains — the reversed prefix and the untouched rest — which
 * is exactly the picture a learner should have in their head. A chain that
 * runs into a node already drawn ends with "joins", and a loop with "↺".
 */
function buildChains(
  heap: Record<number, HeapNode>,
  refs: { name: string; id: number }[]
): Chain[] {
  const ids = Object.keys(heap).map(Number);
  const pointedTo = new Set(
    ids.map((id) => heap[id]!.next).filter((n): n is number => n !== null)
  );
  const starts = ids.filter((id) => !pointedTo.has(id));
  // Prefer the order the learner's variables mention nodes in.
  const refOrder = refs.map((ref) => ref.id);
  starts.sort((a, b) => {
    const ra = refOrder.indexOf(a);
    const rb = refOrder.indexOf(b);
    return (ra === -1 ? 1e9 : ra) - (rb === -1 ? 1e9 : rb) || a - b;
  });
  // Pure cycles have no start; begin them at a referenced node.
  for (const ref of refs)
    if (!starts.includes(ref.id) && heap[ref.id]) starts.push(ref.id);

  const drawn = new Set<number>();
  const chains: Chain[] = [];
  for (const start of starts) {
    if (drawn.has(start)) continue;
    const chain: number[] = [];
    let id: number | null = start;
    const seenHere = new Set<number>();
    let tail: Chain["tail"] = "null";
    while (id !== null && heap[id]) {
      if (seenHere.has(id)) {
        tail = "cycle";
        break;
      }
      if (drawn.has(id)) {
        tail = "join";
        break;
      }
      seenHere.add(id);
      drawn.add(id);
      chain.push(id);
      id = heap[id]!.next;
    }
    if (chain.length > 0) chains.push({ ids: chain, tail });
  }
  return chains;
}

function chainText(id: number, heap: Record<number, HeapNode>): string {
  const parts: string[] = [];
  const seen = new Set<number>();
  let current: number | null = id;
  while (current !== null && heap[current] && !seen.has(current) && parts.length < 30) {
    seen.add(current);
    parts.push(display(heap[current]!.val));
    current = heap[current]!.next;
  }
  return parts.join(" → ") + (current === null ? " → null" : " → …");
}

function VariableStrip({
  entries,
  previous,
  hasPrevious,
}: {
  entries: { name: string; value: TraceValue }[];
  previous: Record<string, TraceValue>;
  hasPrevious: boolean;
}) {
  return (
    <Panel name="variables">
      <div className="flex flex-wrap gap-1.5">
        {entries.map(({ name, value }) => {
          const changed = hasPrevious && !same(previous[name], value);
          return (
            <span
              key={name}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 font-mono text-xs transition-colors",
                changed && "border-ember-500/60 bg-ember-500/12"
              )}
            >
              <span className="text-muted-foreground">{name}</span>
              <span className={cn(changed ? "text-ember-200" : "text-foreground")}>
                {value.t === "str" ? JSON.stringify(value.v) : display(value)}
              </span>
              {changed && <span className="sr-only">(changed)</span>}
            </span>
          );
        })}
      </div>
    </Panel>
  );
}

function CallStack({ step }: { step: TraceStep }) {
  return (
    <section
      aria-label="Call stack"
      className="rounded-lg border border-border bg-muted/20 p-2"
    >
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
        <Layers className="size-3" aria-hidden="true" />
        Call stack · depth {step.stack.length}
      </h4>
      <ol className="flex flex-wrap items-center gap-1 font-mono text-[0.68rem]">
        {step.stack.map((frame, index) => {
          const current = index === step.stack.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-muted-foreground/50">›</span>}
              <span
                className={cn(
                  "rounded px-1.5 py-0.5",
                  current ? "bg-ember-500/15 text-ember-200" : "text-muted-foreground"
                )}
              >
                {frame.func}
                <span className="text-muted-foreground/60">:{frame.line}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
