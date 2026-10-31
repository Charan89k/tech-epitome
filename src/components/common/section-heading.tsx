import { cn } from "@/lib/utils";

/**
 * The heading row of a section inside an app page: title, an optional count
 * in mono, a one-line description and right-aligned actions. Pass `id` and
 * point the section's `aria-labelledby` at it.
 */
export function SectionHeading({
  id,
  title,
  count,
  description,
  actions,
  className,
}: {
  id: string;
  title: string;
  count?: number;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border pb-2.5",
        className
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="flex items-baseline gap-2 text-base font-semibold">
          {title}
          {count !== undefined && (
            <span
              aria-hidden="true"
              className="font-mono text-xs font-normal text-subtle-foreground tabular-nums"
            >
              {count}
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
