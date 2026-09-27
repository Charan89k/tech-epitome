import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Rendered in the middle of the ring. Defaults to the rounded percentage. */
  children?: React.ReactNode;
  label?: string;
};

/**
 * Circular progress. Pure SVG with no animation library - it renders on the
 * server, costs nothing, and the dash offset transition is enough motion.
 */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  className,
  children,
  label,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(pct)}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ember-500)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="tabular text-sm font-semibold">
            {Math.round(pct)}
            <span className="text-muted-foreground text-[0.65em]">%</span>
          </span>
        )}
      </span>
    </div>
  );
}
