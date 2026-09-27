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
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "border-border bg-card surface-edge rounded-lg border p-4",
        className
      )}
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}
