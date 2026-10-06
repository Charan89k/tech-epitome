import type { ComplexityRow } from "@/types/content";

/**
 * Complexity table.
 *
 * A real <table> rather than a grid of divs: a screen reader user needs the
 * row and column association to make sense of "O(log n)" in isolation.
 */
export function ComplexityCard({
  rows,
  caption,
}: {
  rows: ComplexityRow[];
  caption?: string;
}) {
  return (
    <figure className="not-prose border-border bg-card my-5 overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {caption ?? "Time and space complexity by operation"}
        </caption>
        <thead>
          <tr className="border-border bg-muted/40 border-b">
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium">
              Operation
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium">
              Time
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium">
              Space
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <tr key={row.operation}>
              <th
                scope="row"
                className="text-foreground px-4 py-2 text-left text-sm font-normal"
              >
                {row.operation}
                {row.note && (
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {row.note}
                  </span>
                )}
              </th>
              <td className="text-ember-300 px-4 py-2 font-mono text-xs">
                {row.time}
              </td>
              <td className="text-ember-300 px-4 py-2 font-mono text-xs">
                {row.space}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {caption && (
        <figcaption className="border-border text-muted-foreground border-t px-4 py-2 text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
