import { cn } from "@/lib/utils";

/**
 * The app's sectioned panel: `rounded-xl` card with a hairline header.
 *
 * The title is a real heading (h2 by default) so screen-reader users can
 * move between sections. `action` sits at the right of the header —
 * a "View all" link, a count. Body padding is the caller's choice: lists
 * and tables want to run edge to edge, forms want `p-4`.
 */
export function Panel({
  title,
  description,
  action,
  icon,
  as: Heading = "h2",
  id,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  as?: "h2" | "h3";
  id?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        {icon}
        <div className="min-w-0 flex-1">
          <Heading id={id} className="truncate text-sm font-semibold">
            {title}
          </Heading>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Thin progress track in the grouped-table style. */
export function Bar({
  percent,
  label,
  className,
  fillClassName = "bg-ember-500",
}: {
  percent: number;
  label: string;
  className?: string;
  fillClassName?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          fillClassName
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
