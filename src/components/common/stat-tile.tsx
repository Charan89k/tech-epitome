import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

/** A single number with its label. Tabular figures so columns line up. */
export function StatTile({ label, value, icon: Icon, hint, className }: StatTileProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5 text-ember-400/80" aria-hidden="true" />}
        {label}
      </div>
      <p className="tabular tracking-headline mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
