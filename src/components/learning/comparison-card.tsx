import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Two or more approaches to the same problem, side by side.
 *
 * Replaces the "one paragraph for the naive way, another for the good way"
 * shape, which asks the reader to hold the first in their head while reading
 * the second. Here the axes that actually decide between them — cost, and
 * when each is right — line up, so the comparison is read rather than
 * reconstructed.
 *
 * Every option states *when it is the right answer*, including the one that
 * is not being taught. An approach presented only as a mistake teaches the
 * reader to pattern-match instead of to choose, and "build a second array"
 * is genuinely correct whenever the input must not be mutated.
 *
 * The preferred option is marked with an icon and a word, never with colour
 * alone.
 */
export function ComparisonCard({
  title,
  options,
}: {
  title?: string;
  options: {
    label: string;
    time: string;
    space: string;
    when: string;
    preferred?: boolean;
  }[];
}) {
  return (
    <section
      className="not-prose border-border bg-card surface-edge my-5 rounded-lg border p-4"
      aria-label={title ?? "Approach comparison"}
    >
      <p className="text-ember-400 font-mono text-[0.7rem] tracking-wider uppercase">
        Approaches
      </p>
      {title && (
        <h4 className="text-foreground mt-1.5 text-sm font-semibold">{title}</h4>
      )}

      {/*
        One column until there is room for two. Below that the cards sit on
        top of each other, which keeps every complexity value readable
        instead of squeezing three columns into 320px.
      */}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li
            key={option.label}
            className={cn(
              "rounded-md border p-3",
              option.preferred
                ? "border-ember-500/45 bg-ember-500/5"
                : "border-border bg-muted/20"
            )}
          >
            <div className="flex items-start gap-1.5">
              <h5 className="text-foreground min-w-0 flex-1 text-sm font-medium">
                {option.label}
              </h5>
              {option.preferred && (
                <span className="text-ember-400 flex shrink-0 items-center gap-1 text-[0.65rem] font-medium">
                  <Check className="size-3" aria-hidden="true" />
                  Taught here
                </span>
              )}
            </div>

            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground text-xs">Time</dt>
                <dd className="text-ember-300 font-mono text-xs">{option.time}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground text-xs">Space</dt>
                <dd className="text-ember-300 font-mono text-xs">{option.space}</dd>
              </div>
            </dl>

            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {option.when}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
