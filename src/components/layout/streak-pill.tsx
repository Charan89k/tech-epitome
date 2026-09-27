import { Flame } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Current streak, shown in the top bar.
 *
 * Renders in a muted state at zero rather than disappearing, so the control
 * does not shift the layout the day a streak starts or breaks.
 */
export function StreakPill({ days }: { days: number }) {
  const active = days > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "border-border flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm",
            active
              ? "border-ember-500/25 bg-ember-500/8 text-ember-300"
              : "text-muted-foreground"
          )}
        >
          <Flame
            className={cn("size-4", active ? "text-ember-500" : "opacity-60")}
            aria-hidden="true"
          />
          <span className="tabular font-medium">{days}</span>
          <span className="sr-only">
            {days === 1 ? "1 day streak" : `${days} day streak`}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {active
          ? `${days}-day streak — keep it going`
          : "No streak yet. Finish something today to start one."}
      </TooltipContent>
    </Tooltip>
  );
}
