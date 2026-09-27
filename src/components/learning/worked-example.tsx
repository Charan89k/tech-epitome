import { ArrowRight } from "lucide-react";

/**
 * A worked example: concrete input, the steps taken, the result.
 *
 * Rendered as an ordered list rather than a table because the steps are a
 * narrative — each one says what changed and why — and a table invites the
 * reader to scan rather than follow.
 */
export function WorkedExample({
  title,
  input,
  steps,
  output,
}: {
  title?: string;
  input: string;
  steps: { state: string; note: string }[];
  output: string;
}) {
  return (
    <figure className="not-prose border-border bg-card my-5 overflow-hidden rounded-lg border">
      {title && (
        <figcaption className="border-border bg-muted/40 border-b px-4 py-2 text-xs font-medium">
          {title}
        </figcaption>
      )}

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
            Input
          </span>
          <code className="text-foreground font-mono text-xs">{input}</code>
        </div>

        <ol className="border-border space-y-2 border-l pl-4">
          {steps.map((step, index) => (
            <li key={index} className="relative">
              <span
                className="bg-ember-500/50 absolute top-2 -left-[1.28rem] size-1.5 rounded-full"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                <code className="text-ember-300 shrink-0 font-mono text-xs">
                  {step.state}
                </code>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  {step.note}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="border-border flex flex-wrap items-baseline gap-2 border-t pt-3">
          <ArrowRight className="text-success size-3.5 shrink-0" aria-hidden="true" />
          <span className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
            Result
          </span>
          <code className="text-success font-mono text-xs">{output}</code>
        </div>
      </div>
    </figure>
  );
}
