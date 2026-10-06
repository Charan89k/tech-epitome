import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn, route } from "@/lib/utils";

/**
 * A titled group of figures in one rounded panel, cells separated by
 * hairlines rather than each in its own card. Dense, for the admin area.
 */
export function StatPanel({
  id,
  title,
  description,
  stats,
  action,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  stats: { label: string; value: string | number }[];
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-semibold">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={route(action.href)}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-ember-300"
          >
            {action.label}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {/* Each cell draws its own right and bottom hairline; the negative
          margins tuck the outer ones under the panel border. */}
      <dl
        className={cn(
          "-mr-px -mb-px grid border-t border-border",
          stats.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col-reverse border-r border-b border-border px-4 py-3"
          >
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
