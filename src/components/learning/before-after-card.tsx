import { ArrowDown } from "lucide-react";

import { Cell, CellRow } from "@/components/visualization/cells";

/**
 * The same data before and after, so a transformation is legible at a glance.
 *
 * Reuses the visualization engine's `Cell`/`CellRow` rather than drawing its
 * own boxes: a learner who has just stepped through the player should see
 * the same shapes here, and a second set of array primitives would drift
 * from the first the moment either is restyled.
 *
 * Static on purpose. This block answers "what does this do"; the
 * `visualization` block answers "how", and choosing the wrong one is how a
 * page ends up animating something whose endpoints were the whole point.
 *
 * Layout stacks vertically at every width. A side-by-side arrangement would
 * halve the space each row gets, and two arrays of eight values cannot share
 * 320px without either wrapping badly or scrolling sideways.
 */
export function BeforeAfterCard({
  title,
  before,
  after,
  note,
}: {
  title?: string;
  before: { label: string; values: string[] };
  after: { label: string; values: string[] };
  note?: string;
}) {
  return (
    <figure className="not-prose border-border bg-card surface-edge my-5 rounded-lg border p-4">
      <figcaption>
        <p className="text-ember-400 font-mono text-[0.7rem] tracking-wider uppercase">
          Before and after
        </p>
        {title && (
          <h4 className="text-foreground mt-1.5 text-sm font-semibold">{title}</h4>
        )}
      </figcaption>

      <div className="mt-3 space-y-2">
        <Row label={before.label} values={before.values} tone="idle" />

        <div className="flex justify-center py-0.5">
          <ArrowDown
            className="text-muted-foreground/60 size-4"
            aria-hidden="true"
          />
        </div>

        <Row label={after.label} values={after.values} tone="done" />
      </div>

      {note && (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{note}</p>
      )}
    </figure>
  );
}

function Row({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: "idle" | "done";
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</p>
      <CellRow>
        {values.map((value, index) => (
          // Index keys are correct here: this row is a fixed snapshot, never
          // reordered or spliced.
          <Cell key={index} value={value} tone={tone} showIndex={false} />
        ))}
      </CellRow>
    </div>
  );
}
