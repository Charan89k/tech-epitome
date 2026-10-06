import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Compact variant for empty states inside a card. */
  size?: "sm" | "md";
};

/**
 * The one empty state in the product.
 *
 * Empty is a real state, not a bug: a new account has no submissions and no
 * weak patterns, and saying so honestly is better than padding the screen
 * with fabricated sample data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "gap-3 px-6 py-12" : "gap-2 px-4 py-8",
        className
      )}
    >
      {Icon && (
        <div className="rounded-lg bg-ember-500/10 p-2.5 text-ember-400 ring-1 ring-ember-500/20">
          <Icon className={size === "md" ? "size-5" : "size-4"} aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <p
          className={cn(
            "font-medium text-foreground",
            size === "md" ? "text-sm" : "text-[0.8rem]"
          )}
        >
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
