import { cn } from "@/lib/utils";

/**
 * Shared primitives for array-shaped visualizations.
 *
 * Colour is never the only signal: every highlighted cell also carries a
 * pointer label beneath it, so the animation is readable without relying on
 * hue discrimination.
 */

export type CellTone =
  | "idle"
  | "active"
  | "compare"
  | "visited"
  | "done"
  | "pivot"
  | "excluded";

const TONE_CLASS: Record<CellTone, string> = {
  idle: "border-border bg-muted/30 text-muted-foreground",
  active: "border-ember-500/55 bg-ember-500/15 text-ember-200",
  compare: "border-viz-compare/55 bg-viz-compare/15 text-viz-compare",
  visited: "border-viz-visited/45 bg-viz-visited/12 text-viz-visited",
  done: "border-success/50 bg-success/12 text-success",
  pivot: "border-difficulty-hard/55 bg-difficulty-hard/15 text-difficulty-hard",
  excluded: "border-border/40 bg-transparent text-muted-foreground/35 line-through",
};

export function Cell({
  value,
  tone = "idle",
  label,
  index,
  showIndex = true,
}: {
  value: string | number;
  tone?: CellTone;
  /** Pointer marker rendered beneath the cell, e.g. "L" or "mid". */
  label?: string;
  index?: number;
  showIndex?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <div
        className={cn(
          "flex h-11 w-full items-center justify-center rounded-md border font-mono text-sm transition-colors duration-200",
          TONE_CLASS[tone]
        )}
      >
        {value}
      </div>

      {/* Fixed-height rails so nothing reflows as markers move. */}
      <div className="flex h-3.5 items-start justify-center">
        {label && (
          <span className="text-ember-400 font-mono text-[0.6rem] leading-none">
            {label}
          </span>
        )}
      </div>
      {showIndex && (
        <div className="text-muted-foreground/40 font-mono text-[0.6rem] leading-none">
          {index}
        </div>
      )}
    </div>
  );
}

export function CellRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-1 sm:gap-1.5">
      {children}
    </div>
  );
}
