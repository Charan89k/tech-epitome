import { cn } from "@/lib/utils";

/**
 * Tech Epitome mark.
 *
 * The glyph is a capital F built out of graph nodes and edges: the product is
 * about seeing structure in problems, so the letterform is literally a small
 * graph. Nodes stay separable down to ~20px and the F silhouette survives at
 * 16px, which is the only size a favicon really has to work at.
 *
 * Drawn with currentColor by default so it inherits from context; pass
 * `brand` for the flat indigo used in the header, footer and favicon.
 */

type LogoMarkProps = {
  className?: string;
  /** Use the brand indigo instead of currentColor. */
  brand?: boolean;
};

export function LogoMark({ className, brand = false }: LogoMarkProps) {
  const stroke = brand ? "var(--brand-400)" : "currentColor";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      {/* Edges: spine top-to-bottom, then the two arms. */}
      <path
        d="M7 4.5V19.5M7 4.5H16.5M7 11.8H14"
        stroke={stroke}
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Nodes. The bottom spine node is hollow: the traversal is unfinished,
          which is the whole premise of a learning product. */}
      <circle cx="7" cy="4.5" r="2.5" fill={stroke} />
      <circle cx="16.5" cy="4.5" r="2.1" fill={stroke} />
      <circle cx="14" cy="11.8" r="2.1" fill={stroke} />
      <circle
        cx="7"
        cy="19.5"
        r="2.5"
        fill="var(--background)"
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  /** Hides the text on small screens, keeping only the mark. */
  responsive?: boolean;
};

export function Wordmark({ className, responsive = false }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-semibold tracking-tight select-none",
        responsive && "hidden sm:inline",
        className
      )}
    >
      Tech <span className="text-brand-500">Epitome</span>
    </span>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  brand?: boolean;
  responsive?: boolean;
};

/** Mark plus wordmark, the standard lockup. */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  brand = true,
  responsive = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark brand={brand} className={cn("size-6 shrink-0", markClassName)} />
      <Wordmark responsive={responsive} className={wordmarkClassName} />
      <span className="sr-only">Tech Epitome</span>
    </span>
  );
}
