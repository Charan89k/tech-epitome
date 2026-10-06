import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Workspace pane chrome shared by the design, LLD and interview pages:
 * a rounded panel with a 40px header whose label carries the ember
 * underline, matching `PaneTab` in the problem workspace.
 */

const UNDERLINE =
  "after:bg-ember-500 relative after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full";

export function Pane({
  label,
  icon: Icon,
  actions,
  className,
  bodyClassName,
  children,
  labelledBy,
  as: Label = "span",
}: {
  label: string;
  /** Render the label as a heading when the pane is a page section. */
  as?: "span" | "h2" | "h3";
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  /** Id for the label, so a wrapping section can be named by it. */
  labelledBy?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card/40 px-2">
        <Label
          id={labelledBy}
          className={cn(
            "flex h-10 items-center gap-1.5 px-3 text-xs font-medium text-foreground",
            UNDERLINE
          )}
        >
          {Icon && <Icon className="size-3.5 text-ember-400" />}
          {label}
        </Label>
        {actions && (
          <div className="ml-auto flex min-w-0 items-center gap-2 pr-1">{actions}</div>
        )}
      </div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}

/** A tab trigger in the underline style; the ember bar marks the active tab. */
export function UnderlineTab({
  value,
  icon: Icon,
  children,
  disabled,
  className,
}: {
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      className={cn(
        "relative h-10 flex-none rounded-none border-0 bg-transparent px-3 text-xs shadow-none after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-ember-500 after:opacity-0 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100 dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent",
        className
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </TabsTrigger>
  );
}

/** The tab strip that holds `UnderlineTab`s, as a pane header. */
export const UNDERLINE_TABS_LIST =
  "border-border bg-card/40 h-10 w-full justify-start rounded-none border-b bg-transparent p-0 px-2";
