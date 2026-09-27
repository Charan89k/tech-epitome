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
 * `gradient` for the ember treatment used in the header and on the hero.
 */

type LogoMarkProps = {
  className?: string;
  /** Use the ember gradient instead of currentColor. */
  gradient?: boolean;
  /** Unique id suffix - required when several gradient marks share a page. */
  idSuffix?: string;
};

export function LogoMark({
  className,
  gradient = false,
  idSuffix = "default",
}: LogoMarkProps) {
  const gradientId = `cf-ember-${idSuffix}`;
  const stroke = gradient ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="4" y1="3" x2="20" y2="21">
            <stop offset="0%" stopColor="var(--ember-300)" />
            <stop offset="55%" stopColor="var(--ember-500)" />
            <stop offset="100%" stopColor="var(--ember-700)" />
          </linearGradient>
        </defs>
      )}

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
      Tech <span className="text-ember-500">Epitome</span>
    </span>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  gradient?: boolean;
  responsive?: boolean;
  idSuffix?: string;
};

/** Mark plus wordmark, the standard lockup. */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  gradient = true,
  responsive = false,
  idSuffix = "lockup",
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark
        gradient={gradient}
        idSuffix={idSuffix}
        className={cn("size-6 shrink-0", markClassName)}
      />
      <Wordmark responsive={responsive} className={wordmarkClassName} />
      <span className="sr-only">Tech Epitome</span>
    </span>
  );
}
